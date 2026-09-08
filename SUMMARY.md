# FreightCast Implementation Summary

The following is a comprehensive summary of all fixes, improvements, and architectural changes made to the FreightCast repository.

## 🛠️ Backend & Database Changes

- **Database Migration:** Switched the Django backend from the missing `.env` setup to a fully configured PostgreSQL database (`freightcast`). Installed necessary dependencies (`python-dotenv`, `psycopg2-binary`, `prophet`, `requests`).
- **Model Enhancements:** Updated the `BunkerFuelPrice` model in `app/models.py` to capture `vlsfo_usd`, `ifo_180_usd`, and `ifo_380_usd`. Made `marine_gas_oil_usd` nullable (`null=True, blank=True`) to support modern daily updates that only fetch VLSFO.
- **Migration Fixes:** Resolved an `InconsistentMigrationHistory` error by manually purging the bad migration from the Postgres `django_migrations` table and applying the correct model changes.
- **Data Pipeline:** Successfully loaded real-world historical datasets (Baltic Dry Index and Bunker Fuel Prices) into the database using `load_real_data.py`.
- **API Automation:** Created the `update_daily_rates.py` management command. It automatically fetches today's `BALTIC_DRY_INDEX` and `VLSFO_USD` directly from the oilpriceapi.com API and saves them to the database.

## 🎨 Frontend & UI Improvements

- **Global Typography:** Updated the global application typography from `Inter` to the Apple System Font Stack (`San Francisco` / `SF Pro`) in `tailwind.config.js` and `index.css` for a premium native feel.
- **Apple-Inspired Theme:** Rewrote chart components to adopt the app's light Apple-inspired theme. Updated graph components to use the project's slate text palette, light grid lines (`#f0f0f5`), and consistent card backgrounds.
- **Unified Graph Component:** Consolidated the previously separated BDI and VLSFO pages into a single, unified `IndexGraph.jsx` component. Both graphs now perfectly match the core UI theme, using the same Teal (`#0d9488`) accent color.
- **Navigation & Routing:** 
  - Updated `Navbar.jsx` to correctly route "Rate Trends" dropdown items to the new unified graph.
  - Added hard redirects in `App.jsx` to permanently map legacy paths (`/rates/bdi` and `/rates/vlsfo`) to the new unified component, automatically resolving bugs caused by stale `sessionStorage` history.
  - Removed the unnecessary "1D" (one day) filter from historical index graphs.

## 🧮 Scenario Simulator & Business Logic

- **Fixed Time Charter vs Spot Bias:** Addressed a critical logic flaw in `freightService.js` and `mockData.js` where Time Charter was always structurally more expensive than Spot. 
  - **Before:** Time Charter double-charged the user by applying both vessel operating costs (daily hire, bunker, port) AND a per-MT cargo freight rate.
  - **After:** Time Charter economics correctly calculate the cost of *hiring the whole vessel* (daily rate + bunker + port), removing the per-MT freight charge.
  - **Spot Pricing:** Spot economics were updated to reflect per-MT freight rate while introducing a dynamic demurrage risk premium for longer laycan windows.
- **Laycan Sensitivity:** Connected the `laycanWeeks` UI slider directly to the Live API simulation path. Longer laycan windows now accurately increase transit days for Time Charters (increasing vessel costs) and apply a demurrage premium for Spot Charters.
