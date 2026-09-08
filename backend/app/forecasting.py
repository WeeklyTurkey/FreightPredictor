"""
SIH26006 — Freight Rate Forecasting Engine

Provides two forecasting strategies:
1. Prophet-based forecasting (when Prophet is available)
2. Moving-average fallback (lightweight, always available)

NOTE (Open Decision #1): This module currently operates on synthetic data
stored in the DB. The approach can be swapped to use real historical data
or live API feeds without changing the interface.

Usage:
    from app.forecasting import generate_forecast
    results = generate_forecast(route_id, vessel_class_id, commodity, horizon_days=90)

External regressors (all read via the Django ORM, never from JSON files):
    - bdi: MarketIndex(index_type='BDI') daily values.
    - bunker: BunkerFuelPrice.marine_gas_oil_usd daily values (VLSFO,
      kept current by load_real_data and fetch_market_prices).
    - congestion: MacroFactor.port_congestion_index daily values (global
      index — no per-port congestion history exists; Port traffic fields
      are point-in-time snapshots only).
    - weather_score: MacroFactor.seasonal_weather_impact (0–10) for
      historical rows; WeatherData.weather_impact_score (0–10) for the
      destination port on future rows.

Missing-data strategy:
    - History: regressors are joined on date; gaps of up to 7 days are
      forward-filled, rows still incomplete are dropped. Fewer than 10
      aligned rows → moving-average fallback (same as before).
    - Future: BDI/bunker/congestion use the latest value available as of
      the last historical date (forward-fill). Weather uses WeatherData
      for the destination port when present; dates beyond its coverage
      (e.g. 60/90-day horizons) reuse the latest seasonal score.
    - Any regressor failure → plain Prophet without regressors, then
      moving-average fallback, exactly as before.
"""

import logging
from datetime import timedelta
from decimal import Decimal

import pandas as pd
from django.utils import timezone

logger = logging.getLogger(__name__)


def generate_forecast(route_id, vessel_class_id, commodity, horizon_days=90):
    """
    Generate freight rate forecasts for a given route, vessel class, and commodity.

    Args:
        route_id (int): Primary key of the Route.
        vessel_class_id (int): Primary key of the Vessel.
        commodity (str): One of 'coking_coal', 'non_coking_coal', 'iron_ore', 'limestone'.
        horizon_days (int): Number of days to forecast (30, 60, or 90).

    Returns:
        list[dict]: List of forecast records with keys:
            - forecast_date (date)
            - predicted_rate (Decimal)
            - lower_bound (Decimal)
            - upper_bound (Decimal)
            - horizon_days (int)
    """
    from app.models import FreightRateHistory

    # Fetch historical rate data
    history = FreightRateHistory.objects.filter(
        route_id=route_id,
        vessel_class_id=vessel_class_id,
        commodity=commodity,
    ).order_by('date').values('date', 'rate_usd_per_ton')

    df = pd.DataFrame(list(history))

    if df.empty or len(df) < 10:
        logger.warning(
            "Insufficient historical data for route=%s vessel=%s commodity=%s. "
            "Need at least 10 records, got %d.",
            route_id, vessel_class_id, commodity, len(df),
        )
        return _fallback_forecast(horizon_days)

    # Try Prophet with external regressors first, then plain Prophet,
    # then moving-average fallback.
    try:
        return _prophet_with_regressors(df, route_id, horizon_days)
    except Exception as exc:
        logger.warning(
            "Regressor-based forecast failed (%s), trying plain Prophet.", exc
        )

    try:
        return _prophet_forecast(df, horizon_days)
    except Exception as exc:
        logger.warning("Prophet forecast failed (%s), using moving-average fallback.", exc)
        return _moving_average_forecast(df, horizon_days)


REGRESSOR_COLUMNS = ['bdi', 'bunker', 'congestion', 'weather_score']

# Maximum gap (days) filled by forward-fill when aligning regressors.
REGRESSOR_FILL_LIMIT = 7

# Minimum fully-aligned training rows required to fit Prophet with regressors.
MIN_REGRESSOR_ROWS = 10


def _order_bounds(predicted, lower, upper):
    """
    Enforce lower <= predicted <= upper on one prediction row.

    All three values already come from the same Prophet prediction row; this
    only repairs sub-cent inversions introduced by independent rounding, so
    the stored interval always brackets the forecast.
    """
    return predicted, min(lower, predicted), max(upper, predicted)


def _prophet_with_regressors(df, route_id, horizon_days):
    """
    Generate forecasts using Prophet with BDI, bunker, congestion and
    weather external regressors.

    Route-level mapping uses the route's destination port for weather data.

    Raises:
        Exception: On any missing-data or fitting problem; the caller falls
            back to plain Prophet and then the moving-average forecast.
    """
    from prophet import Prophet

    from app.models import (
        BunkerFuelPrice, MacroFactor, MarketIndex, Route, WeatherData,
    )

    try:
        destination_port_id = Route.objects.values_list(
            'destination_port_id', flat=True
        ).get(id=route_id)
    except Route.DoesNotExist as exc:
        raise ValueError(f"Route not found: {route_id}") from exc

    history = df.copy()
    history['date'] = pd.to_datetime(history['date']).dt.date
    min_date = history['date'].min()
    max_date = history['date'].max()

    # --- Load regressor time series via the ORM (never from JSON) ---
    bdi = {
        row['date']: float(row['value'])
        for row in MarketIndex.objects.filter(
            index_type='BDI', date__gte=min_date, date__lte=max_date,
        ).values('date', 'value')
    }
    macro = {
        row['date']: row
        for row in MacroFactor.objects.filter(
            date__gte=min_date, date__lte=max_date,
        ).values(
            'date', 'port_congestion_index', 'seasonal_weather_impact',
        )
    }
    vlsfo = {
        row['date']: float(row['marine_gas_oil_usd'])
        for row in BunkerFuelPrice.objects.filter(
            date__gte=min_date, date__lte=max_date,
        ).values('date', 'marine_gas_oil_usd')
    }

    aligned = pd.DataFrame({'date': sorted(history['date'].unique())})
    aligned['bdi'] = aligned['date'].map(bdi)
    aligned['bunker'] = aligned['date'].map(vlsfo)
    aligned['congestion'] = aligned['date'].map(
        lambda d: float(macro[d]['port_congestion_index']) if d in macro else None
    )
    aligned['weather_score'] = aligned['date'].map(
        lambda d: float(macro[d]['seasonal_weather_impact']) if d in macro else None
    )
    aligned[REGRESSOR_COLUMNS] = aligned[REGRESSOR_COLUMNS].ffill(
        limit=REGRESSOR_FILL_LIMIT
    )

    train = history.merge(aligned, on='date', how='left').dropna(
        subset=REGRESSOR_COLUMNS
    )
    if len(train) < MIN_REGRESSOR_ROWS:
        raise ValueError(
            f"Only {len(train)} aligned regressor rows for route={route_id}; "
            f"need at least {MIN_REGRESSOR_ROWS}."
        )

    # --- Standardize regressors with training statistics ---
    means = train[REGRESSOR_COLUMNS].mean()
    stds = train[REGRESSOR_COLUMNS].std().replace(0, 1)

    prophet_df = train.rename(columns={'date': 'ds', 'rate_usd_per_ton': 'y'})
    prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])
    prophet_df['y'] = prophet_df['y'].astype(float)
    prophet_df[REGRESSOR_COLUMNS] = (
        prophet_df[REGRESSOR_COLUMNS] - means
    ) / stds

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
    )
    for column in REGRESSOR_COLUMNS:
        model.add_regressor(column)
    model.fit(prophet_df)

    # --- Future regressor values (no data leakage: nothing past max_date
    # is used for training; future rows use forward-fill + synthetic weather) ---
    last_bdi = train['bdi'].iloc[-1]
    last_bunker = train['bunker'].iloc[-1]
    last_congestion = train['congestion'].iloc[-1]
    last_seasonal = train['weather_score'].iloc[-1]

    future_weather = {
        row['date']: float(row['weather_impact_score'])
        for row in WeatherData.objects.filter(
            port_id=destination_port_id, date__gt=max_date,
        ).values('date', 'weather_impact_score')
    }

    future_dates = [max_date + timedelta(days=i) for i in range(1, horizon_days + 1)]
    future = pd.DataFrame({
        'ds': pd.to_datetime(future_dates),
        'bdi': [(b - means['bdi']) / stds['bdi'] for b in [last_bdi] * horizon_days],
        'bunker': [(b - means['bunker']) / stds['bunker'] for b in [last_bunker] * horizon_days],
        'congestion': [
            (c - means['congestion']) / stds['congestion']
            for c in [last_congestion] * horizon_days
        ],
        'weather_score': [
            (future_weather.get(d, last_seasonal) - means['weather_score'])
            / stds['weather_score']
            for d in future_dates
        ],
    })

    prediction = model.predict(future)

    results = []
    for i, (_, row) in enumerate(prediction.iterrows()):
        predicted, lower, upper = _order_bounds(
            round(max(row['yhat'], 0), 2),
            round(max(row['yhat_lower'], 0), 2),
            round(max(row['yhat_upper'], 0), 2),
        )
        results.append({
            'forecast_date': future_dates[i],
            'predicted_rate': Decimal(str(predicted)),
            'lower_bound': Decimal(str(lower)),
            'upper_bound': Decimal(str(upper)),
            'horizon_days': horizon_days,
        })

    return results


def _prophet_forecast(df, horizon_days):
    """
    Generate forecasts using Facebook Prophet.

    Expects a DataFrame with columns: 'date', 'rate_usd_per_ton'.
    """
    from prophet import Prophet

    # Prophet expects columns named 'ds' and 'y'
    prophet_df = df.rename(columns={'date': 'ds', 'rate_usd_per_ton': 'y'})
    prophet_df['y'] = prophet_df['y'].astype(float)

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
    )
    model.fit(prophet_df)

    # Create future dataframe
    future = model.make_future_dataframe(periods=horizon_days)
    prediction = model.predict(future)

    # Extract only the forecasted portion (beyond historical data)
    last_historical_date = df['date'].max()
    forecast_rows = prediction[prediction['ds'].dt.date > last_historical_date]

    results = []
    for _, row in forecast_rows.iterrows():
        predicted, lower, upper = _order_bounds(
            round(max(row['yhat'], 0), 2),
            round(max(row['yhat_lower'], 0), 2),
            round(max(row['yhat_upper'], 0), 2),
        )
        results.append({
            'forecast_date': row['ds'].date(),
            'predicted_rate': Decimal(str(predicted)),
            'lower_bound': Decimal(str(lower)),
            'upper_bound': Decimal(str(upper)),
            'horizon_days': horizon_days,
        })

    return results


def _moving_average_forecast(df, horizon_days):
    """
    Simple moving-average forecast as a fallback when Prophet is unavailable.
    Uses a 30-day rolling window and adds synthetic uncertainty bands.
    """
    df = df.copy()
    df['rate_usd_per_ton'] = df['rate_usd_per_ton'].astype(float)

    window = min(30, len(df))
    recent_rates = df['rate_usd_per_ton'].tail(window)
    mean_rate = recent_rates.mean()
    std_rate = recent_rates.std() if len(recent_rates) > 1 else mean_rate * 0.05

    last_date = df['date'].max()
    results = []

    for i in range(1, horizon_days + 1):
        forecast_date = last_date + timedelta(days=i)
        # Add slight trend (random walk centered on mean)
        drift = (i / horizon_days) * std_rate * 0.3
        predicted = max(mean_rate + drift, 0)

        results.append({
            'forecast_date': forecast_date,
            'predicted_rate': Decimal(str(round(predicted, 2))),
            'lower_bound': Decimal(str(round(max(predicted - 1.96 * std_rate, 0), 2))),
            'upper_bound': Decimal(str(round(predicted + 1.96 * std_rate, 2))),
            'horizon_days': horizon_days,
        })

    return results


def _fallback_forecast(horizon_days):
    """
    Generate a placeholder forecast when no historical data exists.
    Returns flat-line estimates based on industry-average rates.
    """
    today = timezone.now().date()
    base_rate = Decimal('15.00')  # Industry average placeholder

    results = []
    for i in range(1, horizon_days + 1):
        forecast_date = today + timedelta(days=i)
        results.append({
            'forecast_date': forecast_date,
            'predicted_rate': base_rate,
            'lower_bound': base_rate * Decimal('0.85'),
            'upper_bound': base_rate * Decimal('1.15'),
            'horizon_days': horizon_days,
        })

    return results


def save_forecasts(route_id, vessel_class_id, commodity, horizon_days=90):
    """
    Generate forecasts and persist them to the database.
    Clears existing forecasts for the same parameters before saving.

    Returns:
        int: Number of forecast records saved.
    """
    from app.models import Forecast

    forecasts = generate_forecast(route_id, vessel_class_id, commodity, horizon_days)

    # Clear stale forecasts for this combination
    Forecast.objects.filter(
        route_id=route_id,
        vessel_class_id=vessel_class_id,
        commodity=commodity,
        horizon_days=horizon_days,
    ).delete()

    # Bulk create new forecasts
    forecast_objects = [
        Forecast(
            route_id=route_id,
            vessel_class_id=vessel_class_id,
            commodity=commodity,
            **f,
        )
        for f in forecasts
    ]
    Forecast.objects.bulk_create(forecast_objects)

    logger.info(
        "Saved %d forecast records for route=%s vessel=%s commodity=%s horizon=%d",
        len(forecast_objects), route_id, vessel_class_id, commodity, horizon_days,
    )
    return len(forecast_objects)
