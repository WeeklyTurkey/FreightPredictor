"""
Load real-world data from JSON files into the database:
  1. Baltic Dry Index → MarketIndex (index_type='BDI')
  2. Daily VLSFO Fuel Prices → BunkerFuelPrice.marine_gas_oil_usd

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
        """Load VLSFO prices into BunkerFuelPrice.marine_gas_oil_usd."""
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

                # Parse VLSFO price: "$542.00" or "$1,444.5"
                vlsfo_str = record.get('VLSFO Fuel Oil, IMO 2020 Grade, 0.5%', '').strip()
                vlsfo_price = Decimal(vlsfo_str.replace('$', '').replace(',', '').strip()) if vlsfo_str else None

                # MGO
                mgo_str = record.get('Marine Gas Oil', '').strip()
                mgo_price = Decimal(mgo_str.replace('$', '').replace(',', '').strip()) if mgo_str else None

                # IFO 180
                ifo180_str = record.get('Intermdiate Fuel Oil, 180cSt', '').strip()
                ifo180_price = Decimal(ifo180_str.replace('$', '').replace(',', '').strip()) if ifo180_str else None

                # IFO 380
                ifo380_str = record.get('Intermdiate Fuel Oil, 380cSt', '').strip()
                ifo380_price = Decimal(ifo380_str.replace('$', '').replace(',', '').strip()) if ifo380_str else None

                if vlsfo_price is None and mgo_price is None and ifo180_price is None and ifo380_price is None:
                    skipped += 1
                    continue

                objects.append(BunkerFuelPrice(
                    date=date,
                    marine_gas_oil_usd=mgo_price,
                    vlsfo_usd=vlsfo_price,
                    ifo_180_usd=ifo180_price,
                    ifo_380_usd=ifo380_price,
                ))
            except (ValueError, KeyError, InvalidOperation, AttributeError) as e:
                skipped += 1
                logger.debug("Skipped bunker fuel record: %s (%s)", record, e)

        BunkerFuelPrice.objects.bulk_create(objects, ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS(
            f"  [OK] Bunker fuel (VLSFO): {len(objects)} loaded ({skipped} skipped)"
        ))
