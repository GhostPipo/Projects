# 🚀 Software Development Portfolio & Projects

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-v17%20%2F%20v21-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev/)
[![Express](https://img.shields.io/badge/Express-Backend-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-Scraper-40B5A4?style=flat-square&logo=puppeteer&logoColor=white)](https://pptr.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

Willkommen in meinem Multi-Projekt-Repository! Diese Sammlung enthält Praxisprojekte und Full-Stack-Webanwendungen, die im Rahmen meiner Ausbildung und zur praktischen Softwareentwicklung entstanden sind.

---

## 📂 Enthaltene Projekte

| Projekt | Kurzbeschreibung | Technologie-Stack | Status |
| :--- | :--- | :--- | :--- |
| 🚗 **[verkaufspreisermittler](./verkaufspreisermittler)** | B2B-Preis-Scraper & automatische Bestpreis-Berechnung (30% Rabatt-Garantie) | Node.js, Express, Puppeteer, Angular 17, Tailwind CSS, Docker | Ready ✅ |
| 🐺 **[werwolf](./werwolf)** | Multiplayer Werwolf Backend & Raumverwaltung mit Echtzeit-Spielzuständen | Node.js, Express, MongoDB (Mongoose), REST API, Jest | Ready ✅ |
| 📅 **[wochenplaner](./wochenplaner)** | Interaktiver Wochen- & Aufgabenplaner mit Tagesansichten und Auth-Guard | Angular 21, TypeScript, RxJS, Vitest | Ready ✅ |

---

## 🏗️ Repository-Struktur

Jedes Projekt befindet sich in einem eigenständigen Unterordner mit spezifischen Abhängigkeiten, Konfigurationsdateien und eigenen `README.md`-Dokumentationen:

```text
Projects/
├── README.md                          # Hauptdokumentation (Portfolio-Übersicht)
├── .gitignore                         # Globale Schutzregeln & Secret-Sperren
│
├── 🚗 verkaufspreisermittler/         # Full-Stack B2B Scraper & Kalkulator
│   ├── backend/                       # Node.js + Express + Puppeteer Scraper API
│   ├── frontend/                      # Angular 17 + Tailwind CSS UI
│   ├── docker-compose.yml             # Docker Multi-Container Orchestrierung
│   ├── .env.example                   # Umgebungs-Template
│   └── README.md                      # Projektdokumentation
│
├── 🐺 werwolf/                        # Web-Backend für das Werwolf-Spiel
│   ├── routes/                        # REST API Endpunkte für Spielräume & Spieler
│   ├── models/                        # MongoDB / Mongoose Datenmodelle
│   ├── server.js                      # Server-Einstiegspunkt
│   ├── .env.example                   # Datenbank- & Server-Template
│   └── README.md                      # API-Dokumentation
│
└── 📅 wochenplaner/                   # Angular Single Page App
    ├── src/app/                       # Komponenten, Services & Routing
    ├── package.json                   # Abhängigkeiten & Scripts
    └── README.md                      # Entwicklungsdokumentation
```

---

## 🔎 Projekt-Übersicht im Detail

### 1. 🚗 ATB Autoteile — Verkaufspreisermittler (`./verkaufspreisermittler`)
Ein maßgeschneidertes Full-Stack-System für ein Autoteile-B2B-Unternehmen:
- **Problemstellung:** Manuelles Einloggen in Lieferanten-Portale, Heraussuchen von Teilenummern und Berechnen von Kundenrabatten kostete täglich Stunden.
- **Lösung:** Headless Scraping via Puppeteer, automatisiertes Login- & Session-Handling, Echtzeit-Extraktion des Preises (`.main-price`) und automatische Berechnung des Kundenpreises (`Preis * 0,70`).
- **Tech Stack:** Node.js, Express, Puppeteer, Angular 17, Tailwind CSS, Docker & Docker Compose.

### 2. 🐺 Werwolf Game Backend (`./werwolf`)
Ein REST-basiertes Backend-System für ein digitales Werwolf-Kartenspiel:
- **Funktionsumfang:** Erstellen von Spielräumen, Hinzufügen von Spielern, Zuweisen von Rollen (Seherin, Hexe, Jaeger, Dorfwebohner, Wolf), Phase-Status-Updates.
- **Tech Stack:** Node.js, Express.js, MongoDB (Mongoose), Jest for API Testing.

### 3. 📅 Wochenplaner (`./wochenplaner`)
Eine moderne Angular-Webanwendung zur Wochenstrukturierung:
- **Funktionsumfang:** Verwaltung von Wochentagsaufgaben (Montag–Sonntag), Navigation, Authentifizierungs-Guards und responsive Aufteilung.
- **Tech Stack:** Angular 21, TypeScript, RxJS, CSS, Vitest.

---

## 🛠️ Ausführung & Setup

Um ein einzelnes Projekt lokal zu starten, navigiere in das entsprechende Verzeichnis und folge den dortigen Anweisungen in der jeweiligen `README.md`:

```bash
# Beispiel: Verkaufspreisermittler per Docker Compose starten
cd verkaufspreisermittler
cp .env.example .env
docker-compose up --build

# Beispiel: Werwolf Backend starten
cd werwolf
npm install
npm start

# Beispiel: Wochenplaner starten
cd wochenplaner
npm install
npm start
```

---

## 🔒 Sicherheitshinweise

In allen Projekten werden sensible Informationen (wie Datenbank-Verbindungsdaten oder Portal-Passwörter) über `.env`-Dateien verwaltet. Diese Dateien sind strikt in `.gitignore` eingetragen und werden nicht ins Git-Repository hochgeladen. Öffentliche Vorlagen liegen als `.env.example` vor.

---

## 📧 Kontakt & Bewerbung

* **Entwickler:** Philipp Crista
* **Ziel:** Praktikumssuche / Berufspraktikum im Bereich Softwareentwicklung & Webentwicklung
* **GitHub Repository:** [https://github.com/GhostPipo/Projects](https://github.com/GhostPipo/Projects)
