# Masterplan v4: EPC QR-Code Integration (GiroCode)

## Projektstatus
* Das PHP/SQLite Backend läuft stabil (Soft-Delete & WhatsApp-Export integriert).
* V3 (PDF-Rechnungen via jsPDF) ist abgeschlossen. Die Koordinaten für das Layout von Seite 1 wurden manuell perfektioniert und DÜRFEN NICHT MEHR GEÄNDERT WERDEN.

## Zielsetzung (V4)
Erweiterung der PDF-Generierung um eine zweite Seite, die einen EPC-QR-Code (GiroCode) für die blitzschnelle SEPA-Überweisung per Banking-App enthält.

## Tech-Stack (Erweiterung)
* **Neue Library:** `qrious` (via CDN) zur clientseitigen Generierung des QR-Codes als Base64-Grafik, welche dann in jsPDF eingefügt wird.

## Kern-Features & Spezifikationen
1. **Neue PDF-Seite:** Nach der Fertigstellung von Seite 1 wird mit `doc.addPage()` eine zweite Seite angehängt, um Layout-Konflikte zu vermeiden.
2. **Der EPC-String:** Der QR-Code muss zwingend dem EPC-Standard entsprechen.
   * Empfänger: Mihai Oprea
   * IBAN: AT112060403103912238 (Ohne Leerzeichen)
   * BIC: SPFKAT2BXXX
   * Betrag: Dynamischer Brutto-Endbetrag (Format: `EUR123.45` - Punkt statt Komma!)
   * Verwendungszweck: Dynamische Rechnungsnummer
3. **Layout der Seite 2:**
   * Große, klare Überschrift: "Bequem per Banking-App bezahlen"
   * Kurze Anleitung (1. App öffnen, 2. Scannen, 3. Freigeben).
   * Der QR-Code mittig zentriert.
   * Darunter die Zahlungsdaten noch einmal in Textform zur Kontrolle.