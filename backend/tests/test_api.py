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
    Charterer, MarketIndex, MacroFactor, WeatherData, BunkerFuelPrice,
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
    """Create BDI, MacroFactor, VLSFO and future WeatherData aligned to history."""
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
        BunkerFuelPrice.objects.create(
            date=day, marine_gas_oil_usd=600 + i, source='synthetic',
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


# ===========================================================================
# OilPriceAPI Ingestion Tests (all HTTP mocked — never hits the network)
# ===========================================================================

BDI_PAYLOAD = {
    'data': {
        'price': 1842.5, 'currency': 'USD',
        'created_at': '2026-09-08T00:00:00Z', 'code': 'BALTIC_DRY_INDEX',
    }
}
VLSFO_PAYLOAD = {
    'data': {
        'price': 612.25, 'currency': 'USD',
        'created_at': '2026-09-08T00:00:00Z', 'code': 'VLSFO_USD',
    }
}


def fake_get_json(url, token, timeout):
    if 'BALTIC_DRY_INDEX' in url:
        return BDI_PAYLOAD
    return VLSFO_PAYLOAD


class IngestionServiceTest(TestCase):
    def test_bdi_normalize_and_store(self):
        from unittest import mock
        from django.test import override_settings
        from app.services import market_prices
        with override_settings(OILPRICEAPI_TOKEN='test-token'):
            with mock.patch.object(
                market_prices, '_http_get_json', side_effect=fake_get_json,
            ):
                results = market_prices.ingest_market_prices()
        self.assertEqual(results, {'BDI': 'stored', 'VLSFO': 'stored'})
        row = MarketIndex.objects.get(index_type='BDI')
        self.assertEqual(float(row.value), 1842.5)
        self.assertEqual(str(row.date), '2026-09-08')
        self.assertEqual(row.source, 'oilpriceapi')

    def test_vlsfo_normalize_and_store(self):
        from unittest import mock
        from django.test import override_settings
        from app.services import market_prices
        with override_settings(OILPRICEAPI_TOKEN='test-token'):
            with mock.patch.object(
                market_prices, '_http_get_json', side_effect=fake_get_json,
            ):
                market_prices.ingest_market_prices()
        row = BunkerFuelPrice.objects.get()
        self.assertEqual(float(row.marine_gas_oil_usd), 612.25)
        self.assertEqual(row.source, 'oilpriceapi')

    def test_missing_token_skips_gracefully(self):
        from django.test import override_settings
        from app.services import market_prices
        with override_settings(OILPRICEAPI_TOKEN=''):
            results = market_prices.ingest_market_prices()
        self.assertEqual(results, {'BDI': 'skipped', 'VLSFO': 'skipped'})
        self.assertEqual(MarketIndex.objects.count(), 0)
        self.assertEqual(BunkerFuelPrice.objects.count(), 0)

    def test_api_error_skips_gracefully(self):
        from unittest import mock
        from django.test import override_settings
        from app.services import market_prices
        with override_settings(OILPRICEAPI_TOKEN='test-token'):
            with mock.patch.object(
                market_prices, '_http_get_json',
                side_effect=market_prices.IngestionError('boom'),
            ):
                results = market_prices.ingest_market_prices()
        self.assertEqual(results, {'BDI': 'skipped', 'VLSFO': 'skipped'})

    def test_malformed_response_rejected(self):
        from app.services.market_prices import IngestionError, normalize_price
        for bad in ({}, {'data': {}}, {'data': {'price': 'n/a'}},
                    {'data': {'price': -5}}, {'data': {'price': 10, 'currency': 'EUR'}}):
            with self.assertRaises(IngestionError):
                normalize_price(bad, 'BALTIC_DRY_INDEX')

    def test_idempotent_daily_ingestion(self):
        from unittest import mock
        from django.test import override_settings
        from app.services import market_prices
        with override_settings(OILPRICEAPI_TOKEN='test-token'):
            with mock.patch.object(
                market_prices, '_http_get_json', side_effect=fake_get_json,
            ):
                market_prices.ingest_market_prices()
                market_prices.ingest_market_prices()
        self.assertEqual(
            MarketIndex.objects.filter(index_type='BDI').count(), 1
        )
        self.assertEqual(BunkerFuelPrice.objects.count(), 1)

    def test_no_credential_leakage_in_logs(self):
        import urllib.error
        from unittest import mock
        from django.test import override_settings
        from app.services import market_prices
        with override_settings(OILPRICEAPI_TOKEN='SECRET-XYZ'):
            with mock.patch(
                'urllib.request.urlopen',
                side_effect=urllib.error.HTTPError(
                    'http://x', 401, 'Unauthorized', {}, None,
                ),
            ):
                with self.assertLogs('app.services.market_prices') as logs:
                    market_prices.ingest_market_prices()
        combined = '\n'.join(logs.output)
        self.assertNotIn('SECRET-XYZ', combined)


class BunkerLatestAPITest(APITestCase):
    def test_latest_empty(self):
        response = self.client.get('/api/v1/bunker-fuel-prices/latest/')
        self.assertEqual(response.status_code, 404)

    def test_latest_returns_row(self):
        from datetime import date
        BunkerFuelPrice.objects.create(
            date=date(2026, 9, 8), marine_gas_oil_usd=612.25,
            source='oilpriceapi',
        )
        response = self.client.get('/api/v1/bunker-fuel-prices/latest/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['source'], 'oilpriceapi')

    def test_dashboard_includes_bunker_key(self):
        response = self.client.get('/api/v1/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('bunker_fuel_latest', response.data)
        self.assertIn('market_indices', response.data)


# ===========================================================================
# VLSFO Loader + Bunker Regressor Tests
# ===========================================================================

VLSFO_KEY = 'VLSFO Fuel Oil, IMO 2020 Grade, 0.5%'


def write_bunker_json(tmpdir, rows):
    import json
    path = tmpdir / 'Daily_Bunker_Fuel_Prices_20260907.json'
    path.write_text(json.dumps(rows), encoding='utf-8')
    return path


class LoadRealDataVlsfoTest(TestCase):
    def test_imports_vlsfo_field(self):
        import tempfile
        from pathlib import Path
        from django.core.management import call_command
        with tempfile.TemporaryDirectory() as tmp:
            write_bunker_json(Path(tmp), [
                {'Day': '09/02/2026', VLSFO_KEY: '$840.00',
                 'Marine Gas Oil': '$1,444.5'},
                {'Day': '09/03/2026', VLSFO_KEY: '$845.50',
                 'Marine Gas Oil': '$1,450'},
                {'Day': '09/04/2026', VLSFO_KEY: '',
                 'Marine Gas Oil': '$1,460'},
                {'Day': 'not-a-date', VLSFO_KEY: '$850',
                 'Marine Gas Oil': '$1,470'},
            ])
            call_command('load_real_data', data_dir=tmp)
        rows = {
            str(r.date): float(r.marine_gas_oil_usd)
            for r in BunkerFuelPrice.objects.all()
        }
        # VLSFO values stored; empty + malformed rows skipped
        self.assertEqual(
            rows, {'2026-09-02': 840.00, '2026-09-03': 845.50}
        )

    def test_ignores_marine_gas_oil_field(self):
        import tempfile
        from pathlib import Path
        from django.core.management import call_command
        with tempfile.TemporaryDirectory() as tmp:
            write_bunker_json(Path(tmp), [
                {'Day': '09/02/2026', VLSFO_KEY: '$600.00',
                 'Marine Gas Oil': '$999.99'},
            ])
            call_command('load_real_data', data_dir=tmp)
        row = BunkerFuelPrice.objects.get()
        self.assertEqual(float(row.marine_gas_oil_usd), 600.00)

    def test_idempotent_rerun(self):
        import tempfile
        from pathlib import Path
        from django.core.management import call_command
        with tempfile.TemporaryDirectory() as tmp:
            write_bunker_json(Path(tmp), [
                {'Day': '09/02/2026', VLSFO_KEY: '$840.00',
                 'Marine Gas Oil': '$1,444.5'},
            ])
            call_command('load_real_data', data_dir=tmp)
            call_command('load_real_data', data_dir=tmp)
        self.assertEqual(BunkerFuelPrice.objects.count(), 1)
        self.assertEqual(
            float(BunkerFuelPrice.objects.get().marine_gas_oil_usd), 840.00
        )

    def test_clear_removes_existing(self):
        import tempfile
        from datetime import date
        from pathlib import Path
        from django.core.management import call_command
        BunkerFuelPrice.objects.create(
            date=date(2020, 1, 1), marine_gas_oil_usd=100,
        )
        with tempfile.TemporaryDirectory() as tmp:
            write_bunker_json(Path(tmp), [])
            call_command('load_real_data', data_dir=tmp, clear=True)
        self.assertEqual(BunkerFuelPrice.objects.count(), 0)


class ForecastBunkerRegressorTest(TestCase):
    def setUp(self):
        FakeProphet.instances = []
        self.route, self.vessel, self.start = make_route_with_history(days=15)
        seed_regressors(self.route.destination_port, self.start)

    def test_bunker_comes_from_bunkerfuelprice(self):
        import pandas as pd
        from unittest import mock
        from app import forecasting
        with mock.patch('prophet.Prophet', FakeProphet):
            forecasting.generate_forecast(
                self.route.id, self.vessel.id, 'coking_coal',
                horizon_days=30,
            )
        fit_df = FakeProphet.instances[-1].fit_df
        raw = pd.Series([600.0 + i for i in range(15)])
        expected = ((raw - raw.mean()) / raw.std()).tolist()
        self.assertEqual(
            [round(v, 6) for v in fit_df['bunker'].tolist()],
            [round(v, 6) for v in expected],
        )

    def test_missing_bunker_rows_fall_back(self):
        """No BunkerFuelPrice rows → plain Prophet path is used instead."""
        from unittest import mock
        from app import forecasting
        BunkerFuelPrice.objects.all().delete()
        with mock.patch.object(
            forecasting, '_prophet_forecast',
            return_value=[{'forecast_date': self.start, 'predicted_rate': 2}],
        ) as plain:
            results = forecasting.generate_forecast(
                self.route.id, self.vessel.id, 'coking_coal',
            )
        plain.assert_called_once()
        self.assertEqual(results[0]['predicted_rate'], 2)


# ===========================================================================
# Forecast Horizons, Materials & Ranges (chart-facing contracts)
# ===========================================================================


class ForecastHorizonsMaterialsTest(TestCase):
    def setUp(self):
        FakeProphet.instances = []
        self.route, self.vessel, self.start = make_route_with_history(days=15)
        seed_regressors(self.route.destination_port, self.start)

    def generate(self, commodity, horizon):
        from unittest import mock
        from app import forecasting
        with mock.patch('prophet.Prophet', FakeProphet):
            return forecasting.save_forecasts(
                self.route.id, self.vessel.id, commodity, horizon,
            )

    def test_30_60_90_day_generation_counts(self):
        for horizon in (30, 60, 90):
            count = self.generate('coking_coal', horizon)
            self.assertEqual(count, horizon)

    def test_material_specific_records(self):
        self.generate('coking_coal', 90)
        self.generate('iron_ore', 90)
        self.assertEqual(
            Forecast.objects.filter(commodity='coking_coal').count(), 90
        )
        self.assertEqual(
            Forecast.objects.filter(commodity='iron_ore').count(), 90
        )

    def test_regeneration_replaces_same_parameters(self):
        self.generate('coking_coal', 90)
        self.generate('coking_coal', 90)
        self.assertEqual(Forecast.objects.count(), 90)


class ForecastFilteringAPITest(APITestCase):
    def setUp(self):
        FakeProphet.instances = []
        route, vessel, start = make_route_with_history(days=15)
        seed_regressors(route.destination_port, start)
        self.route, self.vessel, self.start = route, vessel, start
        from unittest import mock
        from app import forecasting
        with mock.patch('prophet.Prophet', FakeProphet):
            forecasting.save_forecasts(route.id, vessel.id, 'coking_coal', 30)
            forecasting.save_forecasts(route.id, vessel.id, 'coking_coal', 90)
            forecasting.save_forecasts(route.id, vessel.id, 'iron_ore', 90)

    def test_horizon_filter(self):
        response = self.client.get(
            f'/api/v1/forecasts/?route={self.route.id}&horizon_days=90'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 180)
        horizons = {r['horizon_days'] for r in response.data['results'][:50]}
        self.assertEqual(horizons, {90})

    def test_material_filter(self):
        response = self.client.get(
            f'/api/v1/forecasts/?route={self.route.id}&commodity=iron_ore'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 90)

    def test_rates_date_range_filter(self):
        from datetime import timedelta
        date_from = (self.start + timedelta(days=10)).isoformat()
        response = self.client.get(
            f'/api/v1/rates/?route={self.route.id}&date_from={date_from}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 5)
        for row in response.data['results']:
            self.assertGreaterEqual(row['date'], date_from)

    def test_empty_forecast_returns_empty_list(self):
        Forecast.objects.all().delete()
        response = self.client.get(
            f'/api/v1/forecasts/?route={self.route.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])


# ===========================================================================
# Cargo / Vessel Selection Contracts (chart-facing filtering)
# ===========================================================================


class ForecastSelectionAPITest(APITestCase):
    """Each cargo × vessel combination must return its own rows."""

    def setUp(self):
        from datetime import timedelta
        route, vessel, start = make_route_with_history(days=5)
        self.route, self.start = route, start
        self.capesize = vessel
        self.panamax = Vessel.objects.create(
            size_class="panamax",
            min_dwt=70000, max_dwt=85000,
            typical_draft=13.5, typical_beam=32.3, typical_loa=225.0,
        )
        for i in range(5):
            day = start + timedelta(days=i)
            FreightRateHistory.objects.create(
                route=route, vessel_class=vessel, commodity='iron_ore',
                date=day, rate_usd_per_ton=Decimal(30 + i),
            )
            FreightRateHistory.objects.create(
                route=route, vessel_class=self.panamax,
                commodity='coking_coal',
                date=day, rate_usd_per_ton=Decimal(40 + i),
            )
            Forecast.objects.create(
                route=route, vessel_class=vessel, commodity='coking_coal',
                forecast_date=day, predicted_rate=Decimal(21),
                lower_bound=Decimal(20), upper_bound=Decimal(22),
                horizon_days=90,
            )
            Forecast.objects.create(
                route=route, vessel_class=self.panamax,
                commodity='iron_ore',
                forecast_date=day, predicted_rate=Decimal(31),
                lower_bound=Decimal(30), upper_bound=Decimal(32),
                horizon_days=90,
            )

    def test_rates_filter_by_vessel(self):
        response = self.client.get(
            f'/api/v1/rates/?route={self.route.id}'
            f'&vessel_class={self.panamax.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 5)
        for row in response.data['results']:
            self.assertEqual(row['vessel_class'], self.panamax.id)

    def test_rates_filter_by_commodity(self):
        response = self.client.get(
            f'/api/v1/rates/?route={self.route.id}&commodity=iron_ore'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 5)
        for row in response.data['results']:
            self.assertEqual(row['commodity'], 'iron_ore')

    def test_rates_vessel_and_commodity_combined(self):
        response = self.client.get(
            f'/api/v1/rates/?route={self.route.id}'
            f'&vessel_class={self.capesize.id}&commodity=coking_coal'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 5)

    def test_forecasts_filter_by_vessel_and_commodity(self):
        response = self.client.get(
            f'/api/v1/forecasts/?route={self.route.id}'
            f'&vessel_class={self.panamax.id}&commodity=iron_ore'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 5)
        for row in response.data['results']:
            self.assertEqual(row['vessel_class'], self.panamax.id)
            self.assertEqual(row['commodity'], 'iron_ore')

    def test_unknown_combination_returns_no_data(self):
        response = self.client.get('/api/v1/rates/?route=999999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(response.data['results'], [])
        response = self.client.get(
            f'/api/v1/forecasts/?route={self.route.id}'
            f'&vessel_class={self.panamax.id}&commodity=limestone'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)


class ForecastGenerationSavesSelectionTest(TestCase):
    """Generation must persist the selected vessel and commodity."""

    def setUp(self):
        FakeProphet.instances = []
        self.route, self.vessel, self.start = make_route_with_history(days=15)
        seed_regressors(self.route.destination_port, self.start)
        self.panamax = Vessel.objects.create(
            size_class="panamax",
            min_dwt=70000, max_dwt=85000,
            typical_draft=13.5, typical_beam=32.3, typical_loa=225.0,
        )

    def generate(self, vessel_id, commodity):
        from unittest import mock
        from app import forecasting
        with mock.patch('prophet.Prophet', FakeProphet):
            return forecasting.save_forecasts(
                self.route.id, vessel_id, commodity, 90,
            )

    def test_saves_selected_vessel_and_commodity(self):
        count = self.generate(self.panamax.id, 'iron_ore')
        self.assertEqual(count, 90)
        rows = Forecast.objects.filter(
            route=self.route, vessel_class=self.panamax,
            commodity='iron_ore', horizon_days=90,
        )
        self.assertEqual(rows.count(), 90)

    def test_different_combos_do_not_overlap(self):
        self.generate(self.vessel.id, 'coking_coal')
        self.generate(self.panamax.id, 'iron_ore')
        self.assertEqual(
            Forecast.objects.filter(
                vessel_class=self.vessel, commodity='coking_coal',
            ).count(), 90,
        )
        self.assertEqual(
            Forecast.objects.filter(
                vessel_class=self.panamax, commodity='iron_ore',
            ).count(), 90,
        )


class GenerateForecastErrorTest(APITestCase):
    """Error paths the UI surfaces instead of hanging on the spinner."""

    def setUp(self):
        self.route, self.vessel, self.start = make_route_with_history(days=15)

    def test_invalid_horizon_rejected(self):
        response = self.client.post('/api/v1/forecasts/generate/', {
            'route_id': self.route.id,
            'vessel_class_id': self.vessel.id,
            'commodity': 'coking_coal',
            'horizon_days': 45,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_commodity_rejected(self):
        response = self.client.post('/api/v1/forecasts/generate/', {
            'route_id': self.route.id,
            'vessel_class_id': self.vessel.id,
            'horizon_days': 90,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_route_returns_not_found(self):
        response = self.client.post('/api/v1/forecasts/generate/', {
            'route_id': 999999,
            'vessel_class_id': self.vessel.id,
            'commodity': 'coking_coal',
            'horizon_days': 90,
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['status'], 'error')

    def test_unknown_vessel_returns_not_found(self):
        response = self.client.post('/api/v1/forecasts/generate/', {
            'route_id': self.route.id,
            'vessel_class_id': 999999,
            'commodity': 'coking_coal',
            'horizon_days': 90,
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['status'], 'error')


class ForecastBoundsOrderingTest(APITestCase):
    """Every forecast row must satisfy lower <= predicted <= upper."""

    def assert_ordered(self, results):
        self.assertTrue(len(results) > 0)
        for r in results:
            self.assertLessEqual(r['lower_bound'], r['predicted_rate'], r)
            self.assertLessEqual(r['predicted_rate'], r['upper_bound'], r)

    def test_regressor_path_ordering(self):
        from unittest import mock
        from app import forecasting
        route, vessel, start = make_route_with_history(days=15)
        seed_regressors(route.destination_port, start)
        with mock.patch('prophet.Prophet', FakeProphet):
            self.assert_ordered(forecasting.generate_forecast(
                route.id, vessel.id, 'coking_coal', horizon_days=30,
            ))

    def test_inverted_prophet_output_reordered(self):
        """A prediction row with crossed bounds is stored ordered, not dropped."""
        from unittest import mock
        from app import forecasting

        class InvertingPrediction:
            def __init__(self, n):
                self.n = n

            def iterrows(self):
                for i in range(self.n):
                    yield i, {'yhat': 20.0, 'yhat_lower': 25.0, 'yhat_upper': 18.0}

        class InvertingProphet(FakeProphet):
            def predict(self, future):
                return InvertingPrediction(len(future))

        route, vessel, start = make_route_with_history(days=15)
        seed_regressors(route.destination_port, start)
        with mock.patch('prophet.Prophet', InvertingProphet):
            results = forecasting.generate_forecast(
                route.id, vessel.id, 'coking_coal', horizon_days=30,
            )
        self.assert_ordered(results)
        self.assertTrue(all(r['predicted_rate'] == 20 for r in results))

    def test_moving_average_ordering_all_horizons(self):
        import pandas as pd
        from datetime import date, timedelta
        from app import forecasting
        df = pd.DataFrame([
            {'date': date(2026, 1, 5) + timedelta(days=i),
             'rate_usd_per_ton': 20.0 + i * 0.1}
            for i in range(12)
        ])
        for horizon in (30, 60, 90):
            results = forecasting._moving_average_forecast(df, horizon)
            self.assertEqual(len(results), horizon)
            self.assert_ordered(results)
            # Band tracks the forecast: constant width up to rounding cents.
            widths = [r['upper_bound'] - r['lower_bound'] for r in results]
            self.assertLess(max(widths) - min(widths), Decimal('0.03'))

    def test_flat_fallback_ordering(self):
        from app import forecasting
        self.assert_ordered(forecasting._fallback_forecast(90))

    def test_api_response_ordering(self):
        from unittest import mock
        from app import forecasting
        route, vessel, start = make_route_with_history(days=15)
        seed_regressors(route.destination_port, start)
        with mock.patch('prophet.Prophet', FakeProphet):
            forecasting.save_forecasts(route.id, vessel.id, 'coking_coal', 90)
        response = self.client.get(
            f'/api/v1/forecasts/?route={route.id}&horizon_days=90'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)
        for row in response.data['results']:
            self.assertLessEqual(
                Decimal(row['lower_bound']), Decimal(row['predicted_rate']))
            self.assertLessEqual(
                Decimal(row['predicted_rate']), Decimal(row['upper_bound']))


class ForecastFallbackChainTest(TestCase):
    def test_plain_prophet_failure_uses_moving_average(self):
        """Regressor + plain Prophet both fail → moving-average rows."""
        from unittest import mock
        from app import forecasting
        route, vessel, _ = make_route_with_history(days=15)
        with mock.patch.object(
            forecasting, '_prophet_forecast',
            side_effect=RuntimeError('stan failed'),
        ):
            results = forecasting.generate_forecast(
                route.id, vessel.id, 'coking_coal', horizon_days=30,
            )
        self.assertEqual(len(results), 30)
        self.assertTrue(all(r['predicted_rate'] > 0 for r in results))
