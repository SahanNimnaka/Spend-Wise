# SpendWise — Personal Finance Management

<p align="center">
  <strong>A full-stack personal finance dashboard for tracking income, expenses, and monthly budgets.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-orange" alt="Project Status: In Development" />
  <img src="https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript-blue" alt="Frontend: React and TypeScript" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green" alt="Backend: Node.js and Express" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791" alt="Database: PostgreSQL" />
  <img src="https://img.shields.io/badge/ORM-Prisma-2D3748" alt="ORM: Prisma" />
</p>

---

## Overview

**SpendWise** is a personal finance management application designed to help users understand and manage their everyday finances through a centralized dashboard.

The application brings income and expense tracking, category-based budgeting, and financial summaries into one place. Its goal is to make financial activity easier to record, review, and understand through a clean interface and meaningful visualizations.

SpendWise is being developed as a full-stack application with a React and TypeScript frontend, a Node.js and Express backend, and a PostgreSQL database managed through Prisma ORM.

## Key Features

> Update this list to reflect the features that are implemented and verified in the current version.

### Dashboard
- Overview of financial activity
- Income and expense summaries
- Balance overview
- Recent transaction activity
- Visual representations of spending patterns
- Budget progress summaries

### Transaction Management
- Record income and expenses
- Categorize financial transactions
- View transaction history
- Update transaction details
- Delete transactions
- Store transaction dates and descriptions

### Budget Management
- Create budgets for spending categories
- Set monthly budget limits
- Track spending against budget limits
- Review budget progress
- Identify categories approaching or exceeding their limits

### Data Visualization
- Charts for financial summaries
- Category-based spending breakdowns
- Visual budget progress indicators

### Application Experience
- Responsive dashboard interface
- Loading, error, and empty states
- Structured frontend and backend architecture

## Screenshots

Add screenshots of the actual application here.

| Dashboard | Transactions |
|---|---|
| <!-- Add dashboard screenshot --> | <!-- Add transactions screenshot --> |

| Budget Management | Analytics |
|---|---|
| <!-- Add budget screenshot --> | <!-- Add analytics screenshot --> |

## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Static typing and maintainable frontend code |
| Vite | Development server and build tooling |
| CSS | Application styling (`src/App.css`) |
| Lucide React | Interface icons |
| Recharts | Data visualization |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| TypeScript | Type-safe backend development |
| Prisma ORM | Database access and schema management |
| PostgreSQL | Relational database |

### Development and Deployment
| Tool | Purpose |
|---|---|
| Git and GitHub | Version control and source code hosting |
| npm | Dependency management |
| Postman | API testing |
| Vercel | Frontend deployment |
| Render | Backend deployment |
| Supabase | Managed PostgreSQL hosting |

*Deployment providers should be updated to match the actual production setup.*

## Architecture

SpendWise follows a client-server architecture.

```mermaid
flowchart TD
    User[User] --> Frontend[React + TypeScript Frontend]
    Frontend -->|HTTP REST API| Backend[Node.js + Express Backend]
    Backend --> Prisma[Prisma ORM]
    Prisma --> Database[(PostgreSQL Database)]
    Backend --> Frontend
```

### Request Flow

1. The user interacts with the SpendWise frontend.
2. The frontend sends an HTTP request to the backend API.
3. The backend validates and processes the request.
4. Prisma ORM communicates with PostgreSQL.
5. The backend returns a response to the frontend.
6. The frontend updates the interface with the returned data.

## Project Structure

```text
SpendWise/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── ...
│   ├── package.json
│   ├── prisma.config.ts
│   └── ...
│
├── .gitignore
└── README.md
```

*The structure above is illustrative. Adjust it to match the actual repository.*

## Getting Started

### Prerequisites

Install the following before running SpendWise locally:

- [Node.js](https://nodejs.org/) — use a version compatible with the project
- npm
- [PostgreSQL](https://www.postgresql.org/) or a managed PostgreSQL database
- [Git](https://git-scm.com/)
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/SahanNimnaka/SpendWise.git
cd SpendWise
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies

Open another terminal:

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `backend/` directory.

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/spendwise_db?schema=public"

# Backend server (optional; defaults to 4000)
PORT=4000

# Frontend origin allowed to access the API
FRONTEND_ORIGIN="http://localhost:5173"

# development | test | production (optional; defaults to development)
NODE_ENV="development"
```

Create a frontend `.env` file:

```env
# Base URL of the backend API, including the /api prefix
VITE_API_URL="http://localhost:4000/api"
```

Replace the placeholder database values with your own local or managed PostgreSQL credentials.

**Never commit real `.env` files, passwords, or API secrets.**

### 5. Create the Database

Create a PostgreSQL database named:

```text
spendwise_db
```

Alternatively, use a database created through a managed PostgreSQL provider.

### 6. Apply Prisma Migrations

From the `backend/` directory, apply the existing migrations:

```bash
npm run prisma:migrate:deploy
```

Generate the Prisma Client:

```bash
npm run prisma:generate
```

Use `npm run prisma:migrate` (`prisma migrate dev`) only while creating new migrations during development. Never use `migrate reset` or `db push` against a production database.

### 7. Run the Backend

From the `backend/` directory:

```bash
npm run dev
```

The backend should start at the configured local port.

### 8. Run the Frontend

From the `frontend/` directory:

```bash
npm run dev
```

Open the local URL printed by Vite, commonly:

```text
http://localhost:5173
```

## Environment Variables

| Variable | Location | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string | `postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true&connection_limit=1` |
| `PORT` | Backend | Local development only; Vercel ignores it | `4000` |
| `FRONTEND_ORIGIN` | Backend | Exact allowed frontend origin for CORS | `https://your-frontend.vercel.app` |
| `NODE_ENV` | Backend | Runtime mode | `production` |
| `VITE_API_URL` | Frontend | Base URL of the backend API, including `/api` | `https://your-backend.vercel.app/api` |

For the managed database, use the Supabase **Transaction pooler** connection string (port `6543`, with `?pgbouncer=true&connection_limit=1`) for the Vercel serverless runtime. Run Prisma migrations with the **Session pooler** connection string (port `5432`) instead. Supabase's direct connection is IPv6-only unless the paid IPv4 add-on is enabled.

`VITE_API_URL` is embedded at build time. Set it in the Vercel project settings, not in committed source, and redeploy after changing it.

## Database

SpendWise uses PostgreSQL for persistent storage and Prisma ORM for database access and schema management.

### Transaction

The transaction model represents income and expense records.

| Field | Description |
|---|---|
| `id` | Unique transaction identifier |
| `title` | Transaction title |
| `amount` | Transaction amount |
| `type` | Income or expense |
| `category` | Transaction category |
| `date` | Transaction date |
| `description` | Optional transaction description |
| `createdAt` | Record creation timestamp |
| `updatedAt` | Last update timestamp |

### Budget

The budget model represents a spending limit for a category and time period.

| Field | Description |
|---|---|
| `id` | Unique budget identifier |
| `category` | Budget category |
| `limit` | Maximum planned spending |
| `month` | Budget month |
| `year` | Budget year |
| `createdAt` | Record creation timestamp |
| `updatedAt` | Last update timestamp |

*Refer to `backend/prisma/schema.prisma` for the authoritative schema.*

## API

The backend exposes a REST API for frontend communication.

> Replace the example endpoint descriptions below with the exact routes implemented in the backend.

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | Retrieve transactions |
| `GET` | `/api/transactions/:id` | Retrieve a transaction |
| `POST` | `/api/transactions` | Create a transaction |
| `PUT` | `/api/transactions/:id` | Update a transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |

### Budgets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budgets` | Retrieve budgets |
| `POST` | `/api/budgets` | Create a budget |
| `PUT` | `/api/budgets/:id` | Update a budget |
| `DELETE` | `/api/budgets/:id` | Delete a budget |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Retrieve financial summary |
| `GET` | `/api/dashboard/activity` | Retrieve recent activity |
| `GET` | `/api/dashboard/budgets` | Retrieve budget overview |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check backend service status |

## Testing and Quality Checks

Run the scripts available in each package. Typical checks may include:

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
npm run build
```

If tests are configured:

```bash
npm test
```

Use Postman or another API client to verify the implemented endpoints, including successful requests, invalid input, and missing records.

## Deployment

The intended deployment setup is:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Vercel Functions (Express) |
| PostgreSQL | Supabase or another managed PostgreSQL provider |

### Deployment Checklist

- [ ] Create and configure the production PostgreSQL database
- [ ] Set production environment variables
- [ ] Apply Prisma migrations safely
- [ ] Deploy the backend API
- [ ] Configure production CORS
- [x] Deploy the frontend
- [ ] Set the frontend API URL (`VITE_API_URL`) and redeploy
- [ ] Verify the health endpoint
- [ ] Test transaction and budget operations
- [ ] Confirm no secrets are exposed in the repository

Current deployment status:

- **Frontend:** https://spendwise-mauve-tau.vercel.app — Vercel project `spendwise`, Root Directory `frontend`, Git-connected to `main`.
- **Backend API:** Not deployed yet.
- **Database:** Not provisioned yet.

The frontend page loads, but data features show an error because `VITE_API_URL` is not set and the backend does not exist yet. Do not treat the application as fully deployed until the backend and database are live and the checks above pass.

### Production deployment notes

- The backend is deployed as a separate Vercel project with Root Directory `backend`, Framework Preset `Other`, Build Command `npm run vercel-build`, blank Output Directory, and Install Command `npm ci --include=dev`.
- `backend/api/index.ts` exports the Express app as the serverless handler. `src/server.ts` is used only for local long-running development and must not be the Vercel entry point.
- `backend/vercel.json` routes every request to the serverless entry. Vercel preserves the original request URL across rewrites, so Express sees `/api/...` and `/health` unchanged.
- `npm run vercel-build` runs `prisma generate` before `tsc`, so the generated client includes the `rhel-openssl-3.0.x` engine required by Vercel's Node runtime.
- Pin the backend Vercel project to Node.js `22.x` for Prisma stability.
- Run `npm run prisma:migrate:deploy` manually against the production database from a trusted machine using the Supabase Session pooler URL. Never run `prisma migrate dev`, `migrate reset`, or `db push` against production, and never run migrations during the Vercel build.
- Set `FRONTEND_ORIGIN` in the backend Vercel project to the exact frontend production origin. Only one origin is allowed.
- The frontend `VITE_API_URL` is embedded at build time and must include `/api`; redeploy the frontend after changing it.
- `render.yaml` is kept only as a legacy blueprint for the previous Render setup and is not used by the current deployment.

## Security Considerations

SpendWise should follow these security practices:

- Store credentials and secrets in environment variables.
- Never commit `.env` files containing real credentials.
- Validate and sanitize incoming API data.
- Use centralized error handling.
- Configure CORS for trusted frontend origins.
- Avoid returning sensitive configuration details in API responses.
- Keep dependencies updated and review security advisories.
- Use HTTPS in production.

*Only list security controls that are actually implemented as completed features.*

## Current Status

SpendWise is currently under active development.

The project is being developed incrementally, with the focus on building a reliable full-stack foundation, implementing core financial management features, integrating the frontend with the backend, and preparing the application for deployment.

## Roadmap

Potential future improvements include:

- [ ] Advanced transaction filtering and search
- [ ] Custom transaction categories
- [ ] Monthly and yearly financial reports
- [ ] Export transactions to CSV
- [ ] Recurring transactions
- [ ] Savings goals
- [ ] Improved mobile experience
- [ ] Authentication and user-specific financial data
- [ ] Automated testing and CI workflow

*Update this roadmap as features are completed or priorities change.*

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run the available checks.
5. Commit your changes with a descriptive message.
6. Open a pull request describing the changes.

For example:

```bash
git checkout -b feat/transaction-filters
git commit -m "feat: add transaction filtering"
```

## Author

**Sahan Nimnaka**

- GitHub: [@SahanNimnaka](https://github.com/SahanNimnaka)
- Portfolio: [Portfolio Website](https://portfolio-eight-psi-ch3aihk8g1.vercel.app/)

## License

This project is currently distributed without a specified open-source license.

If you intend to make SpendWise open source, add a `LICENSE` file and update this section. Without a license, others generally do not have explicit permission to reuse, modify, or distribute the code.

---

<p align="center">
  <strong>SpendWise — Make every transaction count.</strong>
</p>
