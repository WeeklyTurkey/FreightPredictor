"""
SIH26006 Freight Forecasting Platform — API Tests

Tests for all major API endpoints and business logic modules.
Run with: python manage.py test tests
"""

from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from app.models import (
    Port, Vessel, Route, FreightRateHistory, Forecast,
    Charterer, MarketIndex, MacroFactor, WeatherData,
)
from app.trust_score import compute_trust_score, compute_all_trust_scores


# ===========================================================================
# Model Tests
# ===========================================================================


class PortModelTest(TestCase):
    def test_create_port(self):
        port = Port.objects.create(
            name="Haldia", country="India",
            port_type="destination", max_draft=7.5,
        )
        self.assertEqual(str(port), "Haldia, India")
        self.assertEqual(port.max_draft, 7.5)

    def test_unique_constraint(self):
        Port.objects.create(name="Haldia", country="India", port_type="destination")
        with self.assertRaises(Exception):
            Port.objects.create(name="Haldia", country="India", port_type="destination")


class VesselModelTest(TestCase):
    def test_create_vessel(self):
        vessel = Vessel.objects.create(
            size_class="capesize",
            min_dwt=100000, max_dwt=200000,
            typical_draft=17.0, typical_beam=46.0, typical_loa=290.0,
        )
        self.assertIn("Capesize", str(vessel))
        self.assertEqual(vessel.min_dwt, 100000)


# ===========================================================================
# Trust Score Tests
# ===========================================================================


class TrustScoreTest(TestCase):
    def setUp(self):
        self.good_charterer = Charterer.objects.create(
            name="Good Shipping Co",
            country="Singapore",
            on_time_delivery_pct=95.0,
            cargo_damage_incidents=0,
            payment_reliability_pct=98.0,
            total_voyages=600,
            years_in_operation=25,
        )
        self.poor_charterer = Charterer.objects.create(
            name="Bad Shipping Co",
            country="Unknown",
            on_time_delivery_pct=55.0,
            cargo_damage_incidents=5,
            payment_reliability_pct=60.0,
            total_voyages=30,
            years_in_operation=2,
        )

    def test_good_charterer_high_score(self):
        score, grade = compute_trust_score(self.good_charterer)
        self.assertGreater(score, 80)
        self.assertIn(grade, ['A+', 'A'])

    def test_poor_charterer_low_score(self):
        score, grade = compute_trust_score(self.poor_charterer)
        self.assertLess(score, 60)

    def test_batch_update(self):
        count = compute_all_trust_scores()
        self.assertEqual(count, 2)
        self.good_charterer.refresh_from_db()
        self.assertGreater(self.good_charterer.trust_score, 0)
        self.assertNotEqual(self.good_charterer.trust_grade, '')


# ===========================================================================
# API Endpoint Tests
# ===========================================================================


class PortAPITest(APITestCase):
    def setUp(self):
        self.origin = Port.objects.create(
            name="Newcastle", country="Australia",
            port_type="origin", max_draft=15.2,
        )
        self.dest = Port.objects.create(
            name="Haldia", country="India",
            port_type="destination", max_draft=7.5,
        )

    def test_list_ports(self):
        response = self.client.get('/api/v1/ports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_ports_by_type(self):
        response = self.client.get('/api/v1/ports/?port_type=destination')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_port_detail(self):
        response = self.client.get(f'/api/v1/ports/{self.dest.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Haldia')


class VesselAPITest(APITestCase):
    def setUp(self):
        self.vessel = Vessel.objects.create(
            size_class="panamax",
            min_dwt=70000, max_dwt=85000,
            typical_draft=13.5, typical_beam=32.3, typical_loa=225.0,
        )

    def test_list_vessels(self):
        response = self.client.get('/api/v1/vessels/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_vessel_detail(self):
        response = self.client.get(f'/api/v1/vessels/{self.vessel.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class RouteAPITest(APITestCase):
    def setUp(self):
        self.origin = Port.objects.create(
            name="Newcastle", country="Australia", port_type="origin",
        )
        self.dest = Port.objects.create(
            name="Haldia", country="India", port_type="destination",
        )
        self.route = Route.objects.create(
            origin_port=self.origin,
            destination_port=self.dest,
            distance_nautical_miles=6800,
            typical_transit_days=19,
        )

    def test_list_routes(self):
        response = self.client.get('/api/v1/routes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ChartererAPITest(APITestCase):
    def setUp(self):
        Charterer.objects.create(
            name="Test Charterer", country="India",
            on_time_delivery_pct=90, payment_reliability_pct=85,
            total_voyages=200, years_in_operation=15,
            trust_score=82.5, trust_grade="B",
        )

    def test_list_charterers(self):
        response = self.client.get('/api/v1/charterers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_recalculate_scores(self):
        response = self.client.post('/api/v1/charterers/recalculate-scores/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('success', response.data['status'])


class PortFeasibilityAPITest(APITestCase):
    def setUp(self):
        self.haldia = Port.objects.create(
            name="Haldia", country="India",
            port_type="destination", max_draft=7.5, max_beam=36.0,
        )
        self.capesize = Vessel.objects.create(
            size_class="capesize",
            min_dwt=100000, max_dwt=200000,
            typical_draft=17.0, typical_beam=46.0, typical_loa=290.0,
        )
        self.supramax = Vessel.objects.create(
            size_class="supramax",
            min_dwt=50000, max_dwt=65000,
            typical_draft=12.2, typical_beam=32.2, typical_loa=190.0,
        )

    def test_incompatible_port_vessel(self):
        """Capesize should be incompatible with Haldia (draft 17.0 > 7.5)."""
        response = self.client.post('/api/v1/port-feasibility/', {
            'destination_port_id': self.haldia.id,
            'vessel_class_id': self.capesize.id,
            'volume_mt': 120000,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_compatible'])
        self.assertTrue(len(response.data['warnings']) > 0)

    def test_volume_based_recommendation(self):
        """Should recommend appropriate vessel for volume."""
        response = self.client.post('/api/v1/port-feasibility/', {
            'destination_port_id': self.haldia.id,
            'vessel_class_id': self.supramax.id,
            'volume_mt': 55000,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['recommended_vessel'], 'Supramax')


class DashboardAPITest(APITestCase):
    def test_dashboard_summary(self):
        response = self.client.get('/api/v1/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('market_indices', response.data)
        self.assertIn('port_traffic', response.data)
        self.assertIn('total_routes', response.data)


class MarketIndexAPITest(APITestCase):
    def setUp(self):
        from datetime import date
        MarketIndex.objects.create(
            index_type='BDI', date=date(2025, 9, 1),
            value=1500, change_pct_24h=1.5,
        )

    def test_list_indices(self):
        response = self.client.get('/api/v1/market-indices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_latest_indices(self):
        response = self.client.get('/api/v1/market-indices/latest/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class PortTrafficAPITest(APITestCase):
    def setUp(self):
        Port.objects.create(
            name="Paradip", country="India",
            port_type="destination",
            ships_currently_at_port=12,
            expected_incoming_shipments=5,
        )

    def test_port_traffic(self):
        response = self.client.get('/api/v1/port-traffic/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['ships_currently_at_port'], 12)


# ===========================================================================
# Weather & Regressor-Based Forecasting Tests
# ===========================================================================


class FakePrediction:
    """Minimal stand-in for Prophet's prediction DataFrame (iterrows only)."""

    def __init__(self, n):
        self.n = n

    def iterrows(self):
        for i in range(self.n):
            yield i, {'yhat': 20.0 + i * 0.1, 'yhat_lower': 19.0, 'yhat_upper': 21.0}


class FakeProphet:
    """Lightweight Prophet double: records regressors, skips the real fit."""

    instances = []

    def __init__(self, *args, **kwargs):
        self.regressors = []
        FakeProphet.instances.append(self)

    def add_regressor(self, name):
        self.regressors.append(name)

    def fit(self, df):
        self.fit_df = df

    def predict(self, future):
        return FakePrediction(len(future))


def make_route_with_history(days=15, start=None):
    """Create origin/dest ports, route, vessel and `days` of rate history."""
    from datetime import date, timedelta
    start = start or date(2026, 1, 5)
    origin = Port.objects.create(
        name="Newcastle", country="Australia", port_type="origin",
    )
    dest = Port.objects.create(
        name="Haldia", country="India", port_type="destination",
    )
    route = Route.objects.create(
        origin_port=origin, destination_port=dest,
        distance_nautical_miles=6800, typical_transit_days=19,
    )
    vessel = Vessel.objects.create(
        size_class="capesize",
        min_dwt=100000, max_dwt=200000,
        typical_draft=17.0, typical_beam=46.0, typical_loa=290.0,
    )
    for i in range(days):
        FreightRateHistory.objects.create(
            route=route, vessel_class=vessel, commodity='coking_coal',
            date=start + timedelta(days=i),
            rate_usd_per_ton=Decimal(20 + i * 0.1),
        )
    return route, vessel, start


def seed_regressors(dest, start, history_days=15, weather_days=30):
    """Create BDI, MacroFactor and future WeatherData aligned to history."""
    from datetime import timedelta
    for i in range(history_days):
        day = start + timedelta(days=i)
        MarketIndex.objects.create(
            index_type='BDI', date=day, value=1500 + i, change_pct_24h=0.5,
        )
        MacroFactor.objects.create(
            date=day, bunker_fuel_price_usd=500 + i,
            port_congestion_index=50, seasonal_weather_impact=4.0,
        )
    for i in range(weather_days):
        day = start + timedelta(days=history_days + i)
        WeatherData.objects.create(
            port=dest, date=day, wind_speed_ms=8.0, wave_height_m=2.0,
            rainfall_mm=5.0, storm_severity=0, weather_impact_score=4.5,
        )


class WeatherDataModelTest(TestCase):
    def setUp(self):
        self.dest = Port.objects.create(
            name="Haldia", country="India", port_type="destination",
        )

    def test_create_weather_with_port_relationship(self):
        from datetime import date
        row = WeatherData.objects.create(
            port=self.dest, date=date(2026, 9, 9), wind_speed_ms=8.5,
            wave_height_m=2.1, rainfall_mm=4.0, storm_severity=1,
            weather_impact_score=4.2,
        )
        self.assertEqual(row.port.name, "Haldia")
        self.assertIn("Haldia", str(row))
        self.assertEqual(
            WeatherData.objects.filter(port=self.dest).count(), 1
        )

    def test_unique_port_date(self):
        from datetime import date
        kwargs = dict(
            port=self.dest, date=date(2026, 9, 9), wind_speed_ms=8.5,
            wave_height_m=2.1, rainfall_mm=0.0, storm_severity=0,
            weather_impact_score=3.0,
        )
        WeatherData.objects.create(**kwargs)
        with self.assertRaises(Exception):
            WeatherData.objects.create(**kwargs)


class SeedWeatherCommandTest(TestCase):
    def setUp(self):
        for name in ("Haldia", "Paradip"):
            Port.objects.create(
                name=name, country="India", port_type="destination",
            )

    def test_generates_next_30_days(self):
        from datetime import date, timedelta
        from django.core.management import call_command
        call_command('seed_weather')
        today = date.today()
        self.assertEqual(WeatherData.objects.count(), 2 * 30)
        dates = sorted(
            WeatherData.objects.values_list('date', flat=True).distinct()
        )
        self.assertEqual(dates[0], today)
        self.assertEqual(dates[-1], today + timedelta(days=29))

    def test_idempotent_and_deterministic(self):
        from django.core.management import call_command
        from app.management.commands.seed_weather import generate_weather_values
        from datetime import date
        call_command('seed_weather')
        first = list(
            WeatherData.objects.order_by('port_id', 'date').values_list(
                'wind_speed_ms', 'weather_impact_score'
            )
        )
        call_command('seed_weather')
        self.assertEqual(WeatherData.objects.count(), 2 * 30)
        second = list(
            WeatherData.objects.order_by('port_id', 'date').values_list(
                'wind_speed_ms', 'weather_impact_score'
            )
        )
        self.assertEqual(first, second)
        port = Port.objects.get(name="Haldia")
        self.assertEqual(
            generate_weather_values(port.id, date.today()),
            generate_weather_values(port.id, date.today()),
        )


class ForecastRegressorTest(TestCase):
    def setUp(self):
        FakeProphet.instances = []
        self.route, self.vessel, self.start = make_route_with_history(days=15)
        seed_regressors(self.route.destination_port, self.start)

    def test_regressors_added_to_prophet(self):
        from unittest import mock
        from app import forecasting
        with mock.patch('prophet.Prophet', FakeProphet):
            results = forecasting.generate_forecast(
                self.route.id, self.vessel.id, 'coking_coal', horizon_days=30,
            )
        self.assertEqual(len(results), 30)
        self.assertEqual(
            FakeProphet.instances[-1].regressors,
            ['bdi', 'bunker', 'congestion', 'weather_score'],
        )
        self.assertEqual(results[0]['horizon_days'], 30)

    def test_missing_regressors_fall_back(self):
        """No BDI/Macro rows → plain Prophet path is used instead."""
        from unittest import mock
        from app import forecasting
        MarketIndex.objects.all().delete()
        MacroFactor.objects.all().delete()
        with mock.patch.object(
            forecasting, '_prophet_forecast',
            return_value=[{'forecast_date': self.start, 'predicted_rate': 1}],
        ) as plain:
            results = forecasting.generate_forecast(
                self.route.id, self.vessel.id, 'coking_coal',
            )
        plain.assert_called_once()
        self.assertEqual(results[0]['predicted_rate'], 1)

    def test_insufficient_history_flat_placeholder(self):
        """Fewer than 10 history rows keeps the $15 placeholder behavior."""
        from datetime import timedelta
        from app import forecasting
        FreightRateHistory.objects.all().delete()
        for i in range(5):
            FreightRateHistory.objects.create(
                route=self.route, vessel_class=self.vessel,
                commodity='coking_coal',
                date=self.start + timedelta(days=i),
                rate_usd_per_ton=Decimal(20 + i * 0.1),
            )
        results = forecasting.generate_forecast(
            self.route.id, self.vessel.id, 'coking_coal', horizon_days=30,
        )
        self.assertEqual(len(results), 30)
        self.assertTrue(
            all(r['predicted_rate'] == Decimal('15.00') for r in results)
        )


class ForecastGenerateAPITest(APITestCase):
    def test_generate_endpoint_uses_forecasting(self):
        from unittest import mock
        route, vessel, start = make_route_with_history(days=15)
        seed_regressors(route.destination_port, start)
        with mock.patch('prophet.Prophet', FakeProphet):
            response = self.client.post('/api/v1/forecasts/generate/', {
                'route_id': route.id,
                'vessel_class_id': vessel.id,
                'commodity': 'coking_coal',
                'horizon_days': 30,
            })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['count'], 30)
        self.assertEqual(
            Forecast.objects.filter(
                route=route, vessel_class=vessel, horizon_days=30,
            ).count(), 30,
        )


class WeatherAPITest(APITestCase):
    def setUp(self):
        from datetime import date
        self.dest = Port.objects.create(
            name="Haldia", country="India", port_type="destination",
        )
        WeatherData.objects.create(
            port=self.dest, date=date(2026, 9, 9), wind_speed_ms=8.5,
            wave_height_m=2.1, rainfall_mm=4.0, storm_severity=1,
            weather_impact_score=4.2,
        )

    def test_list_weather(self):
        response = self.client.get('/api/v1/weather/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_weather_by_port(self):
        response = self.client.get(f'/api/v1/weather/?port={self.dest.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['port_name'], 'Haldia')


class MigrationConsistencyTest(TestCase):
    def test_no_missing_migrations(self):
        import io
        from django.core.management import call_command
        call_command(
            'makemigrations', 'app', '--check', '--dry-run',
            stdout=io.StringIO(),
        )
