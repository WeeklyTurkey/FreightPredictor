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
    Charterer, MarketIndex, MacroFactor,
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
