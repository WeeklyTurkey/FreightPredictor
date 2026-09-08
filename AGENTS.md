# FreightCast (SIH26006) - Agent Coding Guide

> **IMPORTANT PRINCIPLE:**
> The source code, tests, migrations, and actual configuration are the source of truth. If this document conflicts with the repository, inspect the repository and update this document rather than blindly following it.

## 📌 Project Overview
FreightCast is an Intelligent Freight Forecasting Platform designed to optimize vessel chartering and bulk cargo procurement from overseas to the East Coast of India. It features global freight rate analytics (Prophet ML), optimal procurement recommendations, automated physical constraint verification for ports, and a comprehensive executive dashboard.

## 🏗️ Architecture
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, React Router v7.
- **Backend**: Django, Django REST Framework (DRF), single monolithic `app`.
- **Database**: `settings.py` declares PostgreSQL (`freightcast`, env-overridable); the working tree currently contains `backend/db.sqlite3` and no `backend/.env` (only `.env.example`). Seed manually via `generate_synthetic_data.py` + `seed_data`.
- **Machine Learning**: Prophet in `app/forecasting.py` (on-demand via API), with moving-average fallback.

The system uses a single monolithic Django app pattern and a modular React frontend.

## 📂 Repository Structure

### 🔹 Backend (`/backend/`)
- `app/`: The single monolithic Django app containing all models, views, serializers, and business logic.
  - `models.py`: Contains *all* database models (Port, Vessel, Route, Forecast, etc.).
  - `views.py`: Contains *all* API endpoints and ViewSets.
  - `forecasting.py`, `recommendation.py`, `trust_score.py`: Standalone Python modules containing heavy business logic, keeping views lean.
- `config/`: Django project settings (`settings.py`), WSGI, ASGI.
- `scripts/`: Contains `generate_synthetic_data.py` used to build the seed data.
- `data/`: Storage for generated JSON synthetic data.

### 🔹 Frontend (`/frontend/`)
- `src/api/`: Data-fetching abstraction layer.
  - `client.js`: Axios instance configured with base URL and auth interceptors.
  - `freightService.js`: Main API wrapper. It conditionally uses mock data if `VITE_USE_MOCK_DATA='true'`.
  - `mockData.js`: Hardcoded mock fallback data for development/demo.
- `src/components/`: Reusable UI components (Navbars, Cards, Charts).
- `src/pages/`: Full dashboard views mapped to React Router (Overview, ActiveVoyages, RateForecast, etc.).
- `src/App.jsx`: Main routing configuration.

## 🗄️ Database & Models
The data layer is structured in two major sections within `app/models.py`:
1. **Route & Forecasting**: `Port`, `Vessel`, `Route`, `FreightRateHistory`, `Forecast`.
2. **Market & Business**: `Charterer`, `MarketIndex`, `MacroFactor`, `CostBreakdown`, `Recommendation`, `BunkerFuelPrice`.

## 🔄 State Management & Data Fetching
- **Frontend State**: Standard React Hooks (`useState`, `useEffect`). No complex global state stores like Redux or Zustand are used. Keep it this way unless strictly necessary.
- **Data Fetching**: All requests route through `src/api/freightService.js`. Note that DRF uses `PageNumberPagination` (size 50); `freightService.js` includes a helper (`fetchAllPages`) to handle pagination logic seamlessly.
- No caching/invalidation layer; pages re-fetch on mount/route change (e.g. `Overview.jsx` fires `getMarketKPIs` + `getRoutes` + `getRecommendations` in one `Promise.all`).

## 🔁 Data Flow
`Page (useState/useEffect)` → `freightService.js` function → `client.js` axios (`VITE_API_BASE_URL || http://localhost:8000/api/v1`) → `config/urls.py` (`/api/v1/`) → `app/views.py` ViewSet/APIView → standalone module (`forecasting.py` / `recommendation.py` / `trust_score.py`) → models → DB. Computed POST endpoints persist results (`Forecast`, `CostBreakdown`, `Recommendation`).

## 🔌 API Conventions & Key Endpoints
- Base: `/api/v1/`. Read endpoints are DRF `ReadOnlyModelViewSet`s (paginated `{results, next}`); use `fetchAllPages`/`unwrapDRF` when consuming them.
- Reads: `ports/`, `vessels/`, `routes/`, `rates/`, `forecasts/`, `charterers/`, `market-indices/`, `macro-factors/`, `bunker-fuel-prices/` (+ `market-indices/latest/`, `macro-factors/latest/`, `port-traffic/`, `dashboard/`).
- POST actions: `forecasts/generate/` (`route_id, vessel_class_id, commodity, horizon_days=30|60|90`), `cost-breakdown/` and `recommendation/` (`route_id, vessel_class_id, commodity, volume_mt`), `port-feasibility/` (`destination_port_id, vessel_class_id, volume_mt`), `charterers/recalculate-scores/`.
- `commodity` values: `coking_coal | non_coking_coal | iron_ore | limestone`. Frontend normalises display strings via `toLowerCase().replace(/[-\s]/g, '_')`.
- Full endpoint list lives in the `app/urls.py` module docstring — check there first instead of grepping.

## 🧩 Key Modules & Utilities
- Backend: `forecasting.generate_forecast/save_forecasts` (Prophet → moving-average → flat-$15 placeholder when <10 history rows), `recommendation.generate_recommendation/save_recommendation` (BUY >+3% / DELAY <-3% over 14–30d window, WAIT when volatile), `trust_score.compute_trust_score/compute_all_trust_scores` (weights 0.35/0.25/0.20/0.10/0.10), `views._recommend_vessel_for_volume` (≤65k Supramax, ≤85k Panamax, else Capesize), cost formula in `CalculateCostView` (BAF 8%, handling $2.50/MT, demurrage 3%, USD→INR 83).
- Frontend: `freightService.js` (`unwrapDRF`, `fetchAllPages`, `formatDate`), `mockData.js` exports (`mockRoutes`, `mockForecast`, `mockRecommendations`, `mockCharterers`, `mockVessels`, `mockVoyages`, `mockMarketKPIs`, `mockMarketTicker`, `mockPortStatus`, `mockVesselClasses`, `mockCargoTypes`, `simulateScenario`).
- Styling: Tailwind + `src/index.css` (`Inter`/`JetBrains Mono`, `.card` glassmorphism, `fade-in`/`slide-up`/`slide-down`); icons via `lucide-react`, charts via `recharts`. Reuse existing components in `src/components/` (MetricCard, RateChart, RecommendationCard, TrustBadge, Navbar, Sidebar).
- Deps: frontend `axios, react-router-dom, recharts, lucide-react` (+ unused `@supabase/supabase-js` — do not wire up unasked); backend `Django, djangorestframework, django-cors-headers, psycopg2-binary, pandas, prophet, numpy`. Do not add dependencies without need.

## 🔐 Authentication
- Backend has **no enforced auth**: `REST_FRAMEWORK` sets only `AllowAny` (no `DEFAULT_AUTHENTICATION_CLASSES`, no `authtoken` app). Do not assume login/token endpoints exist.
- Frontend `client.js` attaches `localStorage.getItem('auth_token')` as `Bearer` if present, but the backend ignores it.
- `CORS_ALLOW_ALL_ORIGINS = True` (demo only). Do not ship this to production; tightening auth/CORS is a conscious product decision, not a drive-by fix.

## 💻 Commands Reference

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations app
python manage.py migrate
python scripts/generate_synthetic_data.py
python manage.py seed_data
python manage.py runserver 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # vite dev server
npm run build    # vite build
npm run lint     # eslint .
npm run typecheck  # tsc --noEmit
```
Frontend env (no `.env` file committed): `VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`), `VITE_USE_MOCK_DATA=true|false`.

### Migrations & DB
```bash
cd backend
python manage.py makemigrations app
python manage.py migrate
python scripts/generate_synthetic_data.py   # writes JSON to data/synthetic/
python manage.py seed_data                  # loads JSON; --append to keep existing
python manage.py load_real_data [--clear]   # loads BDI + bunker-fuel JSON files only
python manage.py test tests                 # 20 tests in tests/test_api.py
```
Only 2 migration files exist (`0001_initial`, `0002_bunkerfuelprice`). Never hand-edit `db.sqlite3`; rebuild via the seed pipeline instead. Never commit secrets or `.env` values.

## ⚠️ Pitfalls (Non-Obvious)
- Every `freightService.js` live call falls back to mock data on error (`console.warn` + return mock). A page rendering fine does **not** prove the backend works — check the console and test the endpoint directly.
- `getVoyages()`, `getMarketTicker()`, `getCargoTypes()` always return mock data, even with `VITE_USE_MOCK_DATA=false`. `runSimulation()` falls back to local `simulateScenario` math.
- Live `getRecommendations()` hardcodes `vessel_class_id=3, volume 150000, $24.50` display values; `getMarketKPIs()` hardcodes panamax/supramax/fleet numbers alongside live BDI. Treat those numbers as placeholders.
- Name→ID lookups (`checkPortFeasibility`, `calculateCostBreakdown`) use hardcoded fallback IDs when no match is found — verify the resolved ID before trusting a result.
- `Forecast`/`CostBreakdown`/`Recommendation` POSTs write rows to the DB; re-running them duplicates history (forecasts clear-then-recreate per parameter set, recommendations/costs append).

## 🤖 Agent Workflow
1. Read `AGENTS.md` + `CURRENT_STATE.md` first; refresh them only if the task touches areas they describe as changed.
2. Source of truth hierarchy: (1) source code/config → (2) tests/migrations → (3) `AGENTS.md` → (4) `CURRENT_STATE.md` → (5) conversation assumptions. On conflict, trust the repo and fix the doc.
3. Explore only task-relevant slices; prefer `app/urls.py` docstring, `freightService.js` exports, and `models.py` over repo-wide scans. Don't re-read unchanged files.
4. Reuse existing components/utils/patterns; make the smallest complete change; no unrelated refactoring or new deps.
5. For bugs: reproduce against the real code path first, diagnose root cause, then fix. For features: understand the frontend → API → backend → DB flow before coding. For full-stack changes: verify each hop.
6. After implementing: run the relevant checks (`python manage.py test tests`, `npm run lint`, `vite build` / `typecheck` as applicable), inspect the final `git diff`, and update `CURRENT_STATE.md` after significant changes.
7. Ambiguous requirements: state the ambiguity, pick the smallest interpretation, and flag it — don't silently build the large one. Unrelated issues found mid-task: report, don't auto-fix.

## ⚠️ Important Constraints (Do Not Violate)
1. **Single App Architecture**: Do not split the backend into multiple Django apps. Keep everything in `backend/app/`.
2. **Business Logic Separation**: Do not put heavy calculation or ML logic inside `views.py` or `models.py`. Use the standalone modules (`forecasting.py`, `recommendation.py`, etc.).
3. **No Heavy Frontend State**: Avoid introducing Redux, MobX, etc. Stick to simple React hooks.
4. **Resilient Fetching**: Respect the `VITE_USE_MOCK_DATA` fallback mechanism in `freightService.js`. If you add new endpoints, ensure they have mock data fallbacks.
