# 🚗 ATB Autoteile - Selling Price Calculator & Scraper

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.19-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-v22.7-40B5A4?style=flat-square&logo=puppeteer&logoColor=white)](https://pptr.dev/)
[![Angular](https://img.shields.io/badge/Angular-v17.3-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

An automated full-stack application built for **ATB Autoteile** to streamline and automate car parts pricing. The tool logs into partner B2B portals, extracts original part prices in real-time using headless web scraping, and automatically calculates discounted customer pricing with a 30% price guarantee (`extracted_price * 0.70`).

---

## 🌟 Key Features

- **Automated Web Scraping:** Uses headless Puppeteer to navigate Next.js/React B2B partner portals and extract dynamic element prices (`.main-price`).
- **Session & Cookie Persistence:** Saves and reuses portal authentication sessions across requests to minimize login overhead and maximize speed.
- **Instant Price Calculation:** Automates data extraction, string cleaning (currency parsing), and calculates customer-specific discount prices automatically.
- **Modern Angular Frontend:** Clean, dark-mode focused single-page application built with Angular 17 and Tailwind CSS.
- **Containerized Deployment:** Dockerized backend and frontend setup with `docker-compose` for simple deployment on any VPS host.

---

## 🛠️ Architecture & Tech Stack

```
                     +---------------------------------------+
                     |         Angular 17 Frontend           |
                     |       (Tailwind CSS Dark Mode)        |
                     +-------------------+-------------------+
                                         | HTTP POST /api/calculate-price
                                         v
                     +-------------------+-------------------+
                     |         Node.js / Express API         |
                     +-------------------+-------------------+
                                         | Puppeteer Headless Browser
                                         v
                     +-------------------+-------------------+
                     |          B2B Portal (Birner)          |
                     +---------------------------------------+
```

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | Angular 17, Tailwind CSS, TypeScript | Modern responsive UI with live loading feedback and dark mode design. |
| **Backend API** | Node.js, Express, CORS | RESTful API handling price calculation requests. |
| **Scraper** | Puppeteer | Headless browser for session management, login automation, and DOM price extraction. |
| **Infrastructure** | Docker, Docker Compose | Multi-container setup with all Chromium dependencies included. |

---

## 📁 Repository Structure

```
verkaufspreisermittler/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express API server entry point
│   │   └── scraper.js            # Puppeteer scraper & login session manager
│   ├── Dockerfile                # Node + Chromium Docker container configuration
│   └── package.json              # Backend dependencies & scripts
├── frontend/
│   ├── src/                      # Angular components & application assets
│   ├── angular.json              # Angular CLI project configuration
│   ├── Dockerfile                # Frontend development Docker container
│   ├── tailwind.config.js        # Tailwind CSS design system settings
│   └── package.json              # Frontend dependencies
├── masterplans/
│   └── masterplan-phase1.md      # Development roadmap & phase specification
├── docker-compose.yml            # Multi-service container orchestration
├── tb-scraper-briefing.md        # Technical project briefing document
├── .env.example                  # Environment variables template
└── README.md                     # Project documentation
```

---

## 🚀 Quick Start & Installation

### Option 1: Running with Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GhostPipo/Projects.git
   cd Projects
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your portal credentials:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   PORT=3000
   PORTAL_USER=your_portal_username
   PORTAL_PASS=your_portal_password
   ```

3. **Start the containers:**
   ```bash
   docker-compose up --build
   ```

   - **Frontend:** `http://localhost:4200`
   - **Backend API:** `http://localhost:3000`

---

### Option 2: Local Development Setup

#### Backend Setup

```bash
cd backend
npm install
cp ../.env.example ../.env   # Ensure root .env has valid credentials
npm run dev
```

The backend API runs at `http://localhost:3000`.

#### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The Angular dev server runs at `http://localhost:4200`.

---

## 📡 API Reference

### Calculate Customer Price

**Endpoint:** `POST /api/calculate-price`

**Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "productId": "123456"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "productId": "123456",
  "originalPrice": 2.66,
  "calculatedPrice": 1.86,
  "currency": "EUR"
}
```

#### Error Response (`500 Internal Server Error`)
```json
{
  "success": false,
  "error": "Product price element not found or invalid credentials."
}
```

---

## 🛡️ Security Note

Environment configuration files containing credentials (`.env`) are excluded from source control. Always use `.env.example` as a template for new deployments.

---

## 📄 License

Distributed under the [MIT License](LICENSE).
