# Dateierklaerung Werwolf-Projekt

Diese Tabelle erklaert die Aufgabe jeder Datei im Projekt (Stand: aktueller Workspace).

| Datei | Typ | Was sie macht |
|---|---|---|
| .env | Konfiguration | Lokale, geheime Umgebungsvariablen fuer Laufzeit und Datenbank (z. B. Verbindungsdaten, Port). |
| .env.example | Konfiguration (Vorlage) | Beispielwerte fuer Umgebungsvariablen, damit neue Setups schnell gestartet werden koennen. |
| app.js | Backend-Entry (App) | Erstellt und konfiguriert die Express-App, registriert Middleware, statische Dateien und API-Routen. |
| server.js | Backend-Start | Laedt .env, verbindet MongoDB (Mongoose) und startet den HTTP-Server mit Port-Fallback. |
| package.json | Projektmetadaten | Definiert Name/Skripte (start, test) und Abhaengigkeiten (Express, Mongoose, bcrypt, Jest, Supertest). |
| package-lock.json | Lockfile | Fixiert exakte Paketversionen fuer reproduzierbare Installationen mit npm. |
| README.md | Projektdoku | Schnellstart, Architekturhinweise und API-Basisendpunkte fuer das Werwolf-Backend. |
| doku_werwolf_projekt.md | Projektdokumentation | Ausfuehrliche Abschlussdoku zu Architektur, Sicherheit (bcrypt), Tests und Spielsystem. |
| WOlf Logik.txt | Fachlogik-Notiz | Beschreibt Rollenregeln, Spielablauf und Siegbedingungen in natuerlicher Sprache. |
| index.html | Frontend-Struktur | Enthaelt Login/Lobby/Spiel-Screens, Modals und HTML-Templates fuer dynamisches Rendering. |
| css/style1.css | Frontend-Styles | Visuelles Design inkl. Night/Day/Hunter-Revenge-Themes, Komponenten-Styles und Responsive-Regeln. |
| js/script.js | Frontend-Logik | Steuert Auth-Flow, API-Aufrufe, Polling, UI-Updates und alle rollenbasierten Spieleraktionen. |
| models/Game.js | Datenmodell | Mongoose-Schema fuer Spiele, Spieler-Subdokumente, Phasen, Timer, Gewinner und Spezialzustand (Hunter-Revenge). |
| models/User.js | Datenmodell | Mongoose-Schema fuer Benutzerkonten (username, gehashtes password). |
| routes/gameRoutes.js | API-Routen (Spiel) | REST- und Aktionsendpunkte fuer Lobby, Join, Spielstart, Phasenwechsel, Votes und Rollenaktionen. |
| routes/authRoutes.js | API-Routen (Auth) | Endpunkte fuer Registrierung und Login mit bcrypt-Hashing/Passwortpruefung. |
| tests/api.test.js | Testdatei | Jest/Supertest Proof-of-Concept-Test fuer Login-Fehlerfall (ungueltiges Passwort). |
| masterplans/v1_1.md | Planungsdoku | Frueher Migrationsplan: Architekturtrennung, MongoDB-Umstieg, REST- und Frontend-Template-Ziele. |
| masterplans/v1_2.md | Planungsdoku | Fortschrittsplan mit Fokus auf laufende API-CRUD-Implementierung. |
| masterplans/v1_3.md | Planungsdoku | Bugfix-Plan fuer Frontend/Backend-Endpunkt-Mismatch und weitere Template-Schritte. |
| masterplans/v1_4.md | Planungsdoku | Plan fuer Migration restlicher In-Game-Aktionen auf die neuen REST-Mechanismen. |
| masterplans/v1_5.md | Planungsdoku | Planphase fuer Umstellung auf native HTML-Templates im Frontend. |
| masterplans/v1_6.md | Planungsdoku | Planphase fuer Custom-Timer und serverseitigen Phase-Countdown. |
| masterplans/v1_7.md | Planungsdoku | Planphase fuer Authentifizierung (bcrypt, User-Modell) und Test-Setup. |
| masterplans/v1_8.md | Planungsdoku | Planphase fuer Jaeger-Logik, Logout, Design-Ueberarbeitung und Mobile-Optimierung. |
| masterplans/v1_9.md | Planungsdoku | Finalplan fuer reine Dokumentationsphase ohne weitere Codeaenderungen. |
| database/img/armor.png | Asset (Bild) | Rollenbild fuer die Rolle Armor (Cupid/Verkuppler). |
| database/img/dorfbewohner.png | Asset (Bild) | Rollenbild fuer Dorfbewohner. |
| database/img/hexe.png | Asset (Bild) | Rollenbild fuer Hexe. |
| database/img/jaeger.png | Asset (Bild) | Rollenbild fuer Jaeger. |
| database/img/seherin.png | Asset (Bild) | Rollenbild fuer Seherin. |
| database/img/wolf.png | Asset (Bild) | Rollenbild fuer Werwolf. |

Hinweis:
- Die Datei .env ist absichtlich nur als Zweck beschrieben (keine Geheimnisse dokumentiert).
- Abhaengigkeiten in node_modules sind installierte Fremdpakete und keine projektspezifisch gepflegten Quelldateien.
