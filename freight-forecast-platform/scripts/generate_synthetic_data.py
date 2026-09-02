#!/usr/bin/env python
"""
SIH26006 — Synthetic Data Generator

Standalone script that generates realistic-looking JSON datasets for:
1. freight_rates.json   — 12 months of daily freight rate history
2. vessels.json         — 3 vessel classes with physical specs
3. charterers.json      — 15 synthetic charterer companies with performance metrics
4. market_indices.json  — BDI/BCI/BPI/BSI daily values
5. macro_factors.json   — Fuel prices, congestion, weather impact

Output directory: data/synthetic/

Run from project root:
    python scripts/generate_synthetic_data.py
"""

import json
import os
import random
import sys
from datetime import date, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Ports
ORIGIN_PORTS = [
    {"name": "Newcastle", "country": "Australia", "port_type": "origin",
     "max_draft": 15.2, "max_beam": 50.0, "max_loa": 300.0},
    {"name": "Richards Bay", "country": "South Africa", "port_type": "origin",
     "max_draft": 17.5, "max_beam": 50.0, "max_loa": 350.0},
    {"name": "Kalimantan", "country": "Indonesia", "port_type": "origin",
     "max_draft": 14.0, "max_beam": 45.0, "max_loa": 280.0},
    {"name": "Baltimore", "country": "USA", "port_type": "origin",
     "max_draft": 15.5, "max_beam": 48.0, "max_loa": 305.0},
]

DESTINATION_PORTS = [
    {"name": "Haldia", "country": "India", "port_type": "destination",
     "max_draft": 7.5, "max_beam": 36.0, "max_loa": 220.0,
     "ships_currently_at_port": random.randint(5, 15),
     "expected_incoming_shipments": random.randint(3, 10)},
    {"name": "Paradip", "country": "India", "port_type": "destination",
     "max_draft": 14.5, "max_beam": 45.0, "max_loa": 280.0,
     "ships_currently_at_port": random.randint(8, 20),
     "expected_incoming_shipments": random.randint(5, 12)},
    {"name": "Visakhapatnam", "country": "India", "port_type": "destination",
     "max_draft": 16.5, "max_beam": 48.0, "max_loa": 300.0,
     "ships_currently_at_port": random.randint(10, 25),
     "expected_incoming_shipments": random.randint(6, 15)},
    {"name": "Chennai", "country": "India", "port_type": "destination",
     "max_draft": 12.0, "max_beam": 42.0, "max_loa": 260.0,
     "ships_currently_at_port": random.randint(7, 18),
     "expected_incoming_shipments": random.randint(4, 11)},
]

# Vessel classes (from spec)
VESSELS = [
    {"size_class": "supramax", "min_dwt": 50000, "max_dwt": 65000,
     "typical_draft": 12.2, "typical_beam": 32.2, "typical_loa": 190.0},
    {"size_class": "panamax", "min_dwt": 70000, "max_dwt": 85000,
     "typical_draft": 13.5, "typical_beam": 32.3, "typical_loa": 225.0},
    {"size_class": "capesize", "min_dwt": 100000, "max_dwt": 200000,
     "typical_draft": 17.0, "typical_beam": 46.0, "typical_loa": 290.0},
]

# Commodities
COMMODITIES = ['coking_coal', 'non_coking_coal', 'iron_ore', 'limestone']

# Base freight rates per commodity per vessel class (USD/MT)
BASE_RATES = {
    'coking_coal':     {'supramax': 18.0, 'panamax': 15.5, 'capesize': 12.0},
    'non_coking_coal': {'supramax': 14.0, 'panamax': 12.0, 'capesize': 9.5},
    'iron_ore':        {'supramax': 16.0, 'panamax': 13.5, 'capesize': 10.5},
    'limestone':       {'supramax': 20.0, 'panamax': 17.0, 'capesize': 14.0},
}

# Route distances (nautical miles) — approximate
ROUTE_DISTANCES = {
    ("Newcastle", "Haldia"): 6800,
    ("Newcastle", "Paradip"): 6600,
    ("Newcastle", "Visakhapatnam"): 6400,
    ("Newcastle", "Chennai"): 6200,
    ("Richards Bay", "Haldia"): 5200,
    ("Richards Bay", "Paradip"): 5000,
    ("Richards Bay", "Visakhapatnam"): 4800,
    ("Richards Bay", "Chennai"): 4600,
    ("Kalimantan", "Haldia"): 3200,
    ("Kalimantan", "Paradip"): 3000,
    ("Kalimantan", "Visakhapatnam"): 2800,
    ("Kalimantan", "Chennai"): 2600,
    ("Baltimore", "Haldia"): 10500,
    ("Baltimore", "Paradip"): 10300,
    ("Baltimore", "Visakhapatnam"): 10100,
    ("Baltimore", "Chennai"): 9900,
}

# Charterer names (synthetic)
CHARTERER_NAMES = [
    ("Pacific Bulk Carriers", "Singapore"),
    ("Atlantic Maritime Corp", "United Kingdom"),
    ("Indo Shipping Lines", "India"),
    ("Dragon Logistics", "China"),
    ("Cape Horn Shipping", "Norway"),
    ("Southern Cross Maritime", "Australia"),
    ("Blue Ocean Chartering", "Greece"),
    ("Global Freight Partners", "Germany"),
    ("Oceanic Transport Ltd", "Japan"),
    ("Bay of Bengal Shipping", "India"),
    ("TransPacific Cargo", "South Korea"),
    ("Meridian Bulk Services", "Netherlands"),
    ("Eastern Seas Navigation", "UAE"),
    ("Continental Carriers", "USA"),
    ("Monsoon Maritime", "India"),
]

# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------

def generate_freight_rates():
    """Generate 12 months of daily freight rate history for all route+vessel+commodity combos."""
    random.seed(42)
    today = date.today()
    start_date = today - timedelta(days=365)

    rates = []
    routes = []

    for origin in ORIGIN_PORTS:
        for dest in DESTINATION_PORTS:
            route_key = (origin['name'], dest['name'])
            distance = ROUTE_DISTANCES.get(route_key, 5000)
            transit_days = max(5, distance // 350)  # ~350 nm/day avg speed

            routes.append({
                "origin_port_name": origin['name'],
                "destination_port_name": dest['name'],
                "distance_nautical_miles": distance,
                "typical_transit_days": transit_days,
            })

            for vessel in VESSELS:
                for commodity in COMMODITIES:
                    base_rate = BASE_RATES[commodity][vessel['size_class']]

                    # Distance factor — longer routes have higher rates
                    distance_factor = 1.0 + (distance - 3000) / 20000

                    current_rate = base_rate * distance_factor
                    current_date = start_date

                    while current_date <= today:
                        # Add realistic noise + seasonal pattern
                        day_of_year = current_date.timetuple().tm_yday
                        # Higher rates in winter (monsoon season for Indian ports)
                        seasonal = 1.0 + 0.08 * _seasonal_wave(day_of_year)
                        noise = random.gauss(0, current_rate * 0.02)
                        drift = random.gauss(0, current_rate * 0.005)

                        current_rate = max(
                            base_rate * 0.5,
                            current_rate + drift
                        )

                        daily_rate = round(current_rate * seasonal + noise, 2)
                        daily_rate = max(1.0, daily_rate)

                        rates.append({
                            "origin_port_name": origin['name'],
                            "destination_port_name": dest['name'],
                            "vessel_class": vessel['size_class'],
                            "commodity": commodity,
                            "date": current_date.isoformat(),
                            "rate_usd_per_ton": daily_rate,
                        })

                        current_date += timedelta(days=1)

                    current_date = start_date  # Reset for next combo

    return {"rates": rates, "routes": routes}


def _seasonal_wave(day_of_year):
    """Sinusoidal seasonal factor peaking in winter months."""
    import math
    # Peak around day 350 (mid-December) and day 15 (mid-January)
    return math.sin(2 * math.pi * (day_of_year - 80) / 365)


def generate_vessels():
    """Return vessel class specifications."""
    return {"vessels": VESSELS}


def generate_charterers():
    """Generate synthetic charterer companies with performance metrics."""
    random.seed(123)
    charterers = []

    for name, country in CHARTERER_NAMES:
        on_time = round(random.uniform(60, 99), 1)
        payment = round(random.uniform(55, 100), 1)
        damage = random.randint(0, 6)
        voyages = random.randint(50, 800)
        years = random.randint(3, 35)

        charterers.append({
            "name": name,
            "country": country,
            "contact_email": f"charter@{name.lower().replace(' ', '')}.com",
            "on_time_delivery_pct": on_time,
            "cargo_damage_incidents": damage,
            "payment_reliability_pct": payment,
            "total_voyages": voyages,
            "years_in_operation": years,
        })

    return {"charterers": charterers}


def generate_market_indices():
    """Generate daily BDI/BCI/BPI/BSI values for the past 12 months."""
    random.seed(77)
    today = date.today()
    start_date = today - timedelta(days=365)

    indices = []
    base_values = {'BDI': 1500, 'BCI': 2200, 'BPI': 1400, 'BSI': 1100}

    for index_type, base in base_values.items():
        current_value = base
        current_date = start_date

        while current_date <= today:
            drift = random.gauss(0, base * 0.015)
            current_value = max(base * 0.3, current_value + drift)
            change_pct = round(random.gauss(0, 2.5), 2)

            indices.append({
                "index_type": index_type,
                "date": current_date.isoformat(),
                "value": round(current_value, 2),
                "change_pct_24h": change_pct,
            })

            current_date += timedelta(days=1)

    return {"indices": indices}


def generate_macro_factors():
    """Generate daily macro factor values for the past 12 months."""
    random.seed(55)
    today = date.today()
    start_date = today - timedelta(days=365)

    factors = []
    fuel_price = 450.0
    congestion = 45.0
    weather = 4.0

    current_date = start_date
    while current_date <= today:
        fuel_price = max(200, fuel_price + random.gauss(0, 8))
        congestion = max(0, min(100, congestion + random.gauss(0, 3)))
        day_of_year = current_date.timetuple().tm_yday
        weather = max(0, min(10, 4.0 + 3.0 * _seasonal_wave(day_of_year) + random.gauss(0, 0.5)))

        factors.append({
            "date": current_date.isoformat(),
            "bunker_fuel_price_usd": round(fuel_price, 2),
            "port_congestion_index": round(congestion, 2),
            "seasonal_weather_impact": round(weather, 2),
        })

        current_date += timedelta(days=1)

    return {"factors": factors}


def generate_ports():
    """Return port specifications for both origin and destination."""
    ports = []
    for p in ORIGIN_PORTS:
        ports.append({**p, "ships_currently_at_port": 0, "expected_incoming_shipments": 0})
    for p in DESTINATION_PORTS:
        ports.append(p)
    return {"ports": ports}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    """Generate all synthetic JSON files."""
    # Determine output directory
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    output_dir = project_root / 'data' / 'synthetic'
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Generating synthetic data in: {output_dir}")

    # Generate and write each dataset
    datasets = {
        'freight_rates.json': generate_freight_rates(),
        'vessels.json': generate_vessels(),
        'charterers.json': generate_charterers(),
        'market_indices.json': generate_market_indices(),
        'macro_factors.json': generate_macro_factors(),
        'ports.json': generate_ports(),
    }

    for filename, data in datasets.items():
        filepath = output_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        # Count top-level list
        key = list(data.keys())[0]
        count = len(data[key])
        print(f"  [OK] {filename}: {count} records")

    print("\nDone! All synthetic data files generated.")


if __name__ == '__main__':
    main()
