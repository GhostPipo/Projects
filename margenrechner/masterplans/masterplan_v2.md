# Masterplan v2: Kunden-Export & Soft-Delete

## Projektübersicht
Erweiterung des bestehenden PHP/SQLite Margen-Rechners um eine professionelle Export-Funktion für Kunden (Fokus auf WhatsApp) und Anpassung der Lösch-Logik (Soft-Delete). Die bestehende Berechnungslogik und der Login-Schutz bleiben unberührt.

## Kern-Features (Neu)
1. **Status & Rabatt:** 
   * Checkbox "Kunde fertig bearbeitet".
   * Eingabefeld für "Rabatt in %" (wird erst sichtbar/aktiv, wenn Checkbox aktiv ist).
   * Button "Kunden-Zusammenfassung generieren".
2. **Kunden-Zusammenfassung (Modal):**
   * Sauberes Popup, das nur die UVP-Preise (Verkaufspreise) anzeigt. EV bleibt streng geheim.
   * **Rabatt-Visualisierung:** Original-UVP in Rot durchgestrichen, neuer Preis in Grün + Anzeige der Rabatt-Prozente.
3. **WhatsApp-Export:**
   * Ein Button im Modal: "Für WhatsApp kopieren".
   * Generiert einen strukturierten Text mit WhatsApp-Markdown (z.B. `~Originalpreis~`, `*Neuer Preis*`).
4. **Soft-Delete Logik (Datenbank):**
   * Manuelles Löschen blendet das Sheet im UI aus, behält es aber 7 Tage in der Datenbank (`deleted_at` Timestamp).
   * Auto-Cleanup löscht Sheets nach 30 Tagen (ab Erstellung) ODER nach 7 Tagen (ab manuellem Löschen).

## Phasen & Workflow
* **Phase 1: Datenbank-Upgrade & Backend-Logik**
  * Hinzufügen der `deleted_at` Spalte in SQLite.
  * Anpassen der `api.php`: GET-Route filtert gelöschte Sheets heraus. DELETE-Route setzt nur den `deleted_at` Stempel. Cleanup-Routine anpassen.
* **Phase 2: Frontend UI-Erweiterungen**
  * Einbau der Checkbox, des Rabatt-Feldes und des Zusammenfassungs-Buttons in die `index.html`.
  * *Stopp für User-Feedback.*
* **Phase 3: Modal & WhatsApp Export**
  * Erstellung des Zusammenfassungs-Modals (HTML/CSS) mit der Rot/Grün-Logik für Rabatte.
  * Implementierung der "Copy to Clipboard"-Funktion mit speziellem WhatsApp-Markdown.
  * *Stopp für finale Abnahme.*