# SIH26006 — Intelligent Freight Forecasting Platform (FreightCast)

> **An Intelligent Freight Forecasting Model for Optimized Vessel Chartering and Bulk Cargo Procurement from Overseas to the East Coast of India.**

FreightCast is a comprehensive full-stack platform designed to revolutionize the maritime shipping and bulk cargo procurement process. By leveraging advanced Machine Learning and detailed physical constraints data, the platform empowers charterers and port authorities to make data-driven decisions on when, how, and with whom to ship their cargo.

---

## 🌟 Key Features

### 1. Global Freight Rate Analytics & 90-Day Forecasting
- **Historical Trends**: Visualize interactive timelines of daily freight rates across major global shipping routes to India's east coast (Visakhapatnam, Paradip, Chennai, Haldia).
- **Prophet ML Engine**: Uses Facebook's Prophet forecasting algorithm to predict freight rate movements up to 90 days into the future.
- **Confidence Intervals**: Forecasts are rendered seamlessly onto interactive charts with upper and lower confidence bounds, allowing risk assessment against market volatility.

### 2. Optimal Procurement & Charter Timing
- **AI-Powered Recommendations**: Analyzes short-term momentum and long-term trend reversals to provide actionable "Buy", "Wait", or "Delay" recommendations for specific cargo and vessel pairings.
- **Trend Detection**: Tracks macro-economic shocks (fuel prices, port congestion) and their impact on future route pricing to optimize charter timing and save costs.

### 3. Automated Physical Constraint Verification (Port Feasibility)
- **Constraint Engine**: Dynamically cross-references vessel dimensions (Draft, Beam, Length Overall) against destination port limitations.
- **Instant Feasibility Checks**: Automatically warns users if a chosen vessel (e.g., Capesize) exceeds the maximum draft limits of a specific port (e.g., Haldia) and calculates necessary cargo short-loading.

### 4. Itemised Landed Cost Breakdown
- **Transparent Calculations**: Automatically calculates the complete financial footprint of a voyage.
- **Cost Factors**: Factors in Base Freight Cost, Bunker Adjustment Factor (BAF), Port Handling Charges, and Demurrage Buffers to provide the final landed cost in both USD and INR.

### 5. Charterers Database & Trust Scores
- **Supplier Reliability**: Maintains a database of major global shipping charterers.
- **Multi-Factor Trust Scoring**: Dynamically calculates a 0-100 Trust Score based on five weighted dimensions: On-time Delivery Rate, Financial Stability, Safety Record, Environmental Compliance, and Fleet Age. 

### 6. Interactive Executive Dashboard
- **Fleet & Voyage Tracking**: Monitor active voyages, port traffic congestion, and fleet readiness.
- **Macro-Factor Tracking**: Keep an eye on the Baltic Dry Index (BDI), fuel prices, and severe weather impacts from a central, responsive command center.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Recharts (for data visualization), Lucide Icons.
- **Backend**: Django, Django REST Framework.
- **Machine Learning**: Python, Facebook Prophet (Time-series forecasting), Pandas, NumPy.
- **Database**: SQLite (Development) with fully automated synthetic data seeding.

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Backend Setup

Open a terminal and navigate to the `backend/` directory:

```bash
cd backend

# Create & Activate Virtual Environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Generate Synthetic Data & Seed the Database (Runs ML models, takes ~1 min)
python scripts/generate_synthetic_data.py
python manage.py makemigrations app
python manage.py migrate
python manage.py seed_data

# Run the Development Server
python manage.py runserver 8000
```
The backend API will be available at `http://localhost:8000/api/v1/`.

### 2. Frontend Setup

Open a **new** terminal window and navigate to the `frontend/` directory:

```bash
cd frontend

# Install Dependencies
npm install

# Run the Development Server
npm run dev
```
The application will be live at `http://localhost:5173/`.
