"""
SIH26006 — seed_data management command

Loads synthetic JSON files from data/synthetic/ into the SQLite database.
Also computes trust scores after loading charterers.

Usage:
    python manage.py seed_data          # Full seed (clears existing data)
    python manage.py seed_data --append # Append without clearing
"""

import json
import logging
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from app.models import (
    Port, Vessel, Route, FreightRateHistory,
    Charterer, MarketIndex, MacroFactor,
)
from app.trust_score import compute_all_trust_scores

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Load synthetic JSON data into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--append',
            action='store_true',
            help='Append data instead of clearing existing records',
        )
        parser.add_argument(
            '--data-dir',
            type=str,
            default=None,
            help='Path to the synthetic data directory (default: data/synthetic/)',
        )

    def handle(self, *args, **options):
        data_dir = options['data_dir']
        if data_dir:
            data_path = Path(data_dir)
        else:
            data_path = Path(__file__).resolve().parent.parent.parent.parent / 'data' / 'synthetic'

        if not data_path.exists():
            raise CommandError(
                f"Data directory not found: {data_path}\n"
                f"Run 'python scripts/generate_synthetic_data.py' first."
            )

        if not options['append']:
            self.stdout.write("Clearing existing data...")
            self._clear_data()

        self.stdout.write(f"Loading data from: {data_path}")

        # 1. Load ports
        self._load_ports(data_path / 'ports.json')

        # 2. Load vessels
        self._load_vessels(data_path / 'vessels.json')

        # 3. Load routes + freight rates
        self._load_freight_rates(data_path / 'freight_rates.json')

        # 4. Load charterers
        self._load_charterers(data_path / 'charterers.json')

        # 5. Load market indices
        self._load_market_indices(data_path / 'market_indices.json')

        # 6. Load macro factors
        self._load_macro_factors(data_path / 'macro_factors.json')

        # 7. Compute trust scores
        self.stdout.write("Computing trust scores...")
        count = compute_all_trust_scores()
        self.stdout.write(self.style.SUCCESS(f"  [OK] Updated trust scores for {count} charterers"))

        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Database seeded successfully!"))

    def _clear_data(self):
        """Clear all seeded data from the database."""
        models = [
            MacroFactor, MarketIndex, FreightRateHistory,
            Charterer, Route, Vessel, Port,
        ]
        for model in models:
            count, _ = model.objects.all().delete()
            if count:
                self.stdout.write(f"  Deleted {count} {model.__name__} records")

    def _load_ports(self, filepath):
        """Load port data from JSON."""
        if not filepath.exists():
            self.stdout.write(self.style.WARNING(f"  [WARN] Skipping ports (file not found: {filepath})"))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        ports = data.get('ports', [])
        created = 0
        for p in ports:
            _, is_new = Port.objects.update_or_create(
                name=p['name'],
                country=p['country'],
                defaults={
                    'port_type': p['port_type'],
                    'max_draft': p.get('max_draft', 20.0),
                    'max_beam': p.get('max_beam', 50.0),
                    'max_loa': p.get('max_loa', 300.0),
                    'ships_currently_at_port': p.get('ships_currently_at_port', 0),
                    'expected_incoming_shipments': p.get('expected_incoming_shipments', 0),
                },
            )
            if is_new:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"  [OK] Ports: {created} created, {len(ports) - created} updated"))

    def _load_vessels(self, filepath):
        """Load vessel class data from JSON."""
        if not filepath.exists():
            self.stdout.write(self.style.WARNING(f"  [WARN] Skipping vessels (file not found: {filepath})"))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        vessels = data.get('vessels', [])
        created = 0
        for v in vessels:
            _, is_new = Vessel.objects.update_or_create(
                size_class=v['size_class'],
                defaults={
                    'min_dwt': v['min_dwt'],
                    'max_dwt': v['max_dwt'],
                    'typical_draft': v['typical_draft'],
                    'typical_beam': v['typical_beam'],
                    'typical_loa': v['typical_loa'],
                },
            )
            if is_new:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"  [OK] Vessels: {created} created, {len(vessels) - created} updated"))

    def _load_freight_rates(self, filepath):
        """Load routes and freight rate history from JSON."""
        if not filepath.exists():
            self.stdout.write(self.style.WARNING(f"  [WARN] Skipping freight rates (file not found: {filepath})"))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Create routes first
        routes_data = data.get('routes', [])
        route_map = {}  # (origin_name, dest_name) → Route instance
        routes_created = 0

        for r in routes_data:
            try:
                origin = Port.objects.get(name=r['origin_port_name'])
                dest = Port.objects.get(name=r['destination_port_name'])
            except Port.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f"  [WARN] Port not found for route: {r['origin_port_name']} -> {r['destination_port_name']}"
                ))
                continue

            route, is_new = Route.objects.update_or_create(
                origin_port=origin,
                destination_port=dest,
                defaults={
                    'distance_nautical_miles': r.get('distance_nautical_miles', 0),
                    'typical_transit_days': r.get('typical_transit_days', 0),
                },
            )
            route_map[(r['origin_port_name'], r['destination_port_name'])] = route
            if is_new:
                routes_created += 1

        self.stdout.write(self.style.SUCCESS(f"  [OK] Routes: {routes_created} created"))

        # Load freight rates in bulk
        rates_data = data.get('rates', [])
        vessel_map = {v.size_class: v for v in Vessel.objects.all()}

        rate_objects = []
        skipped = 0

        for rate in rates_data:
            key = (rate['origin_port_name'], rate['destination_port_name'])
            route = route_map.get(key)
            vessel = vessel_map.get(rate['vessel_class'])

            if not route or not vessel:
                skipped += 1
                continue

            rate_objects.append(FreightRateHistory(
                route=route,
                vessel_class=vessel,
                commodity=rate['commodity'],
                date=rate['date'],
                rate_usd_per_ton=rate['rate_usd_per_ton'],
            ))

        # Bulk create in batches to avoid memory issues
        batch_size = 5000
        total_created = 0
        for i in range(0, len(rate_objects), batch_size):
            batch = rate_objects[i:i + batch_size]
            FreightRateHistory.objects.bulk_create(batch, ignore_conflicts=True)
            total_created += len(batch)
            self.stdout.write(f"  ... loaded {total_created}/{len(rate_objects)} rate records")

        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Freight rates: {total_created} loaded ({skipped} skipped)"
        ))

    def _load_charterers(self, filepath):
        """Load charterer data from JSON."""
        if not filepath.exists():
            self.stdout.write(self.style.WARNING(f"  [WARN] Skipping charterers (file not found: {filepath})"))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        charterers = data.get('charterers', [])
        created = 0
        for c in charterers:
            _, is_new = Charterer.objects.update_or_create(
                name=c['name'],
                defaults={
                    'country': c['country'],
                    'contact_email': c.get('contact_email', ''),
                    'on_time_delivery_pct': c['on_time_delivery_pct'],
                    'cargo_damage_incidents': c['cargo_damage_incidents'],
                    'payment_reliability_pct': c['payment_reliability_pct'],
                    'total_voyages': c['total_voyages'],
                    'years_in_operation': c['years_in_operation'],
                },
            )
            if is_new:
                created += 1

        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Charterers: {created} created, {len(charterers) - created} updated"
        ))

    def _load_market_indices(self, filepath):
        """Load market index data from JSON."""
        if not filepath.exists():
            self.stdout.write(self.style.WARNING(f"  [WARN] Skipping market indices (file not found: {filepath})"))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        indices = data.get('indices', [])
        index_objects = [
            MarketIndex(
                index_type=idx['index_type'],
                date=idx['date'],
                value=idx['value'],
                change_pct_24h=idx.get('change_pct_24h', 0),
            )
            for idx in indices
        ]

        MarketIndex.objects.bulk_create(index_objects, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(f"  [OK] Market indices: {len(index_objects)} loaded"))

    def _load_macro_factors(self, filepath):
        """Load macro factor data from JSON."""
        if not filepath.exists():
            self.stdout.write(self.style.WARNING(f"  [WARN] Skipping macro factors (file not found: {filepath})"))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        factors = data.get('factors', [])
        factor_objects = [
            MacroFactor(
                date=f['date'],
                bunker_fuel_price_usd=f['bunker_fuel_price_usd'],
                port_congestion_index=f['port_congestion_index'],
                seasonal_weather_impact=f['seasonal_weather_impact'],
            )
            for f in factors
        ]

        MacroFactor.objects.bulk_create(factor_objects, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(f"  [OK] Macro factors: {len(factor_objects)} loaded"))
