# SIH26006 — Intelligent Freight Forecasting Platform

> **Development of an Intelligent Freight Forecasting Model for Optimized Vessel Chartering and Bulk Cargo Procurement from overseas to East Coast of India.**

A demo-ready prototype that forecasts freight/charter rates, recommends optimal chartering timing, and scores charterer reliability — all powered by synthetic data.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- pip

### 1. Create & Activate Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Generate Synthetic Data

```bash
python scripts/generate_synthetic_data.py
```

This creates JSON files in `data/synthetic/`:
- `freight_rates.json` — 12 months of daily rate history
- `vessels.json` — 3 vessel class specifications
- `charterers.json` — 15 synthetic charterer companies
- `market_indices.json` — BDI/BCI/BPI/BSI daily values
- `macro_factors.json` — Fuel prices, congestion index, weather impact
- `ports.json` — Origin and destination port data

### 4. Run Migrations

```bash
python manage.py makemigrations app
python manage.py migrate
```

### 5. Seed the Database

```bash
python manage.py seed_data
```

### 6. Create a Superuser (Optional — for admin panel)

```bash
python manage.py createsuperuser
```

### 7. Run the Development Server

```bash
python manage.py runserver
```

The API is now available at `http://127.0.0.1:8000/api/v1/`
The admin panel is at `http://127.0.0.1:8000/admin/`

---

## 📡 API Endpoints

### Base URL: `/api/v1/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ports/` | List all ports (filter: `?port_type=origin\|destination`) |
| GET | `/ports/<id>/` | Port detail |
| GET | `/vessels/` | List vessel classes |
| GET | `/vessels/<id>/` | Vessel detail |
| GET | `/routes/` | List routes (filter: `?origin_port=<id>&destination_port=<id>`) |
| GET | `/routes/<id>/` | Route detail |
| GET | `/rates/` | Historical freight rates (filter: `?route=<id>&vessel_class=<id>&commodity=<type>&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`) |
| GET | `/forecasts/` | Forecasted rates (filter: `?route=<id>&vessel_class=<id>&commodity=<type>&horizon_days=30\|60\|90`) |
| **POST** | `/forecasts/generate/` | **Trigger forecast generation** |
| GET | `/charterers/` | List charterers with trust scores |
| GET | `/charterers/<id>/` | Charterer detail |
| POST | `/charterers/recalculate-scores/` | Recalculate all trust scores |
| GET | `/market-indices/` | Market indices (filter: `?index_type=BDI\|BCI\|BPI\|BSI`) |
| GET | `/market-indices/latest/` | Latest value for each index |
| GET | `/macro-factors/` | Macro-economic factors |
| GET | `/macro-factors/latest/` | Latest macro factor values |
| **POST** | `/cost-breakdown/` | **Calculate detailed landed cost** |
| **POST** | `/recommendation/` | **Generate buy/wait/delay recommendation** |
| **POST** | `/port-feasibility/` | **Check port/vessel physical compatibility** |
| GET | `/port-traffic/` | Port business/ship traffic indicators |
| GET | `/dashboard/` | Aggregated dashboard summary |

### Example POST Requests

#### Generate Forecast
```json
POST /api/v1/forecasts/generate/
{
    "route_id": 1,
    "vessel_class_id": 2,
    "commodity": "coking_coal",
    "horizon_days": 90
}
```

#### Calculate Landed Cost
```json
POST /api/v1/cost-breakdown/
{
    "route_id": 1,
    "vessel_class_id": 2,
    "commodity": "coking_coal",
    "volume_mt": 85000
}
```

#### Generate Recommendation
```json
POST /api/v1/recommendation/
{
    "route_id": 1,
    "vessel_class_id": 2,
    "commodity": "coking_coal",
    "volume_mt": 85000
}
```

#### Port Feasibility Check
```json
POST /api/v1/port-feasibility/
{
    "destination_port_id": 1,
    "vessel_class_id": 3,
    "volume_mt": 120000
}
```

---

## 🏗 Architecture

### Single-App Design

All backend logic lives in a single Django app (`app/`). This is an intentional design decision for this prototype — see the project context document for details.

```
freight-forecast-platform/
│
├── manage.py
├── requirements.txt
├── db.sqlite3                           # Generated, git-ignored
│
├── config/
│   ├── settings.py                      # SQLite, CORS, DRF config
│   ├── urls.py                          # Root router → app.urls
│   ├── wsgi.py
│   └── asgi.py
│
├── app/
│   ├── models.py                        # All 10 models
│   ├── serializers.py                   # All DRF serializers
│   ├── views.py                         # All API views
│   ├── urls.py                          # All endpoints
│   ├── admin.py                         # Admin registrations
│   ├── forecasting.py                   # Prophet / moving-average engine
│   ├── recommendation.py               # Buy/Wait/Delay algorithm
│   ├── trust_score.py                   # Charterer reliability scoring
│   ├── migrations/
│   └── management/commands/seed_data.py # DB seeder
│
├── data/synthetic/                      # Generated JSON datasets
├── scripts/generate_synthetic_data.py   # Synthetic data generator
└── tests/test_api.py                    # API test suite
```

### Models

| Model | Purpose |
|-------|---------|
| `Port` | Origin & destination ports with physical constraints |
| `Vessel` | Ship classes (Supramax, Panamax, Capesize) |
| `Route` | Origin → Destination port routes |
| `FreightRateHistory` | Daily historical freight rates |
| `Forecast` | Predicted future rates |
| `Charterer` | Shipping companies with trust scores |
| `MarketIndex` | BDI, BCI, BPI, BSI daily values |
| `MacroFactor` | Fuel prices, congestion, weather |
| `CostBreakdown` | Itemised landed-cost calculations |
| `Recommendation` | Buy/Wait/Delay timing decisions |

### Business Logic Modules

- **`forecasting.py`** — Prophet-first forecasting with moving-average fallback
- **`recommendation.py`** — Rule-based charter timing using trend analysis + volatility
- **`trust_score.py`** — Weighted-average composite scoring (5 dimensions)

---

## 🔧 Features

| Feature | Description | Status |
|---------|-------------|--------|
| **A** | Global Freight Rate Analytics & Forecasting | ✅ Backend ready |
| **B** | Optimal Procurement & Charter Timing | ✅ Backend ready |
| **C** | Automated Physical Constraint Verification | ✅ Backend ready |
| **D** | Cost Breakdown (button-triggered) | ✅ Backend ready |
| **E** | Charterers Database & Trust Scores | ✅ Backend ready |
| **F** | Port Business / Ship Traffic Indicator | ✅ Backend ready |

---

## 🧪 Running Tests

```bash
python manage.py test tests
```

---

## ⚠️ Open Decisions (Not Yet Finalized)

These items are marked as open in the project spec. The current implementation uses reasonable defaults:

1. **Data Sourcing Strategy**: Currently fully synthetic. Can be swapped to real historical data or live API feeds.
2. **Trust Score Calculation**: Using weighted-average of performance fields. Can switch to random synthetic or simple rule-based.
3. **Build Priority**: Backend-first approach taken. Frontend integration pending.

---

## 🔒 Scope Constraints

- **4 Destination Ports Only**: Haldia, Paradip, Visakhapatnam, Chennai
- **3 Vessel Classes Only**: Supramax (50–65K DWT), Panamax (70–85K DWT), Capesize (100K+ DWT)
- **4 Commodities**: Coking Coal, Non-Coking Coal, Iron Ore, Limestone
- **4 Origin Ports**: Newcastle (AU), Richards Bay (ZA), Kalimantan (ID), Baltimore (US)

---

## 👥 Team Split

- **Person A** — Route & Forecasting: Vessel, Route, FreightRateHistory + `forecasting.py`
- **Person B** — Market & Business: Charterer, Forecast, Recommendation + `trust_score.py`, `recommendation.py`

Each person owns clearly commented sections within `models.py`, `serializers.py`, and `views.py`.
