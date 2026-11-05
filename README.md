# SpendWise

SpendWise is a personal finance dashboard for tracking income, expenses, monthly budgets, and spending activity. It uses a React frontend, an Express API, Prisma, and PostgreSQL.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Recharts |
| Backend | Node.js, Express 5, TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Managed database | Supabase PostgreSQL |

## Project structure

```text
SpendWise/
├── backend/    Express API, Prisma schema/migrations, integration tests
├── frontend/   React dashboard, API client, Vite configuration
├── render.yaml Render Blueprint for the backend
└── README.md
```

## Implemented features

- Transaction create, read, update, and delete
- Transaction search, category/type/date filters, and pagination
- Budget create, read, update, and delete
- Duplicate budget prevention per category/month/year
- Dashboard summary, category budget overview, and daily activity data
- Server-side validation and consistent JSON errors
- Loading, empty, error, and submission states in the frontend
- Backend integration tests with an isolated test schema

## Local development

### Prerequisites

- Node.js 20.19 or newer
- npm
- PostgreSQL running locally
- A database named `spendwise_db` (or your own database name)

### 1. Backend

```powershell
cd backend
npm install
npm run prisma:generate
Copy-Item .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/spendwise_db?schema=public"
PORT=4000
FRONTEND_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

Do not commit `.env`. Only `.env.example` is tracked.

Apply the existing migrations:

```powershell
npm run prisma:migrate:deploy
```

Start the API:

```powershell
npm run dev
```

The API runs at `http://localhost:4000`. Verify it with:

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/api/health
```

### 2. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Start the dashboard:

```powershell
npm run dev
```

Open `http://localhost:5173`.

### 3. Tests and builds

Backend integration tests use the isolated PostgreSQL schema `spendwise_test`. They do not modify development data in the `public` schema.

```powershell
cd backend
npm test
npm run typecheck
npm run typecheck:test
npm run build
```

Frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

There is no frontend unit-test runner configured; frontend behavior is verified with lint, the production build, and browser checks.

## Environment variables

Only placeholder examples are shown here. Never commit real credentials.

### Backend

| Variable | Required | Production example | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require` | PostgreSQL connection string |
| `PORT` | No | Set automatically by Render | API port; defaults to `4000` |
| `FRONTEND_ORIGIN` | Yes in production | `https://your-frontend.vercel.app` | Allowed CORS origin |
| `NODE_ENV` | No | `production` | Runtime mode |

Use the Supabase **Session pooler** connection string (port `5432`) for both application queries and Prisma migrations. Supabase's direct connection is IPv6-only unless the paid IPv4 add-on is enabled, and Render does not support outbound IPv6.

### Frontend

| Variable | Required | Production example | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | Yes | `https://your-backend.onrender.com/api` | Backend API base URL, including `/api` |

Set `VITE_API_URL` in Vercel, not in committed source code.

## API overview

All API routes use the `/api` prefix. Health checks are also exposed at the root.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/api/health` | Health check |
| GET | `/api/transactions` | List/filter/paginate transactions |
| GET | `/api/transactions/:id` | Get one transaction |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/budgets` | List/filter budgets |
| GET | `/api/budgets/:id` | Get one budget |
| POST | `/api/budgets` | Create a budget |
| PUT | `/api/budgets/:id` | Update a budget |
| DELETE | `/api/budgets/:id` | Delete a budget |
| GET | `/api/dashboard/summary` | Dashboard totals |
| GET | `/api/dashboard/budgets` | Category budget overview |
| GET | `/api/dashboard/activity` | Daily income/expense chart data |

Successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "code", "message", "details?" } }`.

## Security notes

- Helmet adds standard security headers.
- CORS allows only the configured `FRONTEND_ORIGIN`.
- JSON request bodies are limited to 100 KB.
- Inputs are validated server-side before Prisma queries.
- Error responses never include stack traces, database URLs, or credentials.
- `.env` files are gitignored; only `.env.example` templates are tracked.
- Authentication and authorization are not implemented in the current phase.

## Deployment

The planned deployment is:

```text
Vercel (frontend) → Render (backend API) → Supabase (PostgreSQL)
```

### Deployment status

Deployment configuration has been added, but no live deployment has been completed or verified yet. The URLs below must be filled in only after each service is actually deployed.

| Service | URL |
| --- | --- |
| Frontend | Not deployed yet |
| Backend | Not deployed yet |
| Database | Not provisioned yet |

### 1. Create the Supabase database

1. Sign in to [Supabase](https://supabase.com) and create a new project.
2. Save the database password in a password manager. Do not send it in chat or commit it.
3. Open the project's **Connect** dialog and copy the **Session pooler** connection string (port `5432`).
4. Replace the password placeholder with the real database password.
5. Keep the result private. This value becomes the Render `DATABASE_URL` environment variable.

The connection string should look like this placeholder:

```text
postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require
```

### 2. Apply migrations to production

Run migrations once before starting the production API, and again after any future schema change. This uses the production-safe `migrate deploy` command; it never resets or drops the database.

From `backend`, set the production URL only in your current terminal session:

```powershell
cd backend
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
npm run prisma:migrate:deploy
Remove-Item Env:DATABASE_URL
```

On macOS/Linux:

```bash
cd backend
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require" npm run prisma:migrate:deploy
```

Do not use `prisma migrate dev` against production. Do not use `prisma migrate reset` or `prisma db push` against production.

Render's free tier does not support `preDeployCommand` (a paid-plan feature), so migrations are run manually from a trusted machine. After the first migration, the Render service can start normally.

### 3. Deploy the backend on Render

The repository includes `render.yaml` at the root. It defines a free Node web service with root directory `backend`, build command `npm ci --include=dev && npm run prisma:generate && npm run build`, start command `npm start`, and health check path `/api/health`.

**Blueprint method**

1. Push the repository to GitHub first. Render deploys from the repository, not from your local machine.
2. In Render, choose **New → Blueprint** and select the SpendWise repository.
3. When prompted for the `sync: false` variables, enter:
   - `DATABASE_URL`: the Supabase Session pooler URL
   - `FRONTEND_ORIGIN`: the Vercel production URL, or `http://localhost:5173` temporarily until the frontend is deployed
4. Apply the Blueprint and wait for the build and health check to pass.
5. Copy the service URL, for example `https://spendwise-api.onrender.com`.

If the service name or `onrender.com` subdomain is already taken, change `name` in `render.yaml` or use the Render dashboard to choose another name.

**Manual service method**

Create a **Web Service** in Render with:

| Setting | Value |
| --- | --- |
| Repository | SpendWise GitHub repository |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci --include=dev && npm run prisma:generate && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Add the environment variables listed above. Render supplies `PORT` automatically.

Free Render web services spin down after 15 minutes of inactivity and take about a minute to wake. Supabase free projects may also be paused after a period of inactivity; restore the project in the Supabase dashboard if the API reports that the database is unavailable. This is expected for a student project.

### 4. Deploy the frontend on Vercel

The frontend includes `frontend/vercel.json` with the Vite build settings.

1. In Vercel, choose **Add New → Project** and import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Keep **Framework Preset** as `Vite`.
4. Add an environment variable for the Production environment:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.onrender.com/api`
5. Deploy the project.
6. Copy the production URL, for example `https://spendwise.vercel.app`.

Vite embeds `VITE_API_URL` at build time. If the backend URL changes, update the Vercel variable and redeploy the frontend.

### 5. Connect CORS after both deployments

Once the Vercel URL is known:

1. Open the Render service's environment variables.
2. Set `FRONTEND_ORIGIN` to the exact Vercel production origin, including `https://` and without a trailing slash.
3. Save the change and let Render redeploy/restart.
4. If the backend URL changed, update `VITE_API_URL` in Vercel and redeploy the frontend.

Only one frontend origin is allowed. Vercel preview deployment URLs are not automatically allowed; use the production URL for the deployed application, or add a future multi-origin configuration if previews are needed.

### 6. Verify the deployment

```powershell
# Backend health
Invoke-RestMethod https://your-backend.onrender.com/health

# Frontend
Start-Process https://your-frontend.vercel.app
```

Then verify in the browser:

1. The dashboard loads without console errors.
2. Empty states appear correctly when there is no data.
3. Create a transaction and confirm it appears in the dashboard.
4. Refresh the page and confirm the transaction persists.
5. Edit and delete the transaction.
6. Create a budget and confirm the dashboard budget data updates.
7. Confirm there are no CORS errors or failed network requests in the browser console.
8. Check the Render logs for server errors.

### Live deployment URLs

These values will be added here only after verification:

- Frontend: not deployed yet
- Backend: not deployed yet
- Database: not provisioned yet

## Useful backend scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the API with reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled API |
| `npm run typecheck` | Type-check application source |
| `npm run typecheck:test` | Type-check tests and test configuration |
| `npm test` | Run backend integration tests |
| `npm run prisma:migrate` | Create/apply development migrations |
| `npm run prisma:migrate:deploy` | Apply existing migrations safely |
| `npm run prisma:studio` | Open Prisma Studio |

## Troubleshooting

- **API says the database is unavailable:** confirm PostgreSQL is running and `DATABASE_URL` is correct.
- **Render cannot connect to Supabase:** use the Session pooler host on port `5432`, not the IPv6-only direct connection.
- **Migrations fail on Supabase:** confirm the password is correct and that you used `npm run prisma:migrate:deploy`, not `migrate dev`.
- **Frontend shows an API/network error:** confirm `VITE_API_URL` is set in Vercel and includes `/api`, then redeploy.
- **CORS blocked:** make sure Render's `FRONTEND_ORIGIN` exactly matches the browser origin, including the protocol.
- **Tests refuse to start:** make sure `DATABASE_URL` is configured; tests intentionally reject non-test database targets.
- **Prisma Client missing:** run `npm run prisma:generate` in `backend`.
