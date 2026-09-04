"""
SIH26006 Freight Forecasting Platform — All DRF Serializers

Organized by section:
  Section A — Route & Forecasting (Person A)
  Section B — Market & Business (Person B)
"""

from rest_framework import serializers
from app.models import (
    Port, Vessel, Route, FreightRateHistory, Forecast,
    Charterer, MarketIndex, MacroFactor, CostBreakdown, Recommendation,
)


# ===========================================================================
# SECTION A — Route & Forecasting Serializers (Person A owns)
# ===========================================================================


class PortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Port
        fields = '__all__'


class PortSummarySerializer(serializers.ModelSerializer):
    """Lightweight port representation for nested use."""
    class Meta:
        model = Port
        fields = ['id', 'name', 'country', 'port_type']


class VesselSerializer(serializers.ModelSerializer):
    size_class_display = serializers.CharField(source='get_size_class_display', read_only=True)

    class Meta:
        model = Vessel
        fields = '__all__'


class RouteSerializer(serializers.ModelSerializer):
    origin_port = PortSummarySerializer(read_only=True)
    destination_port = PortSummarySerializer(read_only=True)
    origin_port_id = serializers.PrimaryKeyRelatedField(
        queryset=Port.objects.filter(port_type='origin'),
        source='origin_port',
        write_only=True,
    )
    destination_port_id = serializers.PrimaryKeyRelatedField(
        queryset=Port.objects.filter(port_type='destination'),
        source='destination_port',
        write_only=True,
    )

    class Meta:
        model = Route
        fields = [
            'id', 'origin_port', 'destination_port',
            'origin_port_id', 'destination_port_id',
            'distance_nautical_miles', 'typical_transit_days',
        ]


class RouteListSerializer(serializers.ModelSerializer):
    """Flat route representation for list views."""
    origin_port_name = serializers.CharField(source='origin_port.name', read_only=True)
    origin_country = serializers.CharField(source='origin_port.country', read_only=True)
    destination_port_name = serializers.CharField(source='destination_port.name', read_only=True)

    class Meta:
        model = Route
        fields = [
            'id', 'origin_port_name', 'origin_country',
            'destination_port_name', 'distance_nautical_miles',
            'typical_transit_days',
        ]


class FreightRateHistorySerializer(serializers.ModelSerializer):
    route_display = serializers.StringRelatedField(source='route', read_only=True)
    vessel_class_name = serializers.CharField(source='vessel_class.size_class', read_only=True)

    class Meta:
        model = FreightRateHistory
        fields = [
            'id', 'route', 'route_display', 'vessel_class', 'vessel_class_name',
            'commodity', 'date', 'rate_usd_per_ton',
        ]


class ForecastSerializer(serializers.ModelSerializer):
    route_display = serializers.StringRelatedField(source='route', read_only=True)
    vessel_class_name = serializers.CharField(source='vessel_class.size_class', read_only=True)

    class Meta:
        model = Forecast
        fields = [
            'id', 'route', 'route_display', 'vessel_class', 'vessel_class_name',
            'commodity', 'forecast_date', 'predicted_rate',
            'lower_bound', 'upper_bound', 'horizon_days', 'generated_at',
        ]


# ===========================================================================
# SECTION B — Market & Business Serializers (Person B owns)
# ===========================================================================


class ChartererSerializer(serializers.ModelSerializer):
    class Meta:
        model = Charterer
        fields = '__all__'
        read_only_fields = ['trust_score', 'trust_grade']


class ChartererListSerializer(serializers.ModelSerializer):
    """Lightweight charterer for list views."""
    class Meta:
        model = Charterer
        fields = ['id', 'name', 'country', 'trust_score', 'trust_grade', 'total_voyages']


class MarketIndexSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketIndex
        fields = '__all__'


class MacroFactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = MacroFactor
        fields = '__all__'


class CostBreakdownSerializer(serializers.ModelSerializer):
    route_display = serializers.StringRelatedField(source='route', read_only=True)
    vessel_class_name = serializers.CharField(source='vessel_class.size_class', read_only=True)

    class Meta:
        model = CostBreakdown
        fields = '__all__'
        read_only_fields = [
            'base_freight_cost', 'bunker_adjustment_factor',
            'port_handling_charges', 'demurrage_buffer',
            'total_landed_cost_usd', 'total_landed_cost_inr',
            'usd_to_inr_rate', 'created_at',
        ]


class CostBreakdownRequestSerializer(serializers.Serializer):
    """Input serializer for cost calculation requests."""
    route_id = serializers.IntegerField()
    vessel_class_id = serializers.IntegerField()
    commodity = serializers.ChoiceField(choices=[
        'coking_coal', 'non_coking_coal', 'iron_ore', 'limestone',
    ])
    volume_mt = serializers.DecimalField(max_digits=12, decimal_places=2)


class RecommendationSerializer(serializers.ModelSerializer):
    route_display = serializers.StringRelatedField(source='route', read_only=True)
    vessel_class_name = serializers.CharField(source='vessel_class.size_class', read_only=True)

    class Meta:
        model = Recommendation
        fields = '__all__'


class RecommendationRequestSerializer(serializers.Serializer):
    """Input serializer for recommendation requests."""
    route_id = serializers.IntegerField()
    vessel_class_id = serializers.IntegerField()
    commodity = serializers.ChoiceField(choices=[
        'coking_coal', 'non_coking_coal', 'iron_ore', 'limestone',
    ])
    volume_mt = serializers.DecimalField(max_digits=12, decimal_places=2)


class ForecastRequestSerializer(serializers.Serializer):
    """Input serializer for forecast generation requests."""
    route_id = serializers.IntegerField()
    vessel_class_id = serializers.IntegerField()
    commodity = serializers.ChoiceField(choices=[
        'coking_coal', 'non_coking_coal', 'iron_ore', 'limestone',
    ])
    horizon_days = serializers.ChoiceField(
        choices=[30, 60, 90],
        default=90,
    )


class PortFeasibilityRequestSerializer(serializers.Serializer):
    """Input serializer for port feasibility checks (Feature C)."""
    destination_port_id = serializers.IntegerField()
    vessel_class_id = serializers.IntegerField()
    volume_mt = serializers.DecimalField(max_digits=12, decimal_places=2)


class PortFeasibilityResponseSerializer(serializers.Serializer):
    """Response serializer for port feasibility checks."""
    is_compatible = serializers.BooleanField()
    port_name = serializers.CharField()
    vessel_class = serializers.CharField()
    warnings = serializers.ListField(child=serializers.CharField())
    recommended_vessel = serializers.CharField(allow_null=True)
    details = serializers.DictField()
