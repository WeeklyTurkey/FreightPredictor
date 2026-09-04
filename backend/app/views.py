"""
SIH26006 Freight Forecasting Platform — All API Views

Organized by section:
  Section A — Route & Forecasting (Person A)
  Section B — Market & Business (Person B)

All views are in this single file per the architecture decision (§11).
Business logic is delegated to standalone modules:
  - app.forecasting
  - app.recommendation
  - app.trust_score
"""

import logging
from decimal import Decimal

from django.db.models import Max
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView

from app.models import (
    Port, Vessel, Route, FreightRateHistory, Forecast,
    Charterer, MarketIndex, MacroFactor, CostBreakdown, Recommendation,
)
from app.serializers import (
    PortSerializer, VesselSerializer, RouteSerializer, RouteListSerializer,
    FreightRateHistorySerializer, ForecastSerializer,
    ChartererSerializer, ChartererListSerializer,
    MarketIndexSerializer, MacroFactorSerializer,
    CostBreakdownSerializer, CostBreakdownRequestSerializer,
    RecommendationSerializer, RecommendationRequestSerializer,
    ForecastRequestSerializer,
    PortFeasibilityRequestSerializer, PortFeasibilityResponseSerializer,
)

logger = logging.getLogger(__name__)

# Default exchange rate for USD → INR
USD_TO_INR = Decimal('83.00')


# ===========================================================================
# SECTION A — Route & Forecasting Views (Person A owns)
# ===========================================================================


class PortViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve ports.
    Supports filtering by port_type: ?port_type=origin or ?port_type=destination
    """
    queryset = Port.objects.all()
    serializer_class = PortSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        port_type = self.request.query_params.get('port_type')
        if port_type in ('origin', 'destination'):
            qs = qs.filter(port_type=port_type)
        return qs


class VesselViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve vessel classes."""
    queryset = Vessel.objects.all()
    serializer_class = VesselSerializer


class RouteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve shipping routes.
    Supports filtering by:
      ?origin_port=<id>
      ?destination_port=<id>
    """
    queryset = Route.objects.select_related('origin_port', 'destination_port').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return RouteListSerializer
        return RouteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        origin = self.request.query_params.get('origin_port')
        dest = self.request.query_params.get('destination_port')
        if origin:
            qs = qs.filter(origin_port_id=origin)
        if dest:
            qs = qs.filter(destination_port_id=dest)
        return qs


class FreightRateHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Historical freight rates.
    Supports filtering by:
      ?route=<id>
      ?vessel_class=<id>
      ?commodity=<type>
      ?date_from=YYYY-MM-DD
      ?date_to=YYYY-MM-DD
    """
    queryset = FreightRateHistory.objects.select_related('route', 'vessel_class').all()
    serializer_class = FreightRateHistorySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        route = self.request.query_params.get('route')
        vessel = self.request.query_params.get('vessel_class')
        commodity = self.request.query_params.get('commodity')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if route:
            qs = qs.filter(route_id=route)
        if vessel:
            qs = qs.filter(vessel_class_id=vessel)
        if commodity:
            qs = qs.filter(commodity=commodity)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs


class ForecastViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Forecasted freight rates.
    Supports filtering by:
      ?route=<id>
      ?vessel_class=<id>
      ?commodity=<type>
      ?horizon_days=30|60|90
    """
    queryset = Forecast.objects.select_related('route', 'vessel_class').all()
    serializer_class = ForecastSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        route = self.request.query_params.get('route')
        vessel = self.request.query_params.get('vessel_class')
        commodity = self.request.query_params.get('commodity')
        horizon = self.request.query_params.get('horizon_days')

        if route:
            qs = qs.filter(route_id=route)
        if vessel:
            qs = qs.filter(vessel_class_id=vessel)
        if commodity:
            qs = qs.filter(commodity=commodity)
        if horizon:
            qs = qs.filter(horizon_days=horizon)
        return qs


class GenerateForecastView(APIView):
    """
    POST: Trigger forecast generation for a route/vessel/commodity combination.
    Uses Prophet or moving-average fallback.
    Feature A — Forecasting.
    """

    def post(self, request):
        serializer = ForecastRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from app.forecasting import save_forecasts

        try:
            count = save_forecasts(
                route_id=serializer.validated_data['route_id'],
                vessel_class_id=serializer.validated_data['vessel_class_id'],
                commodity=serializer.validated_data['commodity'],
                horizon_days=int(serializer.validated_data['horizon_days']),
            )
            return Response({
                'status': 'success',
                'message': f'Generated {count} forecast records.',
                'count': count,
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception("Forecast generation failed")
            return Response({
                'status': 'error',
                'message': str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PortFeasibilityView(APIView):
    """
    POST: Check if a port can accommodate the required vessel for the given cargo volume.
    Feature C — Automated Physical Constraint Verification.
    """

    def post(self, request):
        serializer = PortFeasibilityRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        port_id = serializer.validated_data['destination_port_id']
        vessel_id = serializer.validated_data['vessel_class_id']
        volume_mt = float(serializer.validated_data['volume_mt'])

        try:
            port = Port.objects.get(id=port_id, port_type='destination')
        except Port.DoesNotExist:
            return Response(
                {'error': 'Destination port not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            vessel = Vessel.objects.get(id=vessel_id)
        except Vessel.DoesNotExist:
            return Response(
                {'error': 'Vessel class not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ---------------------------------------------------------------
        # Determine required vessel based on volume
        # ---------------------------------------------------------------
        recommended_vessel = _recommend_vessel_for_volume(volume_mt)

        # ---------------------------------------------------------------
        # Check physical compatibility
        # ---------------------------------------------------------------
        warnings = []
        is_compatible = True

        if vessel.typical_draft > port.max_draft:
            is_compatible = False
            warnings.append(
                f"{port.name} Port max draft limit is {port.max_draft} metres. "
                f"{vessel.get_size_class_display()} vessel requires "
                f"{vessel.typical_draft} metres draft."
            )

        if vessel.typical_beam > port.max_beam:
            is_compatible = False
            warnings.append(
                f"{port.name} Port max beam is {port.max_beam} metres. "
                f"{vessel.get_size_class_display()} vessel has "
                f"{vessel.typical_beam} metres beam."
            )

        if vessel.typical_loa > port.max_loa:
            is_compatible = False
            warnings.append(
                f"{port.name} Port max LOA is {port.max_loa} metres. "
                f"{vessel.get_size_class_display()} vessel has "
                f"{vessel.typical_loa} metres LOA."
            )

        # Check if volume exceeds vessel capacity
        if volume_mt > vessel.max_dwt:
            warnings.append(
                f"Cargo volume ({volume_mt:,.0f} MT) exceeds "
                f"{vessel.get_size_class_display()} max capacity "
                f"({vessel.max_dwt:,} DWT). Consider a larger vessel class."
            )

        result = {
            'is_compatible': is_compatible,
            'port_name': port.name,
            'vessel_class': vessel.get_size_class_display(),
            'warnings': warnings,
            'recommended_vessel': recommended_vessel,
            'details': {
                'port_max_draft': port.max_draft,
                'port_max_beam': port.max_beam,
                'port_max_loa': port.max_loa,
                'vessel_draft': vessel.typical_draft,
                'vessel_beam': vessel.typical_beam,
                'vessel_loa': vessel.typical_loa,
                'cargo_volume_mt': volume_mt,
                'vessel_max_dwt': vessel.max_dwt,
            },
        }

        response_serializer = PortFeasibilityResponseSerializer(result)
        return Response(response_serializer.data)


# ===========================================================================
# SECTION B — Market & Business Views (Person B owns)
# ===========================================================================


class ChartererViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Charterers database with trust scores.
    Feature E — Charterers Database & Trust Scores.
    """
    queryset = Charterer.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            return ChartererListSerializer
        return ChartererSerializer

    @action(detail=False, methods=['post'], url_path='recalculate-scores')
    def recalculate_scores(self, request):
        """Trigger trust score recalculation for all charterers."""
        from app.trust_score import compute_all_trust_scores
        count = compute_all_trust_scores()
        return Response({
            'status': 'success',
            'message': f'Recalculated trust scores for {count} charterers.',
        })


class MarketIndexViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Baltic Dry Index and sub-indices.
    Feature A — BDI Live Metrics Card.
    Supports filtering by:
      ?index_type=BDI|BCI|BPI|BSI
      ?date_from=YYYY-MM-DD
      ?date_to=YYYY-MM-DD
    """
    queryset = MarketIndex.objects.all()
    serializer_class = MarketIndexSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        index_type = self.request.query_params.get('index_type')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if index_type:
            qs = qs.filter(index_type=index_type)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    @action(detail=False, methods=['get'], url_path='latest')
    def latest(self, request):
        """Get the most recent value for each index type."""
        results = []
        for index_type in ['BDI', 'BCI', 'BPI', 'BSI']:
            latest = MarketIndex.objects.filter(
                index_type=index_type
            ).order_by('-date').first()
            if latest:
                results.append(MarketIndexSerializer(latest).data)
        return Response(results)


class MacroFactorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Macro-economic factors affecting freight forecasts.
    Feature A — Macro Factor Breakdown Card.
    """
    queryset = MacroFactor.objects.all()
    serializer_class = MacroFactorSerializer

    @action(detail=False, methods=['get'], url_path='latest')
    def latest(self, request):
        """Get the most recent macro factor values."""
        latest = MacroFactor.objects.order_by('-date').first()
        if latest:
            return Response(MacroFactorSerializer(latest).data)
        return Response({'message': 'No macro factor data available.'}, status=404)


class CalculateCostView(APIView):
    """
    POST: Calculate detailed landed cost breakdown.
    Feature D — Cost Breakdown (button-triggered).
    """

    def post(self, request):
        serializer = CostBreakdownRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        route_id = serializer.validated_data['route_id']
        vessel_class_id = serializer.validated_data['vessel_class_id']
        commodity = serializer.validated_data['commodity']
        volume_mt = serializer.validated_data['volume_mt']

        # Get the latest freight rate for this route/vessel/commodity
        try:
            route = Route.objects.get(id=route_id)
            vessel = Vessel.objects.get(id=vessel_class_id)
        except (Route.DoesNotExist, Vessel.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Try to get forecasted rate first, then fall back to latest historical
        forecast = Forecast.objects.filter(
            route_id=route_id,
            vessel_class_id=vessel_class_id,
            commodity=commodity,
        ).order_by('forecast_date').first()

        if forecast:
            rate_per_ton = forecast.predicted_rate
        else:
            latest_rate = FreightRateHistory.objects.filter(
                route_id=route_id,
                vessel_class_id=vessel_class_id,
                commodity=commodity,
            ).order_by('-date').first()

            if not latest_rate:
                return Response(
                    {'error': 'No rate data available for this route/vessel/commodity combination.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            rate_per_ton = latest_rate.rate_usd_per_ton

        # ---------------------------------------------------------------
        # Calculate cost components
        # ---------------------------------------------------------------
        base_freight = volume_mt * rate_per_ton
        baf = base_freight * Decimal('0.08')               # ~8% BAF
        port_handling = volume_mt * Decimal('2.50')         # $2.50/MT
        demurrage_buffer = base_freight * Decimal('0.03')   # ~3% buffer

        total_usd = base_freight + baf + port_handling + demurrage_buffer
        total_inr = total_usd * USD_TO_INR

        # Save to database
        cost = CostBreakdown.objects.create(
            route=route,
            vessel_class=vessel,
            commodity=commodity,
            volume_mt=volume_mt,
            base_freight_cost=base_freight,
            bunker_adjustment_factor=baf,
            port_handling_charges=port_handling,
            demurrage_buffer=demurrage_buffer,
            total_landed_cost_usd=total_usd,
            total_landed_cost_inr=total_inr,
            usd_to_inr_rate=USD_TO_INR,
        )

        return Response(CostBreakdownSerializer(cost).data, status=status.HTTP_201_CREATED)


class GenerateRecommendationView(APIView):
    """
    POST: Generate a charter timing recommendation (Buy/Wait/Delay).
    Feature B — Strategic Buying Alert Banner.
    """

    def post(self, request):
        serializer = RecommendationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from app.recommendation import save_recommendation

        try:
            recommendation = save_recommendation(
                route_id=serializer.validated_data['route_id'],
                vessel_class_id=serializer.validated_data['vessel_class_id'],
                commodity=serializer.validated_data['commodity'],
                volume_mt=serializer.validated_data['volume_mt'],
            )
            return Response(
                RecommendationSerializer(recommendation).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            logger.exception("Recommendation generation failed")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PortTrafficView(APIView):
    """
    GET: Return traffic/business indicators for all destination ports.
    Feature F — Port Business / Ship Traffic Indicator.
    """

    def get(self, request):
        ports = Port.objects.filter(port_type='destination').values(
            'id', 'name', 'country',
            'ships_currently_at_port', 'expected_incoming_shipments',
        )
        return Response(list(ports))


class DashboardSummaryView(APIView):
    """
    GET: Aggregated dashboard summary for the frontend.
    Returns latest market indices, macro factors, and port traffic in one call.
    """

    def get(self, request):
        # Latest market indices
        market_indices = []
        for index_type in ['BDI', 'BCI', 'BPI', 'BSI']:
            latest = MarketIndex.objects.filter(
                index_type=index_type,
            ).order_by('-date').first()
            if latest:
                market_indices.append({
                    'index_type': latest.index_type,
                    'value': str(latest.value),
                    'change_pct_24h': str(latest.change_pct_24h),
                    'date': latest.date.isoformat(),
                })

        # Latest macro factors
        macro = MacroFactor.objects.order_by('-date').first()
        macro_data = None
        if macro:
            macro_data = {
                'bunker_fuel_price_usd': str(macro.bunker_fuel_price_usd),
                'port_congestion_index': str(macro.port_congestion_index),
                'seasonal_weather_impact': str(macro.seasonal_weather_impact),
                'date': macro.date.isoformat(),
            }

        # Port traffic
        port_traffic = list(Port.objects.filter(port_type='destination').values(
            'id', 'name', 'ships_currently_at_port', 'expected_incoming_shipments',
        ))

        # Counts
        summary = {
            'market_indices': market_indices,
            'macro_factors': macro_data,
            'port_traffic': port_traffic,
            'total_routes': Route.objects.count(),
            'total_charterers': Charterer.objects.count(),
            'total_rate_records': FreightRateHistory.objects.count(),
        }

        return Response(summary)


# ===========================================================================
# Helper Functions (private)
# ===========================================================================


def _recommend_vessel_for_volume(volume_mt):
    """
    Recommend the most appropriate vessel class based on cargo volume.

    Rules:
      - Up to 65,000 MT → Supramax
      - 65,001 – 85,000 MT → Panamax
      - 85,001+ MT → Capesize
    """
    if volume_mt <= 65000:
        return 'Supramax'
    elif volume_mt <= 85000:
        return 'Panamax'
    else:
        return 'Capesize'
