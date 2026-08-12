# Masterplan v1: Autoteile Margen-Rechner

## Projektübersicht
Entwicklung einer simplen, ressourcenschonenden Web-Applikation zur Berechnung von Einkaufspreisen (EV) und Verkaufspreisen (UVP) für Autoteile. Die App dient als digitales Notizblatt/Rechner, das in "Sheets" (pro Kunde) organisiert ist und nebenbei im Browser geöffnet bleibt.

## Tech-Stack
* **Frontend:** Vanilla HTML, CSS, JavaScript (Kein Framework, simpler Aufbau)
* **Backend:** Node.js, Express (API für Sheets)
* **Datenbank:** MongoDB (oder SQLite, je nach Agenten-Empfehlung) für das Speichern der Kunden-Sheets.

## Kern-Features
* **Split-Screen Optimierung:** Die UI muss schmal und kompakt gut bedienbar sein.
* **Eingabemaske:** Felder für "Teile-Name/Nummer" (optional), "EV" und "UVP".
* **Berechnungslogik:** Summierung von Gesamt-EV und Gesamt-UVP. Automatische Berechnung der exakten Gewinnmarge (UVP-Summe minus EV-Summe) in Währung und %.
* **Sheet-Management:** Erstellen, Umbenennen (nach Kundenname), Öffnen und manuelles Löschen von Sheets.
* **Auto-Cleanup:** Ein Cronjob oder Datenbank-Trigger, der Sheets automatisch 30 Tage nach Erstellung löscht.

## Phasen & Workflow

* **Phase 1: Setup & Analyse**
    * Überprüfung der Anforderungen.
    * Aufsetzen der grundlegenden Ordnerstruktur (Frontend / Backend).
* **Phase 2: Das Grundgerüst (Skelett)**
    * Erstellung des UI-Layouts (HTML/CSS) für den Rechner und die Sheet-Übersicht.
    * Implementierung der grundlegenden Berechnungslogik in Vanilla JS im Frontend.
    * *Stopp für User-Feedback (Runde 1).*
* **Phase 3: Backend & Datenbank-Anbindung**
    * Implementierung der Änderungswünsche aus Runde 1.
    * Aufsetzen des Node.js Servers und der Datenbank.
    * Routen für CRUD-Operationen der Sheets (Create, Read, Update, Delete).
    * *Stopp für User-Feedback (Runde 2).*
* **Phase 4: Auto-Cleanup & Feinschliff**
    * Implementierung der Änderungswünsche aus Runde 2.
    * Einrichtung der Logik zum automatischen Löschen von Sheets nach 30 Tagen.
    * Finales UI/UX Polishing.
* **Phase 5: Testing & Abschluss**
    * Schreiben von Tests für die Datenbank-Operationen (Sicherstellen, dass Speichern, manuelles Löschen und Auto-Delete reibungslos funktionieren).
    * Code-Cleanup und finale Übergabe.