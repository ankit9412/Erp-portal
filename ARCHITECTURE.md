# 🏗️ MSME ERP Platform - Complete Architecture

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Database Design](#database-design)
5. [API Structure](#api-structure)
6. [Security Implementation](#security-implementation)
7. [Real-time Features](#real-time-features)
8. [Deployment Guide](#deployment-guide)

---

## System Overview

### Tech Stack
**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- Redis (caching & sessions)
- Socket.IO (real-time)
- BullMQ (job queues)
- JWT authentication
- Winston logging

**Frontend:**
- React.js (JavaScript/JSX)
- Redux Toolkit + RTK Query
- Tailwind CSS + ShadCN UI
- Framer Motion
- Recharts
- Socket.IO Client

**DevOps:**
- Docker + Docker Compose
- NGINX reverse proxy
- PM2 clustering
- GitHub Actions CI/CD

### Architecture Pattern
```
┌─────────────────────────────────────────────────────────┐
│                    Client (React PWA)                    │
│  Redux Store | RTK Query | Socket.IO Client | Tailwind  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   NGINX Gateway                          │
│         (Reverse Proxy, Load Balancer, SSL)             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js API Server (PM2)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Middleware Layer                                 │   │
│  │  • Auth (JWT)  • RBAC  • Tenant  • Validation    │   │
│  │  • Rate Limit  • Audit  • Error Handler          │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Module Layer (Feature-based)                     │   │
│  │  • Auth  • Tenant  • Inventory  • Finance        │   │
│  │  • HR  • Analytics  • Notifications  • Audit     │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service Layer (Business Logic)                   │   │
│  │  • Repository Pattern  • Event Emitters           │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   MongoDB    │ │  Redis   │ │  Socket.IO   │
│  (Primary)   │ │ (Cache)  │ │  (Real-time) │
└──────────────┘ └──────────┘ └──────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│         BullMQ Workers                    │
│  • Email Queue  • Notification Queue     │
│  • Report Queue  • Stock Alert Queue     │
└──────────────────────────────────────────┘
```

---

## Backend Architecture

### Folder Structure
```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   ├── redis.js         # Redis client & cache helpers
│   │   ├── logger.js        # Winston logger setup
│   │   └── swagger.js       # API documentation config
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.js       # JWT authentication
│   │   ├── tenant.middleware.js     # Multi-tenancy
│   │   ├── rbac.middleware.js       # Role-based access control
│   │   ├── error.middleware.js      # Global error handler
│   │   ├── audit.middleware.js      # Activity logging
│   │   └── validate.middleware.js   # Zod validation
│   │
│   ├── modules/             # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── role.model.js
│   │   ├── tenant/
│   │   │   ├── tenant.model.js
│   │   │   └── tenant.routes.js
│   │   ├── user/
│   │   │   └── user.model.js
│   │   ├── inventory/
│   │   │   ├── product.model.js
│   │   │   ├── stock.model.js
│   │   │   ├── stockMovement.model.js
│   │   │   ├── warehouse.model.js
│   │   │   ├── supplier.model.js
│   │   │   ├── purchaseOrder.model.js
│   │   │   ├── inventory.service.js
│   │   │   ├── inventory.controller.js
│   │   │   └── inventory.routes.js
│   │   ├── finance/
│   │   │   ├── invoice.model.js
│   │   │   ├── transaction.model.js
│   │   │   ├── finance.service.js
│   │   │   ├── finance.controller.js
│   │   │   └── finance.routes.js
│   │   ├── hr/
│   │   │   ├── employee.model.js
│   │   │   ├── attendance.model.js
│   │   │   ├── hr.controller.js
│   │   │   └── hr.routes.js
│   │   ├── analytics/
│   │   │   ├── analytics.controller.js
│   │   │   └── analytics.routes.js
│   │   ├── notification/
│   │   │   ├── notification.model.js
│   │   │   ├── notification.service.js
│   │   │   └── notification.routes.js
│   │   └── audit/
│   │       ├── auditLog.model.js
│   │       └── audit.routes.js
│   │
│   ├── shared/              # Shared utilities
│   │   ├── email.service.js
│   │   ├── pdf.service.js
│   │   └── upload.service.js
│   │
│   ├── jobs/                # Background jobs
│   │   ├── queues.js        # BullMQ queue definitions
│   │   ├── workers.js       # Job processors
│   │   └── scheduler.js     # Cron jobs
│   │
│   ├── sockets/             # WebSocket handlers
│   │   └── socket.handler.js
│   │
│   └── app.js               # Express app entry point
│
├── tests/                   # Test files
├── logs/                    # Application logs
├── .env.example
├── package.json
└── Dockerfile
```

### Key Features Implemented

#### 1. Multi-Tenancy
- **Tenant Isolation**: Every request is scoped to a tenant
- **Middleware**: `injectTenant` automatically adds tenant context
- **Database**: All models have `tenantId` field with compound indexes
- **Cross-tenant Prevention**: Middleware prevents data leakage

#### 2. Authentication & Authorization
- **JWT Tokens**: Access (15min) + Refresh (7 days)
- **MFA Support**: TOTP, SMS, Email
- **OAuth**: Google, Microsoft integration ready
- **Session Management**: Device tracking, login history
- **Password Security**: bcrypt hashing, reset tokens

#### 3. RBAC (Role-Based Access Control)
- **Predefined Roles**: Super Admin, Business Owner, Manager, HR, Accountant, etc.
- **Permission Matrix**: Module + Action level permissions
- **Dynamic Permissions**: Custom permissions per user
- **Middleware**: `authorize(module, action)` guards routes

#### 4. Inventory Management
- **Products**: SKU, variants, categories, pricing
- **Stock**: Multi-warehouse, batch/serial tracking, expiry dates
- **Stock Movements**: Complete audit trail
- **Purchase Orders**: Approval workflow, GRN
- **Suppliers**: Performance tracking
- **Low Stock Alerts**: Automated notifications

#### 5. Finance & Accounting
- **Invoices**: GST/VAT support, PDF generation, email
- **Payments**: Multiple methods, partial payments
- **Transactions**: Double-entry bookkeeping ready
- **Expenses**: Category tracking
- **Reports**: P&L, Balance Sheet, Tax reports

#### 6. HR & Payroll
- **Employees**: Complete profile, documents
- **Attendance**: Check-in/out, location tracking
- **Leave Management**: Multiple leave types
- **Payroll**: Salary components, deductions

#### 7. Analytics
- **Dashboard**: Revenue, expenses, inventory, HR metrics
- **KPIs**: Real-time business indicators
- **Forecasting**: Simple linear regression
- **Charts**: Revenue trends, expense breakdown

#### 8. Real-time Features
- **Socket.IO**: Live notifications, inventory updates
- **Room-based**: User rooms, tenant rooms, feature rooms
- **Auto-reconnect**: Resilient connection handling

#### 9. Background Jobs
- **Email Queue**: Transactional emails
- **Notification Queue**: Push, SMS, in-app
- **Report Queue**: Scheduled reports
- **Stock Alert Queue**: Low stock monitoring
- **Cleanup Queue**: Token cleanup, log rotation

#### 10. Audit & Security
- **Audit Logs**: Every action tracked
- **IP Tracking**: Geolocation, device info
- **Rate Limiting**: Per-endpoint limits
- **Input Sanitization**: XSS, NoSQL injection prevention
- **Helmet**: Security headers

---

## Frontend Architecture

### Folder Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── store.js         # Redux store configuration
│   │   └── api/
│   │       └── apiSlice.js  # RTK Query base API
│   │
│   ├── features/            # Redux slices & API endpoints
│   │   ├── auth/
│   │   │   ├── authSlice.js
│   │   │   └── authApi.js
│   │   ├── ui/
│   │   │   └── uiSlice.js
│   │   ├── notification/
│   │   │   └── notificationSlice.js
│   │   ├── inventory/
│   │   │   └── inventoryApi.js
│   │   ├── finance/
│   │   │   └── financeApi.js
│   │   ├── hr/
│   │   │   └── hrApi.js
│   │   ├── analytics/
│   │   │   └── analyticsApi.js
│   │   └── tenant/
│   │       └── tenantApi.js
│   │
│   ├── components/          # Reusable components
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── CommandPalette.jsx
│   │   │   └── NotificationPanel.jsx
│   │   ├── ui/
│   │   │   ├── StatCard.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Table.jsx
│   │   │   └── Modal.jsx
│   │   └── guards/
│   │       └── ProtectedRoute.jsx
│   │
│   ├── pages/               # Route pages
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   └── MFAPage.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx
│   │   ├── inventory/
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── StockPage.jsx
│   │   │   ├── WarehousesPage.jsx
│   │   │   ├── SuppliersPage.jsx
│   │   │   └── PurchaseOrdersPage.jsx
│   │   ├── finance/
│   │   │   ├── InvoicesPage.jsx
│   │   │   ├── TransactionsPage.jsx
│   │   │   ├── ExpensesPage.jsx
│   │   │   └── FinanceReportsPage.jsx
│   │   ├── hr/
│   │   │   ├── EmployeesPage.jsx
│   │   │   ├── AttendancePage.jsx
│   │   │   ├── LeavePage.jsx
│   │   │   └── PayrollPage.jsx
│   │   ├── analytics/
│   │   │   └── AnalyticsPage.jsx
│   │   ├── settings/
│   │   │   └── SettingsPage.jsx
│   │   ├── notifications/
│   │   │   └── NotificationsPage.jsx
│   │   └── audit/
│   │       └── AuditPage.jsx
│   │
│   ├── layouts/
│   │   ├── DashboardLayout.jsx
│   │   └── AuthLayout.jsx
│   │
│   ├── hooks/
│   │   ├── useSocket.js
│   │   └── usePermission.js
│   │
│   ├── utils/
│   │   ├── cn.js            # Tailwind class merger
│   │   └── formatters.js    # Date, currency, number formatters
│   │
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
│
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

### State Management
- **Redux Toolkit**: Global state management
- **RTK Query**: API calls with caching
- **Slices**: auth, ui, notifications
- **Auto-refresh**: Token refresh on 401

### UI/UX Features
- **Dark/Light Theme**: System preference detection
- **Responsive**: Mobile-first design
- **Animations**: Framer Motion
- **Command Palette**: ⌘K quick navigation
- **Real-time Notifications**: Socket.IO integration
- **Permission-based UI**: Hide/show based on RBAC

---

## Database Design

### Core Collections

#### 1. Tenants
```javascript
{
  name, slug, email, phone, website, industry, size,
  address, branding, subscription, taxInfo, settings,
  status, onboardingCompleted, trialEndsAt, owner,
  usageStats, integrations, metadata
}
```

#### 2. Users
```javascript
{
  tenantId, firstName, lastName, email, password,
  phone, avatar, role, roleType, department, employeeId,
  status, isEmailVerified, mfa, oauth, refreshTokens,
  loginAttempts, lockUntil, lastLogin, devices,
  loginHistory, preferences, customPermissions
}
```

#### 3. Roles
```javascript
{
  tenantId, name, displayName, description, type,
  permissions: [{ module, actions: { create, read, update, delete, ... } }],
  isSystem, isActive, hierarchy
}
```

#### 4. Products
```javascript
{
  tenantId, name, description, sku, barcode, qrCode,
  category, subCategory, brand, unit, type, images,
  price, costPrice, mrp, taxRate, taxType, hsnCode,
  stock, reservedStock, minStockLevel, reorderPoint,
  trackBatch, trackSerial, trackExpiry,
  hasVariants, variants, supplier, status
}
```

#### 5. Stock
```javascript
{
  tenantId, product, warehouse, variant,
  quantity, reservedQuantity, batchNumber,
  serialNumber, expiryDate, manufactureDate,
  location, condition, costPrice
}
```

#### 6. Invoices
```javascript
{
  tenantId, invoiceNumber, type, customer, customerDetails,
  items: [{ product, description, quantity, unitPrice, taxRate, totalAmount }],
  invoiceDate, dueDate, paymentTerms,
  subtotal, taxAmount, cgstAmount, sgstAmount, igstAmount,
  totalAmount, paidAmount, balanceAmount,
  status, paymentStatus, payments, notes, pdfUrl
}
```

#### 7. Employees
```javascript
{
  tenantId, user, employeeId, firstName, lastName, email,
  dateOfBirth, gender, address, emergencyContact,
  department, designation, reportingTo, employmentType,
  joiningDate, status, salary, bankDetails, documents,
  education, experience, skills, leaveBalance
}
```

#### 8. Audit Logs
```javascript
{
  tenantId, user, userEmail, userName, action, module,
  entity, entityId, description, changes: { before, after },
  ip, userAgent, browser, os, device, location,
  status, errorMessage, duration
}
```

### Indexing Strategy
- Compound indexes: `{ tenantId: 1, field: 1 }`
- Text indexes: Product names, descriptions
- Date indexes: For time-based queries
- TTL indexes: Audit logs auto-deletion

---

## API Structure

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
```
POST   /auth/register          # Register new tenant + owner
POST   /auth/login             # Login with email/password
POST   /auth/verify-mfa        # Verify MFA code
POST   /auth/refresh           # Refresh access token
POST   /auth/logout            # Logout
POST   /auth/forgot-password   # Request password reset
POST   /auth/reset-password    # Reset password with token
GET    /auth/me                # Get current user
POST   /auth/mfa/setup         # Setup MFA
POST   /auth/mfa/confirm       # Confirm MFA setup
```

### Inventory Endpoints
```
GET    /inventory/dashboard
GET    /inventory/products
POST   /inventory/products
GET    /inventory/products/:id
PUT    /inventory/products/:id
DELETE /inventory/products/:id
GET    /inventory/stock
POST   /inventory/stock/adjust
POST   /inventory/stock/transfer
GET    /inventory/stock/movements
GET    /inventory/stock/low-stock
GET    /inventory/warehouses
POST   /inventory/warehouses
GET    /inventory/suppliers
POST   /inventory/suppliers
GET    /inventory/purchase-orders
POST   /inventory/purchase-orders
POST   /inventory/purchase-orders/:id/approve
POST   /inventory/purchase-orders/:id/receive
```

### Finance Endpoints
```
GET    /finance/dashboard
GET    /finance/invoices
POST   /finance/invoices
GET    /finance/invoices/:id
PUT    /finance/invoices/:id
DELETE /finance/invoices/:id
POST   /finance/invoices/:id/send
POST   /finance/invoices/:id/payment
GET    /finance/transactions
POST   /finance/transactions
GET    /finance/expenses
POST   /finance/expenses
GET    /finance/reports/profit-loss
GET    /finance/reports/tax
```

### HR Endpoints
```
GET    /hr/dashboard
GET    /hr/employees
POST   /hr/employees
GET    /hr/employees/:id
PUT    /hr/employees/:id
DELETE /hr/employees/:id
GET    /hr/attendance
POST   /hr/attendance/checkin
POST   /hr/attendance/checkout
POST   /hr/attendance/bulk
GET    /hr/attendance/report
GET    /hr/leaves
POST   /hr/leaves
PUT    /hr/leaves/:id/approve
PUT    /hr/leaves/:id/reject
GET    /hr/payroll
POST   /hr/payroll/generate
```

### Analytics Endpoints
```
GET    /analytics/overview
GET    /analytics/revenue
GET    /analytics/inventory
GET    /analytics/hr
GET    /analytics/sales
GET    /analytics/kpi
GET    /analytics/forecast
```

---

## Security Implementation

### 1. Authentication
- JWT with RS256 algorithm
- Access token: 15 minutes
- Refresh token: 7 days
- Token blacklisting in Redis
- MFA support (TOTP, SMS, Email)

### 2. Authorization
- Role-based access control (RBAC)
- Permission matrix per role
- Custom permissions per user
- Middleware guards on routes

### 3. Data Protection
- Password hashing: bcrypt (12 rounds)
- Input sanitization: express-mongo-sanitize
- XSS protection: xss-clean
- SQL injection: Parameterized queries
- CSRF protection: csurf

### 4. Network Security
- Helmet: Security headers
- CORS: Whitelist origins
- Rate limiting: 100 req/15min
- HTTPS only in production

### 5. Audit & Monitoring
- All actions logged
- IP tracking
- Device fingerprinting
- Failed login detection
- Winston logging

---

## Real-time Features

### Socket.IO Implementation

#### Server-side (backend/src/sockets/socket.handler.js)
```javascript
// Authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT and attach user to socket
});

// Connection handling
io.on('connection', (socket) => {
  // Join user-specific room
  socket.join(`user:${socket.userId}`);
  
  // Join tenant room
  socket.join(`tenant:${socket.tenantId}`);
  
  // Subscribe to features
  socket.on('inventory:subscribe', (warehouseId) => {
    socket.join(`inventory:${socket.tenantId}:${warehouseId}`);
  });
});

// Emit events
io.to(`user:${userId}`).emit('notification', data);
io.to(`tenant:${tenantId}`).emit('dashboard:update', data);
```

#### Client-side (frontend/src/hooks/useSocket.js)
```javascript
const socket = io(url, {
  auth: { token: accessToken },
  transports: ['websocket', 'polling'],
});

socket.on('notification', (notification) => {
  dispatch(addNotification(notification));
  toast(notification.title);
});

socket.on('inventory:update', (data) => {
  // Invalidate RTK Query cache
});
```

---

## Deployment Guide

### Docker Compose Setup

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/erp_db?authSource=admin
      REDIS_HOST: redis
    depends_on:
      - mongodb
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend
```

### Production Checklist
- [ ] Set strong JWT secrets
- [ ] Configure SMTP for emails
- [ ] Setup Cloudinary/S3 for file uploads
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Setup monitoring (Prometheus + Grafana)
- [ ] Configure backup strategy
- [ ] Setup CI/CD pipeline
- [ ] Enable rate limiting
- [ ] Configure log rotation

---

## Next Steps

### To Complete the Frontend:
1. Create all page components (Login, Dashboard, Products, etc.)
2. Build reusable UI components (Button, Input, Table, Modal)
3. Implement forms with React Hook Form + Zod
4. Add charts with Recharts
5. Build data tables with @tanstack/react-table
6. Add file upload with react-dropzone
7. Implement PDF generation for invoices
8. Add Excel export functionality

### To Enhance the Backend:
1. Add unit tests with Jest
2. Add integration tests with Supertest
3. Implement API versioning
4. Add GraphQL support (optional)
5. Implement webhook system
6. Add advanced reporting
7. Implement data export/import
8. Add backup/restore functionality

### DevOps Tasks:
1. Create Dockerfile for backend
2. Create Dockerfile for frontend
3. Setup NGINX configuration
4. Create GitHub Actions workflows
5. Setup AWS/Azure deployment
6. Configure monitoring
7. Setup log aggregation
8. Implement health checks

---

## 📞 Support

For questions or issues, refer to:
- API Documentation: `http://localhost:5000/api-docs`
- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`

---

**Built with ❤️ for MSMEs**
