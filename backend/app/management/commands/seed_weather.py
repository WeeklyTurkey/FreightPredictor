"""
SIH26006 — seed_weather management command

Generates deterministic synthetic daily weather observations for every
destination port, covering the next 30 days from the execution date. The
Prophet engine (app.forecasting) uses these rows as future regressor values.

Idempotent: reruns for the same port/date range update existing rows via
update_or_create instead of creating duplicates.

Usage:
    python manage.py seed_weather
    python manage.py seed_weather --days 60
    python manage.py seed_weather --start-date 2026-09-08
"""

import math
import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from app.models import Port


class Command(BaseCommand):
    help = 'Generate synthetic daily weather data for destination ports'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days from the start date to generate (default: 30)',
        )
        parser.add_argument(
            '--start-date',
            type=str,
            default=None,
            help='Start date YYYY-MM-DD (default: today)',
        )

    def handle(self, *args, **options):
        start = self._parse_start_date(options['start_date'])
        days = max(options['days'], 1)

        ports = Port.objects.filter(port_type='destination').order_by('id')
        if not ports.exists():
            self.stdout.write(self.style.WARNING(
                "  [WARN] No destination ports found. Run 'seed_data' first."
            ))
            return

        total = 0
        for port in ports:
            for offset in range(days):
                day = start + timedelta(days=offset)
                values = generate_weather_values(port.id, day)
                port.weather_data.update_or_create(
                    date=day,
                    defaults=values,
                )
                total += 1

        end = start + timedelta(days=days - 1)
        self.stdout.write(self.style.SUCCESS(
            f"[SUCCESS] Weather data: {total} rows for "
            f"{ports.count()} ports, {start} → {end}"
        ))

    def _parse_start_date(self, raw):
        if not raw:
            return date.today()
        year, month, day = (int(part) for part in raw.split('-'))
        return date(year, month, day)


def generate_weather_values(port_id, day):
    """
    Deterministic synthetic weather for one port and date.

    Seeded only by (port_id, date), so repeated runs produce identical
    values — the basis for idempotent seeding.
    """
    rng = random.Random(port_id * 100003 + day.toordinal())

    # Seasonal component: monsoon-like peak mid-year (day-of-year curve)
    day_of_year = day.timetuple().tm_yday
    seasonal = 0.5 + 0.5 * math.sin(2 * math.pi * (day_of_year - 100) / 365.0)

    wind_speed_ms = round(3.0 + 8.0 * seasonal + rng.uniform(-2.0, 4.0), 2)
    wind_speed_ms = max(wind_speed_ms, 0.5)

    wave_height_m = round(max(0.2 + wind_speed_ms * 0.18 + rng.uniform(-0.4, 0.6), 0.1), 2)

    rainfall_mm = round(max(seasonal * 22.0 + rng.uniform(-6.0, 14.0), 0.0), 1)

    # Storm severity 0–5 derived from combined extremes
    severity_raw = (
        max(wind_speed_ms - 12.0, 0.0) / 2.0
        + max(wave_height_m - 3.0, 0.0)
        + max(rainfall_mm - 30.0, 0.0) / 15.0
    )
    storm_severity = min(int(round(severity_raw)), 5)

    # Composite 0–10 impact score (same scale as MacroFactor.seasonal_weather_impact)
    impact = (
        wind_speed_ms / 20.0 * 3.0
        + wave_height_m / 5.0 * 3.0
        + min(rainfall_mm / 50.0, 1.0) * 2.0
        + storm_severity / 5.0 * 2.0
    )
    weather_impact_score = round(min(max(impact, 0.0), 10.0), 2)

    return {
        'wind_speed_ms': wind_speed_ms,
        'wave_height_m': wave_height_m,
        'rainfall_mm': rainfall_mm,
        'storm_severity': storm_severity,
        'weather_impact_score': weather_impact_score,
    }
