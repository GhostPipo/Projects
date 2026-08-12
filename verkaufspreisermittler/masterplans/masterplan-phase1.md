# Masterplan Phase 1: Core Foundation & Proof of Concept

**Goal:** Build a functional, deployable skeleton. Do not over-engineer the UI yet. Focus on a stable scraping process and API communication.

## Step 1: Project Initialization & Docker Setup
*   Set up a monorepo or two separate folders (`frontend` and `backend`).
*   Create a `docker-compose.yml` that spins up the Node.js backend and the Frontend development server. Ensure the Node.js container includes the necessary dependencies to run Puppeteer (Chromium libraries).

## Step 2: Backend - Authentication & Scraper Logic
*   Create an Express server.
*   Implement a Puppeteer service class.
*   Create a method to handle the initial login to the portal and save the session/cookies. (Use environment variables for credentials).
*   Create the core scraping method: Accept an ID, use the saved session, navigate to the target, wait for `.main-price`, extract the text, clean the string to a float, and multiply by 0.7.

## Step 3: API Endpoint
*   Create a `POST /api/calculate-price` endpoint.
*   It should accept `{ "productId": "12345" }`.
*   It should return a JSON response: `{ "success": true, "originalPrice": 2.66, "calculatedPrice": 1.86 }` or handle errors gracefully (e.g., "Product not found").

## Step 4: Frontend - Minimal Viable UI
*   Implement a basic layout with the primary Dark Mode requested in the briefing.
*   Create a simple input field for the Product ID and a "Calculate" button (using the specified accent colors).
*   Implement an HTTP call to the Node.js backend.
*   Show a visible loading state while the request is pending.
*   Display the returned original price and the newly calculated customer price.