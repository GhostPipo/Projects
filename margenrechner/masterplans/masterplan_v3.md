# Masterplan v3: PDF-Rechnungsgenerator

## Projektübersicht
Erweiterung der bestehenden Margen-Rechner-App um einen nativen PDF-Generator. Wenn ein Kunde "fertig bearbeitet" ist, können die gesammelten Autoteile zusammen mit Kundendaten in eine formatierte PDF-Rechnung (gemäß ATB-Vorlage) umgewandelt werden.

## Tech-Stack (Erweiterung)
* **Frontend-Library:** `jsPDF` und `jspdf-autotable` (eingebunden via CDN).
* **Vorteil:** Die gesamte PDF-Erstellung passiert im Browser. Das PHP-Backend bleibt unangetastet.

## Kern-Features
1. **Rechnungs-Button:** Neuer Button "Rechnung erstellen" neben dem WhatsApp-Button im Modal.
2. **Kunden-Formular (UI):** Ein neues Modal/Formular, das sich öffnet und die fehlenden Meta-Daten abfragt:
   * Firmenname / Kundenname
   * Adresse (Straße, PLZ, Ort)
   * Kunden-UID (optional)
   * Rechnungsnummer (mit Auto-Vorschlag)
   * Betreff & Leistungszeitraum
3. **PDF-Generierung:** * Übernahme des statischen ATB-Briefkopfs (Logo-Platzhalter, Absender-Zeile, Bankdaten im Footer).
   * Generierung der Positions-Tabelle (Autoteile) mit Netto-Berechnung (UVP / 1.2) und 20% USt-Ausweis.
   * Direkter Download der `.pdf` Datei.

## Phasen & Workflow
* **Phase 1: UI & Formular-Setup**
  * Einbau des Buttons und des Rechnungs-Formular-Modals in die `index.html`.
  * *Stopp für User-Feedback.*
* **Phase 2: PDF-Logik & Layout**
  * Einbinden der `jsPDF` CDNs in die `index.html`.
  * Schreiben der Render-Logik in JS, um den Text, die statischen ATB-Daten und die dynamische Tabelle exakt nach Vorlage auf dem A4-Dokument zu positionieren.
  * *Stopp für finales Testing des PDF-Layouts.*