"""
Load real-world data from JSON files into the database:
  1. Baltic Dry Index → MarketIndex (index_type='BDI')
  2. Daily Bunker Fuel Prices (Marine Gas Oil) → BunkerFuelPrice

Usage:
    python manage.py load_real_data
    python manage.py load_real_data --clear   # Clear existing records first
"""

import json
import logging
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.core.management.base import BaseCommand

from app.models import MarketIndex, BunkerFuelPrice

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Load Baltic Dry Index and Bunker Fuel Price data from JSON files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing BDI and bunker fuel records before loading',
        )
        parser.add_argument(
            '--data-dir',
            type=str,
            default=None,
            help='Path to the data directory (default: data/synthetic/)',
        )

    def handle(self, *args, **options):
        if options['data_dir']:
            data_path = Path(options['data_dir'])
        else:
            data_path = Path(__file__).resolve().parent.parent.parent.parent / 'data' / 'synthetic'

        if options['clear']:
            self.stdout.write("Clearing existing BDI and bunker fuel records...")
            bdi_count, _ = MarketIndex.objects.filter(index_type='BDI').delete()
            fuel_count, _ = BunkerFuelPrice.objects.all().delete()
            self.stdout.write(f"  Deleted {bdi_count} BDI records, {fuel_count} bunker fuel records")

        self._load_bdi(data_path / 'Baltic Dry Index Historical Data-2.json')
        self._load_bunker_fuel(data_path / 'Daily_Bunker_Fuel_Prices_20260907.json')

        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Real-world data loaded!"))

    def _load_bdi(self, filepath):
        """Load Baltic Dry Index data into MarketIndex."""
        if not filepath.exists():
            self.stdout.write(self.style.WARNING(f"  [WARN] BDI file not found: {filepath}"))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        objects = []
        skipped = 0

        for record in data:
            try:
                # Parse date: "04-09-2026" → DD-MM-YYYY
                date = datetime.strptime(record['Date'], '%d-%m-%Y').date()

                # Parse price: "3,628.00" or 976 (int)
                price_raw = record['Price']
                if isinstance(price_raw, str):
                    price_raw = price_raw.replace(',', '')
                value = Decimal(str(price_raw))

                # Parse change %: "4.01%" → 4.01
                change_str = record.get('Change %', '0%')
                change_str = change_str.replace('%', '').replace(',', '').strip()
                change_pct = Decimal(change_str) if change_str else Decimal('0')

                objects.append(MarketIndex(
                    index_type='BDI',
                    date=date,
                    value=value,
                    change_pct_24h=change_pct,
                ))
            except (ValueError, KeyError, InvalidOperation) as e:
                skipped += 1
                logger.debug("Skipped BDI record: %s (%s)", record, e)

        MarketIndex.objects.bulk_create(objects, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(
            f"  [OK] BDI: {len(objects)} loaded ({skipped} skipped)"
        ))

    def _load_bunker_fuel(self, filepath):
        """Load Marine Gas Oil prices into BunkerFuelPrice."""
        if not filepath.exists():
            self.stdout.write(self.style.WARNING(f"  [WARN] Bunker fuel file not found: {filepath}"))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        objects = []
        skipped = 0

        for record in data:
            try:
                # Parse date: "01/29/2019" → MM/DD/YYYY
                date = datetime.strptime(record['Day'], '%m/%d/%Y').date()

                # Parse Marine Gas Oil price: "$636.5" or "$1,444.5"
                price_str = record.get('Marine Gas Oil', '').strip()
                if not price_str or price_str == '':
                    skipped += 1
                    continue

                price_str = price_str.replace('$', '').replace(',', '').strip()
                price = Decimal(price_str)

                objects.append(BunkerFuelPrice(
                    date=date,
                    marine_gas_oil_usd=price,
                ))
            except (ValueError, KeyError, InvalidOperation) as e:
                skipped += 1
                logger.debug("Skipped bunker fuel record: %s (%s)", record, e)

        BunkerFuelPrice.objects.bulk_create(objects, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Bunker fuel (Marine Gas Oil): {len(objects)} loaded ({skipped} skipped)"
        ))
