# 📊 ATB Margenrechner & Angebotsersteller

Ein modernes, webbasiertes Kalkulationswerkzeug und Angebotserstellungssystem für Präzisionsberechnungen von Einkaufspreisen, Verkaufspreisen, Gewinnmargen und automatisierten Kundenrechnungen.

---

## 🛠️ Hauptfunktionen

- **📊 Präzise Margenkalkulation**:
  - Automatische Berechnung von Einkaufspreis (netto/brutto), Gewinnmarge in % und € sowie Verkaufspreis.
  - Dynamische Hinzufügung und Verwaltung von Bauteilen / Positionen.

- **📄 Angebot- & Rechnungsgenerierung**:
  - Automatische Vergabe fortlaufender Kundennummern (`KD-1000+`) und Rechnungsnummern (`RE-YYYY-1000+`).
  - Erstellung druckfertiger Angebote und Rechnungen mit Rabattkalkulation und Steueraufschlüsselung.
  - Client-seitige PDF-Generierung mit automatischer Übertragung und serverseitiger Archivierung.

- **🔒 Authentifizierung & Sicherheit**:
  - Passwortgeschützter Zugang über Admin-Login.
  - Sichere Verwaltung von Geheimnissen über Umgebungsvariablen (`.env`).

- **🗑️ Papierkorb & Datenverwaltung**:
  - Soft-Delete-Mechanismus für Kalkulationsblätter.
  - Automatischer Cleanup-Prozess für veraltete Dokumente (nach 30 Tagen bzw. 7 Tagen im Papierkorb).

- **🚀 Dual-Backend Support**:
  - **PHP Backend (`api.php`)**: Für klassische Webhosting-Umgebungen (z. B. Apache/Nginx + PHP PDO SQLite).
  - **Node.js Express Backend (`server.js`)**: Für dedizierte Server und Phusion Passenger (Plesk Integration).

---

## 📁 Projektstruktur

```
margenrechner/
├── backend/
│   ├── api.php               # PHP API (PDO SQLite, Auth, Invoices, Soft-Delete)
│   ├── server.js             # Node.js Express Server (SQLite3, Phusion Passenger Support)
│   ├── package.json          # Node.js Paketdefinition
│   └── .env.example          # Vorlage für Umgebungsvariablen
├── frontend/
│   ├── index.html            # Dashboard & Kalkulator Benutzeroberfläche
│   ├── style.css             # Modernes Responsive Styling
│   ├── app.js                # Frontend-Logik & Backend-Kommunikation
│   └── logoBase64.js         # Base64-Assets für PDF-Export
├── img/                      # Grafikressourcen (Logos, Vorlagen)
└── masterplans/              # Konzeptionelle Entwicklungsdokumentation (v1 - v5)
```

---

## ⚙️ Installation & Inbetriebnahme

### 1. Umgebungsvariablen konfigurieren
Erstelle im Ordner `backend/` eine `.env`-Datei auf Basis der Vorlage:

```bash
cp backend/.env.example backend/.env
```

Trage in `backend/.env` dein individuelles Admin-Passwort ein:

```env
ADMIN_PASSWORD="dein_sicheres_passwort"
```

---

### 2. Backend starten

#### Option A: PHP Webserver (Standard)
Platziere das Projekt auf einem PHP-fähigen Server. Die `api.php` erstellt die SQLite-Datenbank (`database.sqlite`) und nötige Tabellen automatisch beim ersten Aufruf.

#### Option B: Node.js Express Server
```bash
cd backend
npm install
npm start
```
Der Server läuft anschließend unter `http://localhost:3000`.

---

## 🔒 Datenschutz & Sicherheit
- **Sensible Daten**: Die Datei `backend/.env` sowie die SQLite-Datenbank (`database.sqlite`) und hochgeladene PDFs (`backend/invoices/`) sind in `.gitignore` ausgeschlossen und werden niemals im Git-Repository gespeichert.

---

## 💻 Tech-Stack
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Modern CSS (Flexbox/Grid, Glassmorphism UI)
- **Backend**: PHP 8+ (PDO SQLite) / Node.js Express (`sqlite3`)
- **Datenbank**: SQLite 3
- **Deployment**: Compatible with Apache, Nginx, Plesk & Phusion Passenger
