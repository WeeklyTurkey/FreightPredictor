"""
SIH26006 Freight Forecasting Platform — Admin Site Configuration

Registers all models with the Django admin for data inspection and management.
"""

from django.contrib import admin
from app.models import (
    Port, Vessel, Route, FreightRateHistory, Forecast,
    Charterer, MarketIndex, MacroFactor, CostBreakdown, Recommendation,
)


@admin.register(Port)
class PortAdmin(admin.ModelAdmin):
    list_display = ['name', 'country', 'port_type', 'max_draft', 'ships_currently_at_port', 'expected_incoming_shipments']
    list_filter = ['port_type', 'country']
    search_fields = ['name', 'country']


@admin.register(Vessel)
class VesselAdmin(admin.ModelAdmin):
    list_display = ['size_class', 'min_dwt', 'max_dwt', 'typical_draft', 'typical_beam', 'typical_loa']
    list_filter = ['size_class']


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'distance_nautical_miles', 'typical_transit_days']
    list_filter = ['destination_port__name']
    search_fields = ['origin_port__name', 'destination_port__name']


@admin.register(FreightRateHistory)
class FreightRateHistoryAdmin(admin.ModelAdmin):
    list_display = ['route', 'vessel_class', 'commodity', 'date', 'rate_usd_per_ton']
    list_filter = ['commodity', 'vessel_class__size_class', 'date']
    search_fields = ['route__origin_port__name', 'route__destination_port__name']
    date_hierarchy = 'date'


@admin.register(Forecast)
class ForecastAdmin(admin.ModelAdmin):
    list_display = ['route', 'vessel_class', 'commodity', 'forecast_date', 'predicted_rate', 'horizon_days']
    list_filter = ['commodity', 'horizon_days', 'vessel_class__size_class']
    date_hierarchy = 'forecast_date'


@admin.register(Charterer)
class ChartererAdmin(admin.ModelAdmin):
    list_display = ['name', 'country', 'trust_score', 'trust_grade', 'on_time_delivery_pct', 'total_voyages']
    list_filter = ['trust_grade', 'country']
    search_fields = ['name', 'country']
    readonly_fields = ['trust_score', 'trust_grade']


@admin.register(MarketIndex)
class MarketIndexAdmin(admin.ModelAdmin):
    list_display = ['index_type', 'date', 'value', 'change_pct_24h']
    list_filter = ['index_type']
    date_hierarchy = 'date'


@admin.register(MacroFactor)
class MacroFactorAdmin(admin.ModelAdmin):
    list_display = ['date', 'bunker_fuel_price_usd', 'port_congestion_index', 'seasonal_weather_impact']
    date_hierarchy = 'date'


@admin.register(CostBreakdown)
class CostBreakdownAdmin(admin.ModelAdmin):
    list_display = ['route', 'vessel_class', 'commodity', 'volume_mt', 'total_landed_cost_usd', 'created_at']
    list_filter = ['commodity']
    readonly_fields = [
        'base_freight_cost', 'bunker_adjustment_factor',
        'port_handling_charges', 'demurrage_buffer',
        'total_landed_cost_usd', 'total_landed_cost_inr',
    ]


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['route', 'vessel_class', 'commodity', 'signal', 'generated_at']
    list_filter = ['signal', 'commodity']
    readonly_fields = ['signal', 'rationale', 'financial_impact_usd', 'financial_impact_inr']
