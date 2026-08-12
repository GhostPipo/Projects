# 📅 Wochenplaner

Eine moderne, responsive Web-Anwendung zur interaktiven Wochen- und Aufgabenplanung, entwickelt mit **Angular 21** und **TypeScript**.

![Angular](https://img.shields.io/badge/Angular-21.0.0-DD0031?style=for-the-badge&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)
![RxJS](https://img.shields.io/badge/RxJS-7.8-B7178C?style=for-the-badge&logo=reactivex)
![Vitest](https://img.shields.io/badge/Vitest-4.0-6E9F18?style=for-the-badge&logo=vitest)

---

## 🌟 Highlights & Features

- 📆 **Wochenübersicht (Plan)**: Übersichtliche Ansicht aller 7 Wochentage (Montag bis Sonntag) zur strukturierten Wochenplanung.
- ✅ **Aufgabenverwaltung (Tasks)**:
  - **Erstellung**: Neue Tasks mit Details wie Titel, Beschreibung, Wochentag und Priorität anlegen.
  - **Statusverwaltung**: Aufgaben als erledigt/offen markieren und bei Bedarf löschen.
- 🔐 **Benutzer-Authentifizierung & Schutz (Auth Guard)**:
  - Inhaberbezogene Anmeldung (Login / Logout).
  - Routenschutz mit Angular `AuthGuard` (Zugriff auf Wochenplan & Tasks nur für angemeldete Benutzer).
- 💾 **Persistenz (LocalStorage)**:
  - Automatische Speicherung aller Aufgaben im Browser-Speicher pro Benutzerkonto.
- 🎨 **Modernes UI/UX**:
  - Clean Design, intuitive Navigation und responsive Benutzeroberfläche.

---

## 🏗️ Technologiestack

| Technologie | Beschreibung |
| :--- | :--- |
| **Angular 21** | Standalone Components, Modern Control Flow, Modern Routing |
| **TypeScript 5.9** | Typensichere Anwendungsarchitektur |
| **RxJS** | Reaktive Datenverarbeitung & State Management |
| **Vitest / Angular Testing** | Unit-Tests für hohe Codequalität |
| **CSS3 & HTML5** | Custom Styling & Responsive Layout |

---

## 📁 Projektstruktur

```text
wochenplaner/
├── src/
│   ├── app/
│   │   ├── guards/          # AuthGuard für geschützte Routen
│   │   ├── login/           # Login-Komponente
│   │   ├── model/           # Datenmodelle (Task Model)
│   │   ├── nav/             # Hauptnavigation (Header bar)
│   │   ├── plan/            # Wochenplan-Komponenten (Mo-So)
│   │   ├── services/        # Services (AuthService, TaskService)
│   │   ├── task/            # Aufgabenkomponenten (CreateTask, CurrentTask)
│   │   ├── app.config.ts    # Anwendungskonfiguration & Routing Providers
│   │   ├── app.routes.ts    # Anwendungs-Routen
│   │   └── app.ts           # Root-Komponente
│   ├── assets/              # Statische Ressourcen
│   ├── index.html           # HTML-Einstiegspunkt
│   ├── main.ts              # App Bootstrapping
│   └── styles.css           # Globale CSS-Styles
├── angular.json             # Angular CLI Konfiguration
├── package.json             # Abhängigkeiten & Skripte
└── tsconfig.json            # TypeScript Konfiguration
```

---

## 🚀 Erste Schritte (Getting Started)

### Voraussetzungen

Stelle sicher, dass **Node.js** (v18+) und **npm** auf deinem System installiert sind.

### Installation

1. Repository klonen:
   ```bash
   git clone https://github.com/DEIN_BENUTZERNAME/wochenplaner.git
   cd wochenplaner
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

---

## ⚙️ Verfügbare Skripte

| Befehl | Beschreibung |
| :--- | :--- |
| `npm start` / `ng serve` | Startet den Lokalen Entwicklungsserver unter `http://localhost:4200/` |
| `npm run build` / `ng build` | Erstellt das optimierte Production Bundle im `dist/` Ordner |
| `npm test` / `npx vitest run` | Führt alle Unit-Tests aus |
| `npm run watch` | Kontinuierlicher Build im Entwicklungsmodus |

---

## 📄 Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).
