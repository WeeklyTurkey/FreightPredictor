"""
SIH26006 — Charter Timing Recommendation Engine

Rule-based algorithm that produces Buy/Wait/Delay signals based on:
1. Short-term forecast trend (14–30 day prediction slope)
2. Current rate vs. forecast comparison
3. Market volatility (standard deviation of recent rates)

Feature B — Optimal Procurement & Charter Timing Recommendation.

Usage:
    from app.recommendation import generate_recommendation
    result = generate_recommendation(route_id, vessel_class_id, commodity, volume_mt)
"""

import logging
from datetime import timedelta
from decimal import Decimal

import pandas as pd
from django.utils import timezone

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Thresholds for buy/wait/delay classification
# ---------------------------------------------------------------------------
RISE_THRESHOLD_PCT = 3.0     # Rate predicted to rise >3% → BUY NOW
DROP_THRESHOLD_PCT = -3.0    # Rate predicted to drop >3% → DELAY
VOLATILITY_THRESHOLD = 0.15  # Coefficient of variation >15% → WAIT/STAGGER

# Default USD → INR rate for financial impact estimate
DEFAULT_USD_TO_INR = Decimal('83.00')


def generate_recommendation(route_id, vessel_class_id, commodity, volume_mt):
    """
    Generate a charter timing recommendation.

    Args:
        route_id (int): Route primary key.
        vessel_class_id (int): Vessel primary key.
        commodity (str): Commodity type string.
        volume_mt (float|Decimal): Cargo volume in Metric Tons.

    Returns:
        dict: {
            'signal': str ('BUY_NOW' | 'WAIT' | 'DELAY'),
            'rationale': str,
            'financial_impact_usd': Decimal | None,
            'financial_impact_inr': Decimal | None,
        }
    """
    from app.models import FreightRateHistory, Forecast

    volume_mt = Decimal(str(volume_mt))
    today = timezone.now().date()

    # -----------------------------------------------------------------------
    # 1. Get current rate (most recent historical)
    # -----------------------------------------------------------------------
    current_rate_qs = FreightRateHistory.objects.filter(
        route_id=route_id,
        vessel_class_id=vessel_class_id,
        commodity=commodity,
    ).order_by('-date').first()

    if not current_rate_qs:
        return {
            'signal': 'WAIT',
            'rationale': 'Insufficient data to generate a recommendation. '
                         'No historical freight rate records found for this route/commodity.',
            'financial_impact_usd': None,
            'financial_impact_inr': None,
        }

    current_rate = current_rate_qs.rate_usd_per_ton

    # -----------------------------------------------------------------------
    # 2. Get short-term forecast (14–30 days ahead)
    # -----------------------------------------------------------------------
    forecast_window_start = today + timedelta(days=14)
    forecast_window_end = today + timedelta(days=30)

    forecasts = Forecast.objects.filter(
        route_id=route_id,
        vessel_class_id=vessel_class_id,
        commodity=commodity,
        forecast_date__gte=forecast_window_start,
        forecast_date__lte=forecast_window_end,
    ).values_list('predicted_rate', flat=True)

    if not forecasts:
        return {
            'signal': 'WAIT',
            'rationale': 'No forecast data available for the 14–30 day window. '
                         'Run the forecasting engine first.',
            'financial_impact_usd': None,
            'financial_impact_inr': None,
        }

    # -----------------------------------------------------------------------
    # 3. Compute trend metrics
    # -----------------------------------------------------------------------
    forecast_rates = [float(r) for r in forecasts]
    avg_forecast_rate = sum(forecast_rates) / len(forecast_rates)
    current_rate_float = float(current_rate)

    # Percentage change: (forecast - current) / current * 100
    pct_change = ((avg_forecast_rate - current_rate_float) / current_rate_float) * 100

    # -----------------------------------------------------------------------
    # 4. Check volatility from recent historical data
    # -----------------------------------------------------------------------
    recent_history = FreightRateHistory.objects.filter(
        route_id=route_id,
        vessel_class_id=vessel_class_id,
        commodity=commodity,
        date__gte=today - timedelta(days=30),
    ).values_list('rate_usd_per_ton', flat=True)

    recent_rates = [float(r) for r in recent_history]
    if len(recent_rates) > 1:
        mean_rate = sum(recent_rates) / len(recent_rates)
        std_rate = (sum((r - mean_rate) ** 2 for r in recent_rates) / len(recent_rates)) ** 0.5
        cv = std_rate / mean_rate if mean_rate > 0 else 0
    else:
        cv = 0

    # -----------------------------------------------------------------------
    # 5. Decision logic
    # -----------------------------------------------------------------------
    rate_diff = Decimal(str(round(avg_forecast_rate - current_rate_float, 2)))

    if cv > VOLATILITY_THRESHOLD:
        signal = 'WAIT'
        rationale = (
            f"Market volatility is high (CV={cv:.1%}). The freight rate has been "
            f"fluctuating significantly over the past 30 days. Consider splitting "
            f"procurement into smaller batches to mitigate risk."
        )
    elif pct_change > RISE_THRESHOLD_PCT:
        signal = 'BUY_NOW'
        rationale = (
            f"Rates are predicted to rise by {pct_change:.1f}% over the next 14–30 days "
            f"(current: ${current_rate}/MT → forecast avg: ${avg_forecast_rate:.2f}/MT). "
            f"Booking now is recommended to lock in the lower rate."
        )
    elif pct_change < DROP_THRESHOLD_PCT:
        signal = 'DELAY'
        rationale = (
            f"Rates are predicted to drop by {abs(pct_change):.1f}% over the next 14–30 days "
            f"(current: ${current_rate}/MT → forecast avg: ${avg_forecast_rate:.2f}/MT). "
            f"Delaying booking could result in significant savings."
        )
    else:
        signal = 'WAIT'
        rationale = (
            f"Rates are relatively stable (predicted change: {pct_change:+.1f}%). "
            f"No strong signal to buy or delay. Monitor the market and consider "
            f"staggering procurement."
        )

    # -----------------------------------------------------------------------
    # 6. Financial impact estimate
    # -----------------------------------------------------------------------
    financial_impact_usd = abs(rate_diff * volume_mt)
    financial_impact_inr = financial_impact_usd * DEFAULT_USD_TO_INR

    return {
        'signal': signal,
        'rationale': rationale,
        'financial_impact_usd': financial_impact_usd,
        'financial_impact_inr': financial_impact_inr,
    }


def save_recommendation(route_id, vessel_class_id, commodity, volume_mt):
    """
    Generate and persist a recommendation to the database.

    Returns:
        app.models.Recommendation: The saved recommendation instance.
    """
    from app.models import Recommendation

    result = generate_recommendation(route_id, vessel_class_id, commodity, volume_mt)

    recommendation = Recommendation.objects.create(
        route_id=route_id,
        vessel_class_id=vessel_class_id,
        commodity=commodity,
        signal=result['signal'],
        rationale=result['rationale'],
        financial_impact_usd=result['financial_impact_usd'],
        financial_impact_inr=result['financial_impact_inr'],
    )

    logger.info("Saved recommendation: %s for route=%s", result['signal'], route_id)
    return recommendation
