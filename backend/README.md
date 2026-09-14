# 🌾 Mandi-Mitra Backend

Production-ready, highly reliable backend for **Mandi-Mitra** — an agricultural mandi-price platform providing up-to-date **AGMARK mandi market data** across Indian states.

Built with **Node.js, Express, PostgreSQL, and Prisma ORM**, this backend features automated scheduled ingestion, data normalization, versioned REST APIs, price analytics, user authentication, and **100% backward compatibility** with the existing React frontend.

---

## 🏗️ System Architecture

```text
               Official AGMARK Data Source
               (data.gov.in / AGMARKNET)
                           │
                           ▼
                  Scheduled Ingestion
                  (node-cron / manual)
                           │
                           ▼
                  AGMARK API Client
                           │
                           ▼
                  Parser & Normalizer
             (strips symbols, standardizes names,
              validates prices, formats dates)
                           │
                           ▼
                 PostgreSQL Database
             (Prisma ORM, unique constraints,
              indexes on state, mandi, commodity)
                           │
                           ▼
                   Express REST API
           ┌───────────────┴───────────────┐
           ▼                               ▼
Legacy Compatibility Routes          Versioned APIs
  GET  /states                       GET  /api/v1/states
  GET  /commodities?state=...        GET  /api/v1/commodities
  POST /getdata                      GET  /api/v1/mandis
  GET  /health                       GET  /api/v1/prices
                                     GET  /api/v1/prices/analytics
                                     GET  /api/v1/prices/compare
                                     GET  /api/v1/prices/history
                                     POST /api/v1/auth/register
                                     POST /api/v1/auth/login
                                     GET  /api/v1/admin/stats
           │
           ▼
     Mandi-Mitra UI
   (React + Vite Frontend)
```

---

## 🚀 Features

- **Database-First Serving**: Frontend queries hit the local indexed PostgreSQL database, ensuring millisecond response times without scraping external websites on every user request.
- **Dedicated Ingestion Layer**: Modular AGMARK client with normalization for currency symbols, commas, capitalization, and date formatting.
- **100% Frontend Compatible**: Seamless drop-in replacement for the existing React UI (`GET /states`, `GET /commodities?state=...`, `POST /getdata`).
- **Advanced Price Analytics**: Lowest price, highest price, modal price average, historical price trends, and cross-mandi price comparisons.
- **Security & Reliability**: Helmet headers, CORS policies, rate limiting, Zod validation, centralized error handling, and transaction logging.
- **Role-Based Authentication**: Secure bcrypt password hashing, signed JWT tokens, and Admin endpoints.

---

## 📊 Database Architecture

### Data Models
1. **`State`**: Standardized Indian states (`name`, `code`).
2. **`District`**: Districts mapped to their parent state with unique compound constraint (`[name, stateId]`).
3. **`Mandi`**: Agricultural produce market committees (APMC/Mandis) mapped to state and district (`[name, stateId, districtId]`).
4. **`Commodity`**: Standardized agricultural produce (`name`, `code`).
5. **`MarketPrice`**: Daily price records (`minPrice`, `modalPrice`, `maxPrice`, `arrivalDate`, `unit`, `variety`, `grade`, `source`).
   - Unique compound constraint: `@@unique([mandiId, commodityId, arrivalDate])` to prevent duplicate daily records.
6. **`User`**: Accounts with roles (`USER`, `ADMIN`) and bcrypt hashed passwords.
7. **`IngestionLog`**: Complete audit logs tracking records fetched, inserted, updated, rejected, duration, and errors.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma ORM
- **Authentication**: JSON Web Tokens (JWT) & bcrypt
- **Validation**: Zod
- **Security**: Helmet, CORS, Express-Rate-Limit
- **Task Scheduling**: node-cron
- **Testing**: Vitest & Supertest

---

## ⚙️ Environment Variables

Create a `.env` file in `mandi-mitra-backend/` based on `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:babaji12@localhost:5432/mandi_mitra

# CORS Allowed Origin (Frontend)
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Background Ingestion Schedule (Default: Every 6 hours)
SCRAPER_CRON=0 */6 * * *

# AGMARK Official Data Source
AGMARK_BASE_URL=https://api.data.gov.in/resource
AGMARK_RESOURCE_ID=35985678-0d79-46b4-9ed6-6f13308a1d24
AGMARK_API_KEY=your_official_data_gov_in_api_key
```

---

## 💻 Local Setup & Installation

### 1. Navigate to Backend Directory
```bash
cd mandi-mitra-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma Client
```bash
npm run build
```

### 4. Run Database Migrations
```bash
npm run migrate:dev
```

### 5. Seed Reference Data
Populates states, districts, commodities, admin user, and initial reference AGMARK prices:
```bash
npm run seed
```

### 6. Start the Backend Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The backend will start at `http://localhost:5000`.

---

## 🌾 Ingestion Commands

### Manual Data Ingestion
To fetch and update the latest AGMARK mandi market data manually:
```bash
npm run ingest
```

### Custom Ingestion Filters
```bash
# Fetch 1,000 records
node scripts/ingest.js --limit 1000

# Filter by state or commodity
node scripts/ingest.js --state Punjab --commodity Wheat
```

---

## 📡 API Documentation & Curl Examples

### 1. Health Check
```bash
curl -X GET http://localhost:5000/health
```
Response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-09-14T11:00:00.000Z"
}
```

---

### 2. Frontend Compatibility Endpoints

#### Get States
```bash
curl -X GET http://localhost:5000/states
```
Response:
```json
{
  "data": [
    "Andhra Pradesh",
    "Gujarat",
    "Haryana",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Punjab",
    "Rajasthan",
    "Uttar Pradesh",
    "West Bengal"
  ]
}
```

#### Get Commodities for a State
```bash
curl -X GET "http://localhost:5000/commodities?state=Punjab"
```
Response:
```json
{
  "data": [
    "Apple",
    "Rice",
    "Wheat"
  ]
}
```

#### Get Mandi Prices
```bash
curl -X POST http://localhost:5000/getdata \
  -H "Content-Type: application/json" \
  -d '{"state": "Punjab", "commodity": "Apple"}'
```
Response:
```json
{
  "data": [
    {
      "APMC's": "Amritsar Mandi",
      "District": "Amritsar",
      "Commodity": "Apple",
      "Min Price": 4000,
      "Modal Price": 4500,
      "Max Price": 5000,
      "Arrival Date": "14/09/2026"
    }
  ]
}
```

---

### 3. Versioned REST APIs (`/api/v1/`)

#### List Mandis (Filtered & Paginated)
```bash
curl -X GET "http://localhost:5000/api/v1/mandis?state=Punjab&limit=10"
```

#### Search Market Prices
```bash
curl -X GET "http://localhost:5000/api/v1/prices?commodity=Apple&state=Punjab&limit=20"
```

#### Price Analytics (Lowest, Highest, Average Modal)
```bash
curl -X GET "http://localhost:5000/api/v1/prices/analytics?commodity=Apple&state=Punjab"
```
Response:
```json
{
  "success": true,
  "data": {
    "totalRecords": 3,
    "lowestPrice": {
      "price": 3900,
      "mandi": "Jalandhar City Mandi",
      "state": "Punjab",
      "district": "Jalandhar",
      "arrivalDate": "14/09/2026"
    },
    "highestPrice": {
      "price": 5100,
      "mandi": "Ludhiana Grain Market",
      "state": "Punjab",
      "district": "Ludhiana",
      "arrivalDate": "14/09/2026"
    },
    "averageModalPrice": 4500
  }
}
```

#### Compare Prices Across Mandis
```bash
curl -X GET "http://localhost:5000/api/v1/prices/compare?commodity=Wheat&state=Punjab"
```

#### Price History Trend
```bash
curl -X GET "http://localhost:5000/api/v1/prices/history?commodity=Wheat&days=30"
```

---

### 4. Authentication Endpoints

#### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@example.com", "password": "SecurePassword123", "name": "Ramesh Kumar"}'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@example.com", "password": "SecurePassword123"}'
```

#### Get Current User Profile
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

---

### 5. Admin Endpoints (Requires Admin Role)

Default Seeded Admin:
- Email: `admin@mandimitra.gov.in`
- Password: `Admin@12345`

#### Check Ingestion Status & History
```bash
curl -X GET http://localhost:5000/api/v1/admin/ingestion/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### Trigger Ingestion via API
```bash
curl -X POST http://localhost:5000/api/v1/admin/ingestion/run \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"limit": 500}'
```

#### View System Statistics
```bash
curl -X GET http://localhost:5000/api/v1/admin/stats \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 🧪 Testing

Run the automated test suite:
```bash
npm test
```

The test suite covers:
- Legacy compatibility endpoints (`/states`, `/commodities`, `/getdata`)
- Validation errors and missing parameter rejections
- Normalization logic (currency symbols, whitespace, date formats, price cleanup)
- Duplicate record prevention (`@@unique([mandiId, commodityId, arrivalDate])`)
- Authentication, bcrypt password hashing, and JWT authorization
- Admin role restrictions

---

## 🚀 Deployment (Render / Railway / VPS)

1. Set Environment Variables in dashboard:
   - `PORT`: (automatically provided by Render/Railway)
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your managed PostgreSQL connection URI
   - `FRONTEND_URL`: Your frontend production domain (e.g. `https://mandi-mitra.vercel.app`)
   - `JWT_SECRET`: Strong secret key
   - `AGMARK_API_KEY`: Your official data.gov.in API key
   - `AGMARK_RESOURCE_ID`: `35985678-0d79-46b4-9ed6-6f13308a1d24`
2. Build Command:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```
3. Start Command:
   ```bash
   npm start
   ```

---

## 🔗 Connecting with Mandi-Mitra Frontend

In your frontend `src/App.jsx`, update the `API_BASE_URL`:
```javascript
const API_BASE_URL = "http://localhost:5000"; // For local development
// or "https://your-backend-domain.onrender.com" for production
```

No other changes are required in `App.jsx`!
