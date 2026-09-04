# SIH26006 — Intelligent Freight Forecasting Platform (FreightCast)

> **Development of an Intelligent Freight Forecasting Model for Optimized Vessel Chartering and Bulk Cargo Procurement from overseas to East Coast of India.**

A full-stack prototype that forecasts freight/charter rates, recommends optimal chartering timing, verifies port and vessel constraints, and scores charterer reliability — powered by an advanced synthetic data generator and Prophet ML forecasting.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Backend Setup (Django)

```bash
cd backend

# Create & Activate Virtual Environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Generate Synthetic Data (Realistic Momentum-based Random Walk)
python scripts/generate_synthetic_data.py

# Run Migrations & Seed the Database (Populates ~70k records and runs Prophet ML)
python manage.py makemigrations app
python manage.py migrate
python manage.py seed_data

# Run the Development Server
python manage.py runserver
```

### 2. Frontend Setup (React + Vite)

Open a new terminal window:

```bash
cd frontend

# Install Dependencies
npm install

# Run the Development Server
npm run dev
```

The frontend will be available at `http://localhost:5173/` and communicates with the backend API at `http://127.0.0.1:8000/api/v1/`.

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
| GET | `/routes/<id>/` | Historical freight rates |
| GET | `/forecasts/` | Forecasted rates |
| **POST** | `/forecasts/generate/` | **Trigger Prophet ML forecast generation** |
| GET | `/charterers/` | List charterers with trust scores |
| GET | `/charterers/<id>/` | Charterer detail |
| POST | `/charterers/recalculate-scores/` | Recalculate all trust scores |
| GET | `/market-indices/` | Market indices |
| GET | `/macro-factors/` | Macro-economic factors |
| **POST** | `/cost-breakdown/` | **Calculate detailed landed cost** |
| **POST** | `/recommendation/` | **Generate buy/wait/delay recommendation** |
| **POST** | `/port-feasibility/` | **Check port/vessel physical compatibility** |
| GET | `/port-traffic/` | Port business/ship traffic indicators |
| GET | `/dashboard/` | Aggregated dashboard summary |

---

## 🏗 Architecture

### Full-Stack Integration

The platform consists of a modern React SPA on the frontend and a Django REST Framework backend powering the complex data logic, API serving, and ML inference.

```
FreightPredictor_integrated/
│
├── frontend/                                  # Frontend React Application
│   ├── src/
│   │   ├── api/freightService.js              # Centralized Axios API Service
│   │   ├── components/                        # Reusable UI components
│   │   ├── pages/                             # Dashboard, Rates Breakdown, Port Status, etc.
│   │   └── App.jsx                            # React Router integration
│   └── package.json
│
└── backend/                                   # Backend Django Application
    ├── app/
    │   ├── models.py                          # 10 DB Models (Routes, Rates, Forecasts, etc.)
    │   ├── views.py                           # DRF ViewSets & Action APIs
    │   ├── forecasting.py                     # Prophet ML forecasting engine
    │   ├── recommendation.py                  # Buy/Wait/Delay algorithm
    │   └── trust_score.py                     # Charterer reliability scoring
    ├── scripts/generate_synthetic_data.py     # Advanced momentum-based synthetic data generator
    └── db.sqlite3                             # Persistent SQLite Database
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

---

## 🔧 Features

| Feature | Description | Status |
|---------|-------------|--------|
| **A** | Global Freight Rate Analytics & Forecasting | ✅ Full Stack Integrated |
| **B** | Optimal Procurement & Charter Timing | ✅ Full Stack Integrated |
| **C** | Automated Physical Constraint Verification | ✅ Full Stack Integrated |
| **D** | Itemised Landed Cost Breakdown | ✅ Full Stack Integrated |
| **E** | Charterers Database & Trust Scores | ✅ Full Stack Integrated |
| **F** | Port Business / Ship Traffic Indicator | ✅ Full Stack Integrated |

---

## 🔒 Scope Constraints

- **4 Destination Ports Only**: Haldia, Paradip, Visakhapatnam, Chennai
- **3 Vessel Classes Only**: Supramax (50–65K DWT), Panamax (70–85K DWT), Capesize (100K+ DWT)
- **4 Commodities**: Coking Coal, Non-Coking Coal, Iron Ore, Limestone
- **4 Origin Ports**: Newcastle (AU), Richards Bay (ZA), Kalimantan (ID), Baltimore (US)

---

## ⚙️ Recent Implementations

The following decisions and integrations have been fully implemented in the final iteration of this platform:

1. **Synthetic Data Engine Update**: Transitioned from standard random-walk to a sophisticated **momentum-based random walk** with trend reversals, volatility scaling, and macro-shock injections. This ensures smooth, highly realistic multi-week market trends instead of jagged daily noise.
2. **Prophet ML Integration**: Integrated Facebook's Prophet into the Django backend to compute 90-day future forecasts complete with accurate lower and upper confidence bounds.
3. **Frontend-Backend API Bridge**: Fully replaced mock data in the frontend with robust dynamic fetching. Dropdowns now actively resolve IDs by name behind the scenes, ensuring the frontend never breaks if database IDs shift during a reseed. 
4. **Automated Feasibility Engine**: The frontend Port Status tools now fully compute real-time dimensional constraints (Beam, Draft, LOA, DWT) by interacting with the backend APIs.
5. **Seamless Data Bridging**: The React frontend seamlessly interpolates the exact transition point between historical data and future projections to render an uninterrupted predictive timeline chart.

---

## 👥 Team Split

- **Person A** — Route & Forecasting: Vessel, Route, FreightRateHistory + `forecasting.py` + Chart Integrations
- **Person B** — Market & Business: Charterer, Forecast, Recommendation + `trust_score.py`, `recommendation.py` + Port Feasibility UI

Each person owns clearly commented sections within `models.py`, `serializers.py`, and `views.py`.
