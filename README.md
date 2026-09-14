# 🌾 Mandi-Mitra — Agricultural Marketing & Market Intelligence Platform

> **Official AGMARK Agricultural Market Intelligence, Real-Time Commodity Price Discovery & Mandi Arbitrage Platform for India.**

---

## 🌐 Live Demonstrations

- **Frontend Application (Vercel)**: [https://mandi-mitra-e75pgstn9-9aaryancyberhs-projects.vercel.app/](https://mandi-mitra-e75pgstn9-9aaryancyberhs-projects.vercel.app/)
- **Live Local Preview**: [http://localhost:5173](http://localhost:5173)
- **Official AGMARK Data Integration**: Real-time government mandi records via Data.gov.in API

---

## 🏛️ Project Overview

**Mandi-Mitra** is an agricultural marketing platform designed for Indian farmers, FPOs (Farmer Producer Organisations), agribusinesses, and commodity traders. It transforms raw agricultural market data into actionable price discovery, market surveillance, and spatial profit arbitrage intelligence.

The platform interfaces with the official Indian Government Open Data (AGMARK daily market prices dataset) across **36 States and Union Territories**, tracking over **42 core commodities** and hundreds of APMC mandis.

---

## 📁 Repository Structure

The project is organized into two primary, decoupled category workspaces:

```
Mandi-mitra/
├── frontend/                     # React 19 + Vite + Chart.js Client Application
│   ├── public/assets/            # High-resolution photographic & visual assets
│   ├── src/
│   │   ├── components/
│   │   │   └── AnalyticsDashboard.jsx  # Multi-mode analytics (Crop & APMC deep-dives)
│   │   ├── App.css               # Figma-inspired design system & styling
│   │   ├── App.jsx               # Hero, Price Discovery Search, Marketing Cards, & Arbitrage Simulator
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── backend/                      # Node.js + Express + Prisma + PostgreSQL Service
│   ├── prisma/
│   │   ├── schema.prisma         # Normalized database models (PriceRecord, Commodity, Market, State, User)
│   │   └── migrations/           # Versioned SQL migrations
│   ├── scripts/
│   │   ├── ingest.js             # Automated & manual AGMARK data ingestion
│   │   ├── seed.js               # Initial benchmark commodity & APMC seeding
│   │   └── test-connection.js
│   ├── src/
│   │   ├── controllers/          # Request handlers (prices, analytics, compatibility, auth)
│   │   ├── routes/               # Modular Express routing (v1 & legacy endpoints)
│   │   ├── services/             # Business logic & external AGMARK API integrations
│   │   ├── app.js                # Express app setup, CORS, rate-limiting & logging
│   │   └── server.js             # HTTP server & cron scheduler entry point
│   ├── tests/                    # 24 unit & integration tests (Vitest)
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── .gitignore                    # Global ignore rules (strictly ignores .env and builds)
├── package.json                  # Root monorepo runner
└── README.md                     # Root architecture documentation
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **PostgreSQL**: v14+ (running on port `5432`)
- **npm** or **pnpm**

---

### 2. Installation

Install dependencies for all workspaces from the project root:

```bash
# Install frontend dependencies
npm install --prefix frontend

# Install backend dependencies
npm install --prefix backend
```

---

### 3. Environment Configuration

#### Backend Configuration
Create `backend/.env` based on `backend/.env.example`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mandi_mitra?schema=public"
JWT_SECRET="your-secure-jwt-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"
AGMARK_API_KEY="579b464db66ec23bdd0000013646f021748b4dac7e0fc075e67376eb"
AGMARK_RESOURCE_ID="9ef84268-d588-465a-a308-a864a43d0070"
INGESTION_CRON="0 */6 * * *"
```

#### Frontend Configuration
Create `frontend/.env` based on `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

### 4. Database Setup & Ingestion (Backend)

Run Prisma migrations and initial seed from the root or `backend/` folder:

```bash
# Navigate to backend
cd backend

# Run database migrations
npx prisma migrate dev

# Seed reference commodities and initial benchmark data
npm run db:seed

# (Optional) Run full live AGMARK API sync
npm run ingest:live
```

---

### 5. Running the Application

From the root directory, run both servers:

```bash
# Start Frontend (http://localhost:5173)
npm run dev:frontend

# Start Backend (http://localhost:5000)
npm run dev:backend
```

Or start both concurrently in separate terminal tabs.

---

## 🧪 Testing & Validation

Run the automated test suite:

```bash
# Run 24 unit & integration tests for backend
npm test

# Build the frontend client for production
npm run build
```

---

## 🌟 Core Features

1. **Real-Time Price Discovery Search**:
   - Filter live AGMARK mandi data by State, Commodity, and Arrival Date.
   - Highlights Best APMC to sell (highest net realization), Lowest Procurement Floor, and spatial price spreads.

2. **Marketing Precision & Crop Surveillance**:
   - Precision pricing intelligence to identify peak modal premiums.
   - Real-time arrival volume tracking and demand-supply surveillance.

3. **Interactive Mandi Arbitrage Calculator**:
   - Dynamic simulation comparing local mandi rates to highest-paying regional APMCs.
   - Real-time estimated gross profit gain calculation.

4. **Multi-Mode Analytics Dashboard**:
   - **Crop Mode**: Multi-day historical price trajectories, 7-day to 1-year presets, custom date pickers, and inter-mandi profitability comparisons.
   - **APMC Mode**: Mandi trade volume, market benchmarks, and comparative commodity basket analysis.

5. **Automated Background Ingestion**:
   - Scheduled cron jobs automatically ingest and normalize daily price updates from the official AGMARK data feed.

---

## 👨‍💻 Developer & Contact

**Aaryan Kumar** — *Computer Science & Data Analytics*

- **LinkedIn**: [https://www.linkedin.com/in/aaryan-k-ba3985246/](https://www.linkedin.com/in/aaryan-k-ba3985246/)
- **GitHub**: [https://github.com/9aaryanCyberH](https://github.com/9aaryanCyberH)
- **Resume**: [View Online](https://drive.google.com/file/d/1BrrYb8FwXAVyU6mplO27FitPqQi9Lv7F/view)

---

## 🛡️ License

This project is built and maintained by **Aaryan Kumar**.  
Licensed under the [MIT License](LICENSE).
