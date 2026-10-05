# 3D Shop 🎨

A full-stack e-commerce platform for 3D printing services. Browse products, customize orders, manage payments, and track deliveries—built with modern tech and zero overthinking.

**[Read the full story](PROJECT_STORY.md)** about this vibe-coded project.

---

## Tech Stack

### Frontend

- **React 18** + **TypeScript** — type-safe component architecture
- **Vite** — lightning-fast build tooling
- **i18n** — multi-language support
- **CSS Modules** — scoped styling

### Backend

- **ASP.NET Core 8** — high-performance REST API
- **Entity Framework Core** — ORM with migrations
- **JWT Authentication** — secure token-based auth
- **SQL Database** — persistent data layer

---

## Project Structure

```
3d-shop/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client services
│   │   ├── context/        # State management
│   │   ├── i18n/          # Internationalization
│   │   └── types/         # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── PrintCraftApi/          # ASP.NET Core backend
│   ├── Controllers/        # API endpoints
│   ├── Services/           # Business logic
│   ├── Models/             # Entity models
│   ├── Migrations/         # Database migrations
│   ├── Data/              # DbContext
│   ├── Validation/        # Input validation
│   ├── appsettings.json
│   └── Program.cs
│
├── PROJECT_STORY.md        # The journey
└── README.md              # This file
```

---

## Getting Started

### Prerequisites

- **.NET 8 SDK** — [install](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** — [install](https://nodejs.org)
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/VladOniscenko/3d-shop.git
   cd 3d-shop
   ```

2. **Setup Backend**

   ```bash
   cd PrintCraftApi
   dotnet restore
   dotnet ef database update  # Apply migrations
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

---

## Running the Project

### Development Mode

**Terminal 1 — Backend API** (runs on `ASPNETCORE_URLS` from `.env`)

```bash
cd PrintCraftApi
dotnet run
```

**Terminal 2 — Frontend** (dev server URL from your frontend setup)

```bash
cd frontend
npm run dev
```

Open the frontend URL configured for your environment.

### Docker (Full Stack)

Run frontend and backend together with Docker Compose:

1. Ensure Docker Desktop is running.
2. Make sure `.env` exists at project root (copy from `.env.example` and fill values if needed).
3. Start everything:

```bash
docker compose up --build
```

Services:

- Frontend: `FrontendBaseUrl`
- API: `BackendBaseUrl`
- PostgreSQL: connection from `ConnectionStrings__DefaultConnection`

Stop services:

```bash
docker compose down
```

Reset containers and volumes (wipes PostgreSQL/upload data):

```bash
docker compose down -v
```

### Production Build

**Frontend**

```bash
cd frontend
npm run build
```

**Backend**

```bash
cd PrintCraftApi
dotnet publish -c Release
```

---

## Database

Migrations are located in `PrintCraftApi/Migrations/`. The schema includes:

- **Products** — catalog with pricing and materials
- **Users** — customer accounts and authentication
- **Orders** — order management with status tracking
- **OrderItems** — line items with filament selections
- **Cart** — per-user shopping cart
- **Payments** — payment processing records
- **Admin Tools** — order notes, status history, communications

### Run Migrations

```bash
cd PrintCraftApi
dotnet ef database update
```

### Add a New Migration

```bash
dotnet ef migrations add YourMigrationName
dotnet ef database update
```

---

## API Documentation

See [PrintCraftApi.http](PrintCraftApi/PrintCraftApi.http) for a complete list of endpoints.

### Key Endpoints

- `POST /auth/register` — Create account
- `POST /auth/login` — Authenticate
- `GET /products` — List all products
- `POST /cart/add` — Add to cart
- `POST /orders` — Create order
- `GET /orders/{id}` — Get order details
- `POST /payments/process` — Process payment
- `GET /admin/orders` — Admin dashboard

---

## Configuration

### Business Information and SEO

Edit [frontend/src/config/businessInfo.ts](frontend/src/config/businessInfo.ts)
for the business name, email, phone, address, opening hours, and public website URL.
The React UI, English/Dutch translations, route metadata, and structured data use
this configuration. Vite also uses it to populate the initial HTML metadata and
generate `robots.txt` and `sitemap.xml` during development and production builds.
Rebuild the frontend after changing these values for a production deployment.

The phone, city-level address, and opening hours retain the previous site's values;
confirm them before launch. No street address was supplied.

### API Environments

`ASPNETCORE_ENVIRONMENT` selects the API environment (case-insensitive):

| Value | Settings Override |
| --- | --- |
| `dev` or `Development` | `PrintCraftApi/appsettings.Development.json` |
| `tst` or `Test` | `PrintCraftApi/appsettings.Test.json` |
| `prod` or `Production` | `PrintCraftApi/appsettings.Production.json` |

Startup normalizes these aliases before creating the ASP.NET host. Common settings
remain in `appsettings.json`, so environment files contain only their overrides.
Configuration precedence is base JSON, environment JSON, development user secrets,
environment variables (including `__` nested keys), then command-line arguments.
If `ASPNETCORE_ENVIRONMENT` is absent, `DOTNET_ENVIRONMENT` is used; if neither is
set, the default is Production. Unsupported environment names fail at startup.
Swagger is enabled only in Development. Keep secrets and environment-specific
database connections and base URLs in environment variables or a secret manager.
Use a separate database and credentials for Test.

PowerShell example for Test:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "tst"
dotnet run --project PrintCraftApi --no-launch-profile
```

Use `--no-launch-profile` when selecting an environment yourself: the existing
local launch profiles set `ASPNETCORE_ENVIRONMENT=Development`. The root `.env`
is loaded for missing process variables only, so deployed environment values win.

### Environment Variables

Create `.env` files (if needed):

**Frontend** — `.env.local`

```
VITE_DEV_API_ORIGIN=<dev-api-origin>
VITE_CURRENCY_CODE=EUR
```

**Backend** — root `.env`

```env
POSTGRES_DB=printcraft
POSTGRES_USER=replace-me
POSTGRES_PASSWORD=replace-me
ConnectionStrings__DefaultConnection=Host=<db-host>;Port=<db-port>;Database=<db-name>;Username=<db-user>;Password=<db-password>
FrontendBaseUrl=<frontend-base-url>
BackendBaseUrl=<backend-base-url>
ASPNETCORE_URLS=<backend-listen-url>
ASPNETCORE_ENVIRONMENT=dev
JwtSecret=replace-with-very-strong-dev-secret-min-32-chars
JwtIssuer=printcraft-api
JwtAudience=printcraft-client
Discord__ErrorWebhookUrl=replace-me
Discord__QuoteWebhookUrl=replace-me
Discord__BookingWebhookUrl=replace-me
Discord__PaymentReceivedWebhookUrl=replace-me
CurrencyCode=EUR
VITE_DEV_API_ORIGIN=<dev-api-origin>
VITE_CURRENCY_CODE=EUR
Email__ApiToken=replace-me
Email__Username=replace-me
Email__Password=replace-me
Email__SenderName=PrintCraft Dev
Email__SenderEmail=hello@demomailtrap.com
Email__SmtpHost=sandbox.smtp.mailtrap.io
Email__SmtpPort=587
Email__EnableSsl=true
Email__ApiBaseUrl=https://send.api.mailtrap.io/api/send
Email__Category=Integration Test
```

### Bank Transfer Payments

- Configure `BankTransfer__AccountName`, `BankTransfer__Iban`, and `BankTransfer__Bic`.
- Customers receive a unique payment reference on their order.
- Customers can report that they made the transfer; an admin notification and audit note are created.
  - The API accepts any configured secret for signature verification.

---

## Development Workflow

1. **Create a feature branch** — `git checkout -b feature/your-feature`
2. **Make changes** — code, test, commit
3. **Push & create PR** — get feedback
4. **Merge to main** — ship it 🚀

Commits follow conventional format:

- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code improvements
- `test:` — test additions
- `docs:` — documentation

---

## Contributing

This project was built with intuition and iteration. If you have ideas or improvements:

1. Open an issue or PR
2. Keep it simple and focused
3. Follow the tech stack conventions
4. Test your changes

---

## License

Built with 💚 by Vlad Oniscenko

---

## Support

Have questions? Check out:

- [PROJECT_STORY.md](PROJECT_STORY.md) — understand the philosophy
- `appsettings.json` — configuration guide
- `PrintCraftApi.http` — API examples

---

**Last Updated:** 28 March 2026  
**Status:** Production-Ready (Vibe Verified ✨)
