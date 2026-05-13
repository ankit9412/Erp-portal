# 🏢 MSME ERP Platform

A production-grade, enterprise-level ERP system built with the MERN stack for Micro, Small, and Medium Enterprises.

## 🚀 Tech Stack

### Frontend
- React.js + Vite
- Redux Toolkit + RTK Query
- Tailwind CSS + ShadCN UI
- Framer Motion
- Recharts + D3.js
- Socket.IO Client
- React Hook Form + Zod
- PWA Support

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Redis Caching
- Socket.IO
- JWT + Refresh Tokens
- BullMQ Job Queues
- Winston Logging
- PDFKit + Nodemailer

### DevOps
- Docker + Docker Compose
- NGINX Reverse Proxy
- GitHub Actions CI/CD
- AWS Ready
- PM2 Clustering
- Prometheus + Grafana

## 📁 Project Structure

```
erp/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/             # DB, Redis, env configs
│   │   ├── middleware/         # Auth, RBAC, tenant, error
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/
│   │   │   ├── tenant/
│   │   │   ├── user/
│   │   │   ├── inventory/
│   │   │   ├── finance/
│   │   │   ├── hr/
│   │   │   ├── analytics/
│   │   │   ├── notification/
│   │   │   └── audit/
│   │   ├── shared/             # Shared utilities
│   │   ├── jobs/               # BullMQ workers
│   │   ├── sockets/            # Socket.IO handlers
│   │   └── app.js
│   ├── tests/
│   └── Dockerfile
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── app/                # Redux store
│   │   ├── components/         # Shared UI components
│   │   ├── features/           # Feature slices
│   │   ├── hooks/              # Custom hooks
│   │   ├── layouts/            # Page layouts
│   │   ├── pages/              # Route pages
│   │   ├── services/           # API services
│   │   └── utils/
│   └── Dockerfile
├── nginx/                      # NGINX config
├── docker-compose.yml
├── docker-compose.prod.yml
└── .github/workflows/          # CI/CD
```

## 🏗️ Architecture

```
Client (React PWA)
       │
       ▼
  NGINX Gateway
       │
  ┌────┴────┐
  │  API    │  ← Express.js REST API
  │ Server  │
  └────┬────┘
       │
  ┌────┴──────────────────────┐
  │                           │
MongoDB                     Redis
(Primary DB)              (Cache/Sessions)
       │
  BullMQ Workers
  (Background Jobs)
```

## 🔐 Security Features
- JWT Access + Refresh Tokens
- MFA/2FA Authentication
- RBAC Permission Engine
- Rate Limiting
- Helmet Security Headers
- Input Sanitization
- XSS Protection
- CSRF Protection
- Audit Logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis 7+
- Docker & Docker Compose

### Development

```bash
# Clone and install
git clone <repo>
cd erp

# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

### Docker

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Modules

| Module | Description |
|--------|-------------|
| Auth | JWT, OAuth, MFA, Sessions |
| Tenant | Multi-tenancy, Subscriptions |
| Inventory | Stock, Warehouses, Suppliers |
| Finance | Invoices, Accounting, Payroll |
| HR | Employees, Attendance, Leave |
| Analytics | Dashboards, Reports, KPIs |
| Notifications | Real-time, Email, SMS |
| Audit | Logs, Activity Tracking |

## 📄 API Documentation

Swagger UI available at: `http://localhost:5000/api-docs`

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full AWS deployment guide.

## 📝 License

MIT License - Enterprise use permitted.
