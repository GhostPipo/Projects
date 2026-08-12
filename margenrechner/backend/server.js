const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Frontend statisch ausliefern (damit Server und Frontend über denselben Port laufen)
app.use(express.static(path.join(__dirname, '../frontend')));

// Datenbank Setup (SQLite)
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('Mit der SQLite-Datenbank verbunden.');
        
        // Tabelle initialisieren (falls noch nicht vorhanden)
        // Wir speichern die 'parts' der Einfachheit halber als JSON-String im Feld 'data'
        db.run(`
            CREATE TABLE IF NOT EXISTS sheets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                data TEXT DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
});
// --- AUTO-CLEANUP (30 Tage) ---
// Löscht automatisch Sheets, die älter als 30 Tage sind
function cleanupOldSheets() {
    const query = "DELETE FROM sheets WHERE created_at <= datetime('now', '-30 days')";
    db.run(query, function(err) {
        if (err) {
            console.error('Fehler beim Auto-Cleanup:', err.message);
        } else if (this.changes > 0) {
            console.log(`🧹 Auto-Cleanup ausgeführt: ${this.changes} alte(s) Sheet(s) gelöscht.`);
        }
    });
}

// Cleanup beim Serverstart einmal ausführen
cleanupOldSheets();
// Und danach alle 24 Stunden (24 * 60 * 60 * 1000 ms)
setInterval(cleanupOldSheets, 24 * 60 * 60 * 1000);

// --- API ROUTEN ---

// 1. READ: Alle Sheets abrufen
app.get('/api/sheets', (req, res) => {
    // Sortieren, damit die neuesten Sheets zuerst kommen
    db.all('SELECT * FROM sheets ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Den 'data'-String wieder zu einem JSON-Array parsen, bevor es an den Client geht
        const sheets = rows.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));
        res.json(sheets);
    });
});

// 2. CREATE: Neues Sheet anlegen
app.post('/api/sheets', (req, res) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ error: 'Name ist erforderlich' });
        return;
    }
    
    db.run('INSERT INTO sheets (name, data) VALUES (?, ?)', [name, '[]'], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Rückgabe des erstellten Sheets
        res.json({
            id: this.lastID,
            name: name,
            data: [],
            created_at: new Date().toISOString()
        });
    });
});

// 3. UPDATE: Sheet aktualisieren (Teile hinzufügen oder löschen)
app.put('/api/sheets/:id', (req, res) => {
    const { data } = req.body;
    const id = req.params.id;
    
    // Data wird als JSON-String in die DB geschrieben
    db.run('UPDATE sheets SET data = ? WHERE id = ?', [JSON.stringify(data), id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Sheet erfolgreich aktualisiert', changes: this.changes });
    });
});

// 4. DELETE: Sheet löschen
app.delete('/api/sheets/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM sheets WHERE id = ?', id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Sheet gelöscht', changes: this.changes });
    });
});

// --- SERVER STARTEN ---
// WICHTIG für Plesk / Phusion Passenger: 
// Passenger gibt den Port oft über process.env.PORT vor oder lauscht auf einen Unix-Socket namens 'passenger'.
if (typeof(PhusionPassenger) !== 'undefined') {
    // Passenger Umgebung erkannt
    app.listen('passenger');
    console.log('Server läuft in einer Phusion Passenger (Plesk) Umgebung.');
} else {
    // Lokale Umgebung oder Standard Node.js
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server läuft erfolgreich auf Port ${PORT}`);
    });
}
