"""
SIH26006 Freight Forecasting Platform — All API Endpoints

Base URL: /api/v1/

Endpoints:
  GET    /ports/                          — List all ports
  GET    /ports/<id>/                     — Port detail
  GET    /vessels/                        — List vessel classes
  GET    /vessels/<id>/                   — Vessel detail
  GET    /routes/                         — List routes
  GET    /routes/<id>/                    — Route detail
  GET    /rates/                          — List historical freight rates
  GET    /rates/<id>/                     — Rate detail
  GET    /forecasts/                      — List forecasts
  GET    /forecasts/<id>/                 — Forecast detail
  POST   /forecasts/generate/            — Trigger forecast generation
  GET    /charterers/                     — List charterers
  GET    /charterers/<id>/               — Charterer detail
  POST   /charterers/recalculate-scores/ — Recalculate all trust scores
  GET    /market-indices/                 — List market indices
  GET    /market-indices/latest/          — Latest index values
  GET    /macro-factors/                  — List macro factors
  GET    /macro-factors/latest/           — Latest macro factor values
  POST   /cost-breakdown/                — Calculate detailed landed cost
  POST   /recommendation/                — Generate buy/wait/delay recommendation
  POST   /port-feasibility/              — Check port/vessel compatibility
  GET    /port-traffic/                   — Port business/traffic indicators
  GET    /dashboard/                      — Aggregated dashboard summary
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from app.views import (
    PortViewSet, VesselViewSet, RouteViewSet,
    FreightRateHistoryViewSet, ForecastViewSet,
    ChartererViewSet, MarketIndexViewSet, MacroFactorViewSet,
    GenerateForecastView, CalculateCostView,
    GenerateRecommendationView, PortFeasibilityView,
    PortTrafficView, DashboardSummaryView,
)

router = DefaultRouter()
router.register(r'ports', PortViewSet, basename='port')
router.register(r'vessels', VesselViewSet, basename='vessel')
router.register(r'routes', RouteViewSet, basename='route')
router.register(r'rates', FreightRateHistoryViewSet, basename='rate')
router.register(r'forecasts', ForecastViewSet, basename='forecast')
router.register(r'charterers', ChartererViewSet, basename='charterer')
router.register(r'market-indices', MarketIndexViewSet, basename='market-index')
router.register(r'macro-factors', MacroFactorViewSet, basename='macro-factor')

urlpatterns = [
    # ViewSet routes
    path('', include(router.urls)),

    # Action endpoints (POST)
    path('forecasts/generate/', GenerateForecastView.as_view(), name='generate-forecast'),
    path('cost-breakdown/', CalculateCostView.as_view(), name='calculate-cost'),
    path('recommendation/', GenerateRecommendationView.as_view(), name='generate-recommendation'),
    path('port-feasibility/', PortFeasibilityView.as_view(), name='port-feasibility'),

    # Read-only computed endpoints (GET)
    path('port-traffic/', PortTrafficView.as_view(), name='port-traffic'),
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]
