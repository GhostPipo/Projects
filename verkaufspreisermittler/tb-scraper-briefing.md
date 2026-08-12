# Project Briefing: ATB Autoteile Price Scraper & Calculator

## 1. Project Overview & Business Value
This project is a custom web application built for an auto parts dealer ("ATB Autoteile"). The client currently performs a manual, time-consuming process: logging into a competitor/partner B2B portal (Birner360), searching for specific car parts via manufacturer numbers or IDs, checking the price, and manually calculating a 30% discount to offer a "best price" guarantee to their own customers. 

This application automates that exact workflow. It saves the client hours of manual labor, eliminates calculation errors, and provides instant pricing.

## 2. Technical Architecture
The application follows a decoupled Full-Stack architecture:
*   **Backend:** Node.js with Express.
*   **Scraping Engine:** Puppeteer (running in headless mode).
*   **Frontend:** Angular (TypeScript) or similar modern component-based framework.
*   **Infrastructure:** Docker & Docker Compose (prepared for a VPS deployment via Hosttech).

## 3. Core Logic & Scraping Requirements
The target website is a Next.js/React application requiring a login. 
*   **Authentication & Session Management:** The backend must handle automated login using provided credentials. It MUST store and reuse session cookies to prevent logging in on every request.
*   **Search & Extraction:** The frontend sends a product ID (Birner ID or Herstellernummer). The backend navigates to the corresponding product page or search result.
*   **Target CSS Selector:** The price is rendered client-side. Puppeteer must wait for the DOM element with the class `.main-price` (e.g., `<div class="main-price text-2xl font-bold flex">2,66 €</div>`).
*   **Data Cleaning & Calculation:** Extract the text, remove the currency symbol (€), replace the decimal comma with a dot, parse it to a float, and calculate the final customer price (`extracted_price * 0.70`).

## 4. UI/UX & Design Guidelines
*   **Theme:** Dark mode is the primary default. Light mode is supported as a toggle.
*   **Style:** Minimalist, clean, and highly organized. 
*   **Color Palette:** Base colors should be dark (charcoals/blacks). Accent colors: Green, Red, and Purple (used strategically for buttons, highlights, or status indicators).
*   **Responsiveness:** Laptop-first design, but fully functional and responsive on mobile devices.
*   **Feedback:** Must include a clear loading state (spinner/skeleton) since scraping takes a few seconds.