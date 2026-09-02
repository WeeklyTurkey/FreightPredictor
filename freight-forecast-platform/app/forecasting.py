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

    # Try Prophet first, fall back to moving average
    try:
        return _prophet_forecast(df, horizon_days)
    except Exception as exc:
        logger.warning("Prophet forecast failed (%s), using moving-average fallback.", exc)
        return _moving_average_forecast(df, horizon_days)


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
        results.append({
            'forecast_date': row['ds'].date(),
            'predicted_rate': Decimal(str(round(max(row['yhat'], 0), 2))),
            'lower_bound': Decimal(str(round(max(row['yhat_lower'], 0), 2))),
            'upper_bound': Decimal(str(round(max(row['yhat_upper'], 0), 2))),
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
