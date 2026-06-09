# Cafe POS System

A full-stack Point of Sale system for small cafés and restaurants. Built with **React**, **Node.js/Express**, and **MySQL**.

## Features

- **Authentication** — Login & registration with role-based access (Cashier / Manager)
- **Order Management** — Walk-in, table, and takeaway orders with item editing
- **Menu Management** — Categories, pricing, availability (in/out of stock)
- **Table Management** — Status tracking, transfer, merge orders
- **Kitchen Display** — Order status flow (New → Preparing → Ready → Served)
- **Payments** — Cash, card, QR, e-wallet; split bill & partial payments
- **Receipts** — Printable receipts with order details
- **Dashboard** — Today's sales, popular items, AI insights
- **AI Recommendations** — Rule-based upsell suggestions based on cart items

## Prerequisites

- **Node.js** 18+
- **MySQL** 8+ (running locally)

## Quick Start

### 1. Configure Database

Edit `backend/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cafe_pos_system
```

### 2. Install & Initialize

```bash
# Backend
cd backend
npm install
npm run init-db

# Frontend (new terminal)
cd frontend
npm install
```

### 3. Run

```bash
# Terminal 1 — API server
cd backend
npm start

# Terminal 2 — React app
cd frontend
npm run dev
```

Open **http://localhost:5173**

## Demo Accounts

| Role    | Email              | Password     |
|---------|--------------------|--------------|
| Manager | manager@cafe.com   | password123  |
| Cashier | cashier@cafe.com   | password123  |

## Project Structure

```
cafe-pos-system/
├── backend/
│   ├── db/           # Schema & connection
│   ├── routes/       # API endpoints
│   ├── middleware/   # Auth middleware
│   ├── utils/        # Tax calc, AI recommendations
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/    # POS, Kitchen, Tables, etc.
│       ├── components/
│       └── api.js
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/menu | List menu items |
| POST | /api/menu | Create item (manager) |
| GET | /api/tables | List tables |
| POST | /api/orders | Create order |
| POST | /api/orders/:id/items | Add item to order |
| PATCH | /api/orders/:id/status | Update order status |
| POST | /api/payments | Process payment |
| GET | /api/dashboard/summary | Dashboard metrics (manager) |

## Tech Stack

- **Frontend:** React 18, Vite, React Router
- **Backend:** Express.js, JWT auth, bcrypt
- **Database:** MySQL
