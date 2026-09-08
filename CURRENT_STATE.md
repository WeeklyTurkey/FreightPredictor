# Current Project State

## 📍 Overall Status
The project is in a functional **Demo/Development** phase. The core architecture is completely defined. A synthetic data generation pipeline ensures the database is fully populated for immediate visualization and testing. The frontend is wired up with an abstraction layer that gracefully degrades to mock data if the API is unreachable.

## ✅ Implemented Features
- **Data Models**: 11 models in `app/models.py` (ports with draft/beam/LOA constraints, 3 vessel classes, routes, rate history, forecasts, charterers + trust scores, market indices, macro factors, bunker prices, cost breakdowns, recommendations).
- **Backend API**: Monolithic DRF setup — 9 read-only ViewSets + POST actions (`forecasts/generate/`, `cost-breakdown/`, `recommendation/`, `port-feasibility/`, `charterers/recalculate-scores/`) + computed GETs (`port-traffic/`, `dashboard/`).
- **ML & Rules Engines**: `forecasting.py` (Prophet → moving-average → flat placeholder), `recommendation.py` (BUY/WAIT/DELAY on 14–30d trend + volatility), `trust_score.py` (weighted 0–100 + grades). Forecast generation runs on demand via API, not during seeding.
- **Data Pipeline**: `scripts/generate_synthetic_data.py` → JSON in `data/synthetic/` → `manage.py seed_data`; `manage.py load_real_data` loads BDI + bunker-fuel JSON only. 20 tests in `tests/test_api.py`.
- **Frontend Dashboard**: 9 routed pages + 6 shared components; `freightService.js` talks to `/api/v1/` with `fetchAllPages` pagination handling and mock fallbacks.

## 🚧 Incomplete Features
- **Authentication**: `AllowAny`, no auth classes or login/token endpoints. Lockdown is a future product decision, not started.
- **Live-data gaps**: `getVoyages()`, `getMarketTicker()`, `getCargoTypes()` always return mock data even with `VITE_USE_MOCK_DATA=false`; `runSimulation()` falls back to local math. Live `getRecommendations()` hardcodes vessel/volume/display rates; `getMarketKPIs()` mixes live BDI with hardcoded fleet figures.
- **Env/DB alignment**: `settings.py` declares PostgreSQL but the tree runs on `backend/db.sqlite3`; no `backend/.env` or `frontend/.env` files exist (only `backend/.env.example`).

## 🐛 Known Bugs/Issues
- Silent mock fallback: any backend error in `freightService.js` returns mock data with only a `console.warn`, so UI breakage from API failures is masked. Verify endpoints directly; do not trust a rendering page as proof of integration.
- Name→ID lookups in `checkPortFeasibility`/`calculateCostBreakdown` fall back to hardcoded IDs when unmatched — can silently query the wrong port/vessel.
- `Recommendation`/`CostBreakdown` POSTs append rows on every call (forecasts clear-then-recreate per parameter set), so repeated clicks accumulate history.

## 🏗️ Architectural Decisions
- **Monolithic Backend App**: All logic lives in `backend/app/`. This prevents app-sprawl for a tightly coupled domain model.
- **Extracted Business Logic**: Heavy computational logic (Prophet forecasting, trust scoring) is strictly separated from Django views into `forecasting.py`, `recommendation.py`, and `trust_score.py`.
- **Regressor-based forecasting**: Prophet fits with 4 external regressors — BDI (`MarketIndex`), bunker VLSFO (`BunkerFuelPrice.marine_gas_oil_usd`, fed by `load_real_data` VLSFO field + live ingestion) + congestion (`MacroFactor` global daily index; no per-port congestion history exists), weather (`seasonal_weather_impact` for history, per-port `WeatherData` for future dates). `WeatherData` seeded via `manage.py seed_weather` (deterministic, idempotent, next 30 days). Future BDI/bunker/congestion use latest-value forward-fill. Any regressor gap → plain Prophet → moving-average → flat $15 fallbacks, unchanged.
- **Live market ingestion**: `manage.py fetch_market_prices` pulls daily BDI + VLSFO from OilPriceAPI (token only via `OILPRICEAPI_TOKEN` env var, never logged/exposed) into the same `MarketIndex`/`BunkerFuelPrice` rows forecasting reads; `source` field (`synthetic`/`oilpriceapi`) marks provenance, synthetic rows stay as fallback. New read endpoints: `bunker-fuel-prices/latest/`, `source` on dashboard payloads. New frontend: `/rates/bdi` + `/rates/vlsfo` pages (shared `MarketPricePage`), Rate Trends entries, clickable Overview BDI/VLSFO cards. 41 backend tests.

## 📉 Known Technical Debt
- **Massive Files**: `app/models.py` (~430 lines) and `app/views.py` (~600 lines) are intentionally monolithic per architecture; navigate via section headers (Route & Forecasting vs Market & Business).
- **Security**: `AllowAny` + `CORS_ALLOW_ALL_ORIGINS=True` (demo posture; do not change without a product decision).
- **Hardcoded presentation values**: recommendation volume/rates, KPI fleet figures, cost-formula constants (BAF 8%, $2.50/MT, 3%, FX 83), unused `@supabase/supabase-js` dep.
- **Temporary solution**: mock fallback everywhere keeps the demo alive without a backend, at the cost of masking integration failures (see issues above).

## 🚀 Suggested Next Steps
1. **End-to-end integration pass**: `VITE_USE_MOCK_DATA=false`, watch console warnings, confirm each chart/card renders from live DRF data; prioritise replacing always-mock `getVoyages`/`getMarketTicker`/`getCargoTypes` if voyages/market pages matter.
2. **Parameterise hardcoded calls**: thread real vessel/volume/commodity selections through `getRecommendations`/`runSimulation`/`getMarketKPIs` instead of fixed values.
3. **Decide env/DB target**: either provision PostgreSQL + `.env` files or officially bless sqlite-for-dev; remove the ambiguity.
4. **Auth decision**: only if moving toward production — add auth classes + permissions and a login flow (none exists today).
