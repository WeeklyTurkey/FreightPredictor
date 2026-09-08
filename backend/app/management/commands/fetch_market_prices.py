"""
SIH26006 — fetch_market_prices management command

Daily live BDI + VLSFO ingestion from OilPriceAPI into the existing
MarketIndex / BunkerFuelPrice models (same rows forecasting.py uses).

Idempotent: reruns for the same date update the row via update_or_create.
Without OILPRICEAPI_TOKEN (or on any API failure) it exits gracefully and
the stored synthetic/live data keeps serving as fallback.

Usage:
    python manage.py fetch_market_prices
"""

from django.core.management.base import BaseCommand

from app.services.market_prices import ingest_market_prices


class Command(BaseCommand):
    help = 'Fetch daily BDI + VLSFO prices from OilPriceAPI'

    def handle(self, *args, **options):
        results = ingest_market_prices()
        for label, outcome in results.items():
            self.stdout.write(f"  {label}: {outcome}")
        if all(v == 'skipped' for v in results.values()):
            self.stdout.write(self.style.WARNING(
                "[WARN] All feeds skipped — stored data remains the fallback. "
                "Set OILPRICEAPI_TOKEN to enable live ingestion."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                "[SUCCESS] Market prices ingested."
            ))
