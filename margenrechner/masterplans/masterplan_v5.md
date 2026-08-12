# Masterplan v5: Datenbank-Persistenz & Rechnungs-Archivierung

## Projektstatus
* Frontend (PDF-Generierung via jsPDF, WhatsApp-Export) läuft perfekt. 
* DAS VISUELLE LAYOUT DES PDFS (Koordinaten) IST FINAL UND DARF NICHT GEÄNDERT WERDEN.
* Aktuelles Problem: Rechnungsnummern und Kundennummern werden blind im Frontend via JS generiert. Rechnungen werden nicht im Backend gespeichert.

## Zielsetzung (V5)
Die SQLite-Datenbank muss den gesamten Workflow abbilden. Sheets erhalten feste Kundennummern. Rechnungen werden in einer eigenen Tabelle gespeichert, um fortlaufende, garantiert einmalige Rechnungsnummern zu erzeugen.

## Datenbank-Architektur (SQLite)
1. **Tabelle `sheets` (Update):**
   * Hinzufügen der Spalte `customer_number` (VARCHAR).
   * Logik bei Sheet-Erstellung: Prüfen, ob der Sheet-Name (Kunde) bereits existiert. Wenn ja, existierende `customer_number` übernehmen. Wenn nein, neue fortlaufende Nummer generieren (z.B. KD-1000).
2. **Neue Tabelle `invoices` (Create):**
   * `id` (PK, Auto-Increment)
   * `sheet_id` (FK zu sheets)
   * `invoice_number` (VARCHAR, UNIQUE) -> Fortlaufend generiert durch PHP (z.B. RE-[JAHR]-1000).
   * `customer_name`, `street`, `zip_city`, `uid` (Aus dem Rechnungsformular)
   * `discount_percent`
   * `total_net`, `total_tax`, `total_gross`
   * `created_at` (Timestamp)

## Phasen & Workflow
* **Phase 1: Backend (api.php) & DB-Migration**
  * SQL-Migration schreiben, um `sheets` zu updaten und `invoices` zu erstellen. Ohne Datenverlust!
  * POST-Route für Sheet-Erstellung anpassen (Kundennummer-Logik).
  * Neue POST-Route `/api.php?action=save_invoice` erstellen.
* **Phase 2: Frontend-Anbindung (app.js)**
  * Wenn das Rechnungs-Formular abgesendet wird, wird ZUERST ein fetch-Request an `save_invoice` gesendet.
  * Das Backend antwortet mit der offiziell generierten `invoice_number` und `customer_number`.
  * ERST DANN wird die finale `generatePDF()` Funktion mit diesen echten Server-Daten aufgerufen.