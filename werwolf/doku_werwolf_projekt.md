# Werwolf-Spiel: Vollständige Projektdokumentation

## 1. Projektübersicht

**Projektname**: Werwolf (Werewolf / Mafia-Spiel)  
**Typ**: Full-Stack Web-Anwendung  
**Zeitrahmen**: 8 Entwicklungsphasen  
**Technologie-Stack**: Node.js, Express, MongoDB, Mongoose, bcrypt, Jest, Supertest, Vanilla HTML5/CSS3/JavaScript

Das Werwolf-Spiel ist ein interaktives Multiplayer-Spiel, das die klassische Mafia-Spielmechanik im Browser umsetzt. Spieler werden zufällig Rollen zugewiesen (Wölfe, Seher, Hexe,Jäger, Dorfbewohner) und müssen versuchen, die gegnerische Fraktion zu eliminieren.

### Erfüllte Anforderungen

✅ **Authentifizierung mit bcrypt**: Passwörter werden mit 10 Salt-Runden gehasht  
✅ **Rollen-basiertes Gameplay**: 9 verschiedene Rollen mit eindeutigen Mechaniken  
✅ **Phasen-System**: Lobby → Nacht → Tag → Hunter-Rache → Gameover  
✅ **Jäger-Rache-Mechanik**: Hunter schießt, wenn eliminiert  
✅ **Responsive Design**: Mobile-optimiert (600px Breakpoint)  
✅ **Automatisierte Tests**: Jest + Supertest mit Mocks  
✅ **Session-Management**: Username-Persistierung via sessionStorage  
✅ **Logout-Funktionalität**: Sichere Session-Beendigung  
✅ **MongoDB Persistierung**: Alle Spieldaten + Benutzer in Datenbank

---

## 2. Technologie & Architektur

### 2.1 Backend-Architektur

```
server.js (Bootstrap)
    ↓
app.js (Express-Setup)
    ├─→ routes/authRoutes.js (POST /register, /login)
    ├─→ routes/gameRoutes.js (POST/GET/PATCH/DELETE /api/games/*)
    ├─ models/User.js (Mongoose Schema)
    └─ models/Game.js (Mongoose Schema mit Hunter-Revenge-Staat)
```

### 2.2 Frontend-Architektur

```
index.html (Templates + Auth-Gate)
    ├─ tpl-player-card (Komponente)
    ├─ tpl-lobby-player (Komponente)
    ├─ tpl-poison-modal (Komponente)
    └─ tpl-death-overlay (Komponente)
    ↓
js/script.js (Spiellogik & API-Integration)
    ├─ updateGameState() (Polling alle 2s)
    ├─ updateGameUI() (Phasen-Rendering)
    ├─ selectPlayer() (Aktions-Handler)
    └─ Rollen-spezifische UI

css/style1.css (3 Themes: night/day/hunter-revenge)
```

### 2.3 Abhängigkeiten

| Paket | Version | Zweck |
|-------|---------|-------|
| `express` | ^4.18.0 | REST API Framework |
| `mongoose` | ^7.0.0 | MongoDB Object Mapper |
| `bcrypt` | ^5.1.0 | Sichere Passwort-Hashing |
| `dotenv` | ^16.0.3 | Umgebungsvariablen |
| `jest` | ^29.5.0 (DEV) | Test-Framework |
| `supertest` | ^6.3.3 (DEV) | HTTP Assertion Library |

---

## 3. Sichere Authentifizierung mit bcrypt

### 3.1 Implementierung: Registrierung

**Datei**: [routes/authRoutes.js](routes/authRoutes.js)

```javascript
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'missing_fields' });
    }

    try {
        // Passwort hashen mit 10 Salt-Runden
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Benutzer in DB speichern
        const user = await User.create({
            username,
            password: hashedPassword
        });

        return res.status(201).json({
            username: user.username,
            message: 'successfully_registered'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'username_taken' });
        }
        return res.status(500).json({ error: 'server_error' });
    }
});
```

### 3.2 Implementierung: Login-Verifizierung

```javascript
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'missing_fields' });
    }

    try {
        // Benutzer in DB suchen
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'invalid_credentials' });
        }

        // Eingegebenes Passwort mit Hash vergleichen
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'invalid_credentials' });
        }

        // Erfolgreicher Login
        return res.status(200).json({
            username: user.username,
            message: 'successfully_logged_in'
        });
    } catch (error) {
        return res.status(500).json({ error: 'server_error' });
    }
});
```

### 3.3 Sicherheit & Best Practices

| Aspekt | Implementierung |
|--------|-----------------|
| **Salt-Runden** | 10 (Empfehlung: 10-12 für Balance Performance/Security) |
| **Hash-Vergleich** | `bcrypt.compare()` (zeitkonstant gegen Timing-Attacken) |
| **Plain-Text-Speicherung** | ❌ Nicht implementiert; nur Hashes |
| **Duplikat-Schutz** | MongoDB unique Index auf `username` |
| **Session-Management** | sessionStorage (ww_username) - nur für Frontend |
| **HTTPS in Produktion** | Empfohlen für Passwort-Übertragung |

---

## 4. Supertest & Automatisierte Tests

### 4.1 Test-Framework Setup

**Datei**: [tests/api.test.js](tests/api.test.js)

Das Projekt nutzt **Jest** (Test-Runner) + **Supertest** (HTTP-Assertion Library) für isolierte API-Tests ohne echte Datenbankzugriffe.

```javascript
// Mocks MÜSSEN vor imports stehen
jest.mock('../models/User');
jest.mock('bcrypt');

const request = require('supertest');
const app = require('../app');
const bcrypt = require('bcrypt');
const User = require('../models/User');

describe('POST /api/auth/login', () => {
    test('should return 401 when password is incorrect', async () => {
        // Setup Mock
        User.findOne.mockResolvedValue({
            username: 'testuser',
            password: 'hashed_password_from_db'
        });
        
        bcrypt.compare.mockResolvedValue(false);  // Passwort stimmt nicht
        
        // Test
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'wrongPassword' });
        
        // Assert
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('invalid_credentials');
    });
});
```

### 4.2 Test-Ausführung

```bash
npm test
```

**Output**:
```
PASS  tests/api.test.js
  POST /api/auth/login
    ✓ should return 401 when password is incorrect (45ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

### 4.3 Mock-Strategie

Supertest verwendet Mocks für:
1. **User-Datenbankabfrage**: `User.findOne()` gibt vordefinierte Objekte zurück
2. **bcrypt-Vergleich**: `bcrypt.compare()` gibt boolean zurück

**Vorteil**: Tests laufen ohne MongoDB-Verbindung, sind schnell und zuverlässig.

---

## 5. Mongoose Datenmodelle

### 5.1 User-Model

**Datei**: [models/User.js](models/User.js)

```javascript
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('User', userSchema);
```

**Speicherort**: MongoDB Collection `users`

### 5.2 Game-Model

**Datei**: [models/Game.js](models/Game.js)

```javascript
// Player-Struktur
const playerSchema = new mongoose.Schema({
    player_id: Number,
    name: String,
    role: {
        type: String,
        enum: ['wolf', 'seer', 'witch', 'armor', 'hunter', 'villager', 'unknown']
    },
    is_alive: { type: Number, default: 1 },
    seer_used: { type: Number, default: 0 },
    armor_used: { type: Number, default: 0 },
    target_id: { type: Number, default: null },
    linked_user_id: { type: Number, default: null },
    potions_left: { type: String, default: '11' }  // '11' = both, '01' = nur Gift
}, { _id: false });

// Spiel-Konfiguration
const settingsSchema = new mongoose.Schema({
    day_timer: { type: Number, default: 60 },
    night_timer: { type: Number, default: 30 },
    with_hunter: { type: Boolean, default: true }
}, { _id: false });

// Spiel-Zustand
const gameSchema = new mongoose.Schema({
    room_code: { type: String, unique: true },
    game_phase: {
        type: String,
        enum: ['lobby', 'night', 'day', 'hunter_revenge', 'gameover']
    },
    night_step: String,  // 'armor', 'seer', 'wolf', 'witch'
    players: [playerSchema],
    settings: settingsSchema,
    winners: String,  // 'wolves' oder 'village'
    
    // Hunter-Rache-Zustand
    hunter_revenge_player_id: { type: Number, default: null },
    hunter_revenge_return_phase: String,  // z.B. 'day'
    hunter_revenge_return_step: String,   // z.B. null oder 'voting'
    
    // Weitere Felder
    phase_ends_at: Date,
    last_night_victim: Number,
    last_night_event: String,
    wolf_count: Number,
    max_players: Number
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Game', gameSchema);
```

---

## 6. REST API Routes & CRUD-Operationen

### 6.1 Routing-Struktur

[app.js](app.js) Auszug:
```javascript
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
```

### 6.2 CRUD-Mapping mit Code-Beispielen

#### **CREATE: Spiel erstellen**

**Endpoint**: `POST /api/games/`

```javascript
// REQUEST
{
    "nightTimer": 30,
    "dayTimer": 60,
    "wolfCount": 2,
    "maxPlayers": 8,
    "withHunter": true
}

// HANDLER (gameRoutes.js)
router.post('/', async (req, res) => {
    const withHunter = parseBoolean(req.body.withHunter ?? req.body.with_hunter, true);
    const roomCode = await createUniqueRoomCode();
    
    const game = await Game.create({
        room_code: roomCode,
        game_phase: 'lobby',
        settings: {
            with_hunter: withHunter,
            day_timer: sanitizedDayTimer,
            night_timer: sanitizedNightTimer
        },
        players: [],
        hunter_revenge_player_id: null,
        hunter_revenge_return_phase: null,
        hunter_revenge_return_step: null
    });
    
    return res.status(201).json({ code: game.room_code, game });
});

// RESPONSE (201)
{
    "code": "ABC123",
    "room_code": "ABC123",
    "settings": {
        "with_hunter": true,
        "day_timer": 60,
        "night_timer": 30
    },
    "game": { ...GameObject }
}
```

#### **READ: Spiel-Zustand abrufen**

**Endpoint**: `GET /api/games/:room_code?myId=5`

```javascript
// HANDLER
router.get('/:room_code', async (req, res) => {
    const roomCode = String(req.params.room_code).toUpperCase();
    const myId = Number(req.query.myId || 0);
    
    const game = await Game.findOne({ room_code: roomCode });
    if (!game) return res.status(404).json({ error: 'room_not_found' });
    
    const me = findPlayer(game, myId);
    
    return res.json({
        game,
        players: game.players,
        me,
        server_time: Date.now(),
        phase_ends_at_unix: game.phase_ends_at ? Math.floor(game.phase_ends_at.getTime() / 1000) : null
    });
});

// RESPONSE (200)
{
    "game": {
        "room_code": "ABC123",
        "game_phase": "night",
        "night_step": "wolf",
        "hunter_revenge_player_id": null,
        "players": [ ...PlayerArray ]
    },
    "me": {
        "player_id": 5,
        "name": "Alice",
        "role": "seer",
        "is_alive": 1
    },
    "server_time": 1700000000000
}
```

#### **UPDATE: Spiel-Einstellungen ändern**

**Endpoint**: `PATCH /api/games/:room_code`

```javascript
// REQUEST
{
    "game_phase": "night",
    "settings": {
        "day_timer": 45,
        "with_hunter": false
    },
    "player_update": {
        "player_id": 5,
        "set": {
            "is_alive": 0,
            "target_id": 3
        }
    }
}

// HANDLER
router.patch('/:room_code', async (req, res) => {
    const setPayload = {};
    
    // Game-Felder aktualisieren
    if (req.body.game_phase !== undefined) {
        setPayload.game_phase = req.body.game_phase;
    }
    
    // Settings aktualisieren
    if (req.body.settings && typeof req.body.settings === 'object') {
        setPayload['settings.day_timer'] = Number(req.body.settings.day_timer);
        setPayload['settings.with_hunter'] = parseBoolean(req.body.settings.with_hunter);
    }
    
    const game = await Game.findOneAndUpdate(
        { room_code: roomCode },
        { $set: setPayload },
        { new: true }
    );
    
    // Spieler-Felder innerhalb von game.players aktualisieren
    if (req.body.player_update) {
        const player = findPlayer(game, Number(req.body.player_update.player_id));
        if (player) {
            Object.assign(player, req.body.player_update.set);
            await game.save();
        }
    }
    
    return res.json({ status: 'ok', ...toGameStateResponse(game) });
});
```

#### **DELETE: Spiel löschen**

**Endpoint**: `DELETE /api/games/:room_code`

```javascript
// HANDLER
router.delete('/:room_code', async (req, res) => {
    const roomCode = String(req.params.room_code).toUpperCase();
    const deleted = await Game.deleteOne({ room_code: roomCode });
    
    if (!deleted.deletedCount) {
        return res.status(404).json({ error: 'room_not_found' });
    }
    
    return res.json({ status: 'deleted', room_code: roomCode });
});

// RESPONSE (200)
{
    "status": "deleted",
    "room_code": "ABC123"
}
```

### 6.3 Spiel-Aktionen (POST /:room_code/actions)

**Wichtige Handler** für Spielmechanik:

| Handler | Beschreibung | Code |
|---------|-------------|------|
| `handleWolfVote` | Wolf wählt Opfer | `wolf_vote` payload |
| `handleSeerPeek` | Seher sieht Rolle | `seer_peek` payload |
| `handleArmorLink` | Rüstung verkuppelt | `armor_link` mit 2 Player-IDs |
| `handleUseWitch` | Hexe heilt/vergiftet | `use_witch` mit heal/poison boolean |
| `handlePerformAction` | Hunter schießt | `hunter_shot` mit targetId |
| `handleNextPhase` | Phase-Übergang | Prüft Timer, führt Voting durch |

**Beispiel: Hunter-Rache-Schuss**

```javascript
async function handlePerformAction(game, payload) {
    const playerId = Number(payload.playerId);
    const target = Number(payload.targetId);
    const isHunterShot = actor.role === 'hunter' && String(payload.hunter_shot) === '1';
    
    // Nur in hunter_revenge Phase
    if (game.game_phase === 'hunter_revenge') {
        if (!isHunterShot) {
            return { error: 'hunter_shot_required' };
        }
        if (Number(game.hunter_revenge_player_id) !== Number(playerId)) {
            return { error: 'not_active_hunter' };
        }
        
        // Schuss ausführen
        const killedByShot = applyLinkedDeath(game, target);
        game.last_night_event = `hunter_shot:${target}`;
        
        const winner = checkGameOver(game);
        if (!winner) {
            resumeFromHunterRevenge(game);  // Zurück zu vorheriger Phase
        } else {
            clearHunterRevengeState(game);
        }
        
        await game.save();
        return { status: 'ok', hunter_shot: target, killed: killedByShot, winner };
    }
}
```

---

## 7. Frontend & Template-System

### 7.1 HTML-Template-Architektur

[index.html](index.html) Struktur:

```html
<!-- Login-Gate (vor Game-Start) -->
<div id="screen-login" class="screen active">
    <input type="text" id="login-username" placeholder="Benutzername">
    <input type="password" id="login-password" placeholder="Passwort">
    <button onclick="loginUser()">Login</button>
    <button onclick="toggleRegister()">Registrieren</button>
</div>

<!-- Lobby (Spieler-Auswahl) -->
<div id="screen-lobby" class="screen">
    <h2>Willkommen! Warte auf weitere Spieler...</h2>
    <div id="player-list"></div>
    <label>
        <input type="checkbox" id="set-with-hunter" checked> Mit Jäger spielen
    </label>
    <button onclick="startGame()">Spiel starten</button>
</div>

<!-- Spiel-Screen (Haupt-UI) -->
<div id="screen-game" class="screen">
    <div id="game-header">
        <span id="my-username">👤 Alice</span>
        <span id="game-phase">Nacht (Wölfe)</span>
        <button id="logout-btn" onclick="logoutUser()">Logout</button>
    </div>
    <div id="game-timer"></div>
    <div id="action-text">Beschreibung der Aktion...</div>
    <div id="player-grid"></div>
</div>

<!-- Native Template-Elemente (Komponenten) -->
<template id="tpl-player-card">
    <div class="player-card" data-player-id="">
        <img src="" alt="Rolle-Bild">
        <p class="player-name">Name</p>
        <span class="player-role">?</span>
    </div>
</template>

<template id="tpl-poison-modal">
    <div id="poison-modal" class="modal">
        <h3>Gift-Ziel wählen</h3>
        <div id="poison-targets"></div>
        <button onclick="submitPoison()">Bestätigen</button>
    </div>
</template>

<template id="tpl-death-overlay">
    <div id="death-overlay" class="overlay">
        <h2>💀 Du bist gestorben!</h2>
        <p id="death-message">Du kannst zuschauen, bis das Spiel vorbei ist.</p>
    </div>
</template>
```

### 7.2 Template-Rendering Muster

[js/script.js](js/script.js) Auszug:

```javascript
// Native Template clonen
function cloneTemplateElement(templateId) {
    const template = document.getElementById(templateId);
    if (!template?.content?.firstElementChild) return null;
    return template.content.firstElementChild.cloneNode(true);
}

// Spieler-Karte dynamisch erstellen
function createPlayerCardElement(player, options = {}) {
    const { selected = false, nonClickable = false, onClick = null } = options;
    
    const card = cloneTemplateElement('tpl-player-card');
    card.dataset.playerId = String(player.player_id);
    card.querySelector('.player-name').textContent = player.name;
    
    if (Number(player.is_alive) === 0) {
        card.classList.add('dead');
    }
    
    if (selected) {
        card.classList.add('selected');
    }
    
    if (typeof onClick === 'function' && !nonClickable) {
        card.addEventListener('click', onClick);
    }
    
    return card;
}

// Lobby-Spieler rendern
function renderLobbyPlayers(players) {
    const list = document.getElementById('player-list');
    clearContainer(list);
    
    players.forEach(player => {
        const row = cloneTemplateElement('tpl-lobby-player');
        row.textContent = player.name;
        list.appendChild(row);
    });
}
```

**Vorteile des Template-Ansatzes:**
- ✅ Sicher gegen XSS (kein `innerHTML`)
- ✅ Performant (native Browser-API)
- ✅ HTML-Struktur gekapselt
- ✅ Keine Framework-Abhängigkeit

### 7.3 Game State Polling

```javascript
// Alle 2 Sekunden Spiel-Zustand abrufen
let pollingInterval = setInterval(async () => {
    const state = await api({ 
        action: 'get_state', 
        code: gameCode, 
        myId: myPlayerId 
    });
    
    if (state.error) return;
    
    const game = state.game;
    const players = state.players;
    const me = state.me;
    
    // Server-Zeit synchronisieren
    if (state.server_time) {
        serverTimeOffset = state.server_time * 1000 - Date.now();
    }
    
    // UI basierend auf Phase aktualisieren
    updateGameUI(game, players, me, state);
    
    // Countdown starten
    startPhaseCountdown(state.phase_ends_at_unix);
}, 2000);
```

---

## 8. CSS & Mobile Responsiveness

### 8.1 CSS-Theme-System

[css/style1.css](css/style1.css):

```css
/* Nacht-Theme (Default) */
body.night {
    --night-1: #1a1a2e;      /* Sehr dunkles Blau */
    --night-2: #16213e;       /* Dunkelblau */
    --day-1: #ffd700;         /* Warm Gold */
    --day-2: #ffed4e;         /* Hellgold */
    --accent-2: #00d4ff;      /* Cyan */
    --text-main: #ffffff;
    --panel-night: #0f3460;
    background-color: var(--night-1);
    color: var(--text-main);
    transition: all 0.3s ease;
}

/* Tag-Theme */
body.day {
    --night-1: #f5c25f;       /* Sonnengold */
    --night-2: #fae590;       /* Helles Gold */
    --accent-2: #ff6b6b;      /* Rot */
    --text-main: #2c3e50;
    background-color: var(--day-1);
    color: var(--text-main);
}

/* Jäger-Rache-Theme */
body.hunter-revenge {
    --night-1: #5d0d3b;       /* Dunkelrot */
    --night-2: #8b254b;       /* Burgunder */
    --accent-2: #ff6b6b;      /* Leuchtendes Rot */
    --danger: #ff4444;
    background-color: var(--night-1);
    color: #ffffff;
}
```

### 8.2 Responsive Grid Layout

```css
/* Spieler-Raster */
#player-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.player-card {
    background: linear-gradient(135deg, var(--accent-2), #00a8e8);
    border-radius: 10px;
    padding: 15px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 3px solid transparent;
}

.player-card:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 16px rgba(0, 212, 255, 0.3);
}

.player-card.selected {
    border-color: #ffd700;
    box-shadow: 0 0 20px #ffd700;
}

.player-card.dead {
    opacity: 0.5;
    background: linear-gradient(135deg, #666, #333);
    cursor: not-allowed;
}

/* Mobile Breakpoint (bis 600px) */
@media (max-width: 600px) {
    #player-grid {
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 8px;
        padding: 10px;
    }
    
    .player-card {
        padding: 10px;
        font-size: 12px;
    }
    
    #game-header {
        flex-direction: column;
        gap: 8px;
    }
    
    #logout-btn {
        position: static;
        width: 100%;
    }
    
    body {
        font-size: 14px;
    }
}
```

### 8.3 Button-Styling

```css
button {
    background: linear-gradient(135deg, var(--accent-2), #0087cc);
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: all 0.3s;
}

button:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 212, 255, 0.4);
}

button:active {
    transform: translateY(-1px);
}

.btn-secondary {
    background: var(--panel-night);
    border: 2px solid var(--accent-2);
}

.btn-success {
    background: linear-gradient(135deg, #10b981, #059669);
}

.btn-danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
}

/* Mobile: Volle Breite */
@media (max-width: 600px) {
    button {
        width: 100%;
        padding: 15px 10px;
    }
}
```

---

## 9. Spielmechanik & Phasen-Übergang

### 9.1 Phasen-Zustandsdiagramm

```mermaid
stateDiagram-v2
    [*] --> lobby: Spiel erstellt
    lobby --> night: Start Game
    
    night --> night: next_phase (armor→seer→wolf→witch)
    night --> hunter_revenge: Hunter getötet (Nacht)
    night --> day: Alle Nacht-Aktionen
    
    hunter_revenge --> day: Hunter schießt (zu Nacht zurück)
    hunter_revenge --> hunter_revenge: Hunter schießt (bleibt in Rache)
    
    day --> day: next_phase (discussion→voting)
    day --> hunter_revenge: Hunter getötet (Voting)
    day --> night: Voting beendet
    
    night --> gameover: Wolves gewinnen
    day --> gameover: Village gewinnen
    hunter_revenge --> gameover: Jemand gewinnt
    
    gameover --> [*]
```

### 9.2 Rolle-Defintion & Fähigkeiten

| Rolle | Anzahl | Nachtwahr | Aktion | Bedingung |
|-------|--------|-----------|--------|-----------|
| **Wolf** | `wolf_count` | Klein | Wählt Opfer (Voting) | Wolf-Vote erlaubt |
| **Seher** | 1 | Mittel | Sieht eine Rol (1x) | Wenn am Leben |
| **Hexe** | 1 | Hoch | Heilen/Gift (je 1x) | Trank verfügbar |
| **Rüstung** | 1 | Mittel | Verkuppelt 2er (1x) | Partner-Schutz |
| **Jäger** | 0/1 | Höchst | Schießt (Rache) | Wenn getötet |
| **Dorfbewohner** | Rest | Keine | Stimmt ab | Sichtbar |

### 9.3 Jäger-Rache-Logik

**Trigger**: Wenn Jäger in Nacht oder Voting eliminiert wird:

```javascript
function startHunterRevenge(game, hunterPlayerId, returnPhase, returnStep) {
    console.log(`🎯 Hunter #${hunterPlayerId} startet Rache!`);
    
    game.game_phase = 'hunter_revenge';
    game.hunter_revenge_player_id = hunterPlayerId;
    game.hunter_revenge_return_phase = returnPhase;     // z.B. 'day'
    game.hunter_revenge_return_step = returnStep;       // z.B. 'voting'
    
    setPhaseEnd(game, 30);  // 30 Sekunden für Schuss
}

async function handlePerformAction(game, payload) {
    if (game.game_phase === 'hunter_revenge') {
        // Nur aktiver Hunter darf schießen
        if (Number(game.hunter_revenge_player_id) !== Number(playerId)) {
            return { error: 'not_active_hunter' };
        }
        
        // Schuss führt potentiell zum Sieg
        const killedByShot = applyLinkedDeath(game, targetId);
        const winner = checkGameOver(game);
        
        if (!winner) {
            // Zurück zu vorheriger Phase
            resumeFromHunterRevenge(game);
        }
        
        await game.save();
        return { status: 'ok', hunter_shot: targetId, winner };
    }
}
```

### 9.4 Linked-Death (Rüstungs-Mechnik)

Wenn Rüstung zwei Spieler verkuppelt und einer getötet wird, stirbt auch der andere:

```javascript
function applyLinkedDeath(game, targetId) {
    const target = findPlayer(game, targetId);
    if (!target) return [];
    
    target.is_alive = 0;
    const killed = [targetId];
    
    // Wenn Partner am Leben, auch Partner töten
    if (target.linked_user_id) {
        const partner = findPlayer(game, target.linked_user_id);
        if (partner && Number(partner.is_alive) === 1) {
            partner.is_alive = 0;
            killed.push(target.linked_user_id);
        }
    }
    
    return killed;  // Array betroffener Spieler-IDs
}
```

---

## 10. Session-Management & Benutzer-Authentifizierung

### 10.1 Frontend Session Persistierung

[js/script.js](js/script.js):

```javascript
const AUTH_STORAGE_KEY = 'ww_username';

// Username speichern nach erfolgreichem Login
function persistUsername(username) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, username);
    myUsername = username;
}

// Username beim Page-Load Restore
function restoreUsername() {
    myUsername = sessionStorage.getItem(AUTH_STORAGE_KEY) || null;
    if (myUsername) {
        showScreen('screen-lobby');
        // Automatisch in Spiel eintreten
    } else {
        showScreen('screen-login');
    }
}

// Login Handler
async function loginUser() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    const result = await requestJson('/api/auth/login', 'POST', {
        username,
        password
    });
    
    if (result.error) {
        showToast('❌ Login fehlgeschlagen: ' + result.error, 'danger');
        return;
    }
    
    // Erfolgreich
    persistUsername(result.username);
    showScreen('screen-lobby');
}

// Logout Handler
function logoutUser() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    myUsername = null;
    gameCode = null;
    myPlayerId = null;
    clearInterval(pollingInterval);
    showScreen('screen-login');
    showToast('✅ Erfolgreich abgemeldet.', 'success');
}
```

### 10.2 Login-Gate HTML

```html
<!-- Auth-Gate (aktiv bis eingelogt) -->
<div id="screen-login" class="screen active">
    <div class="auth-box">
        <h1>🐺 Werwolf Spiel</h1>
        
        <form id="login-form" onsubmit="loginUser(); return false;">
            <input type="text" id="login-username" 
                   placeholder="Benutzername" required>
            <input type="password" id="login-password" 
                   placeholder="Passwort" required>
            <button type="submit">🔓 Login</button>
        </form>
        
        <div id="register-panel" style="display:none;">
            <input type="text" id="reg-username" 
                   placeholder="Neuer Benutzername" required>
            <input type="password" id="reg-password" 
                   placeholder="Passwort" required>
            <button onclick="registerUser()">✍️ Registrieren</button>
        </div>
        
        <button onclick="toggleRegister()">Noch kein Account?</button>
    </div>
</div>
```

---

## 11. Fehlerbehandlung & Validierung

### 11.1 API-Fehler Kategorien

| HTTP-Status | Fehler | Beschreibung |
|-------------|--------|-------------|
| 400 | `missing_fields` | Username oder Passwort fehlt |
| 401 | `invalid_credentials` | Passwort falsch |
| 404 | `room_not_found` | Spiel-Raum existiert nicht |
| 409 | `username_taken` | Username bereits registriert |
| 409 | `game_already_running` | kann Spieler nicht hinzufügen, Spiel läuft |
| 500 | `server_error` | Unerwarteter Fehler |

### 11.2 Frontend Error Handling

```javascript
async function loginUser() {
    const result = await requestJson('/api/auth/login', 'POST', { username, password });
    
    if (result.error) {
        const errorMap = {
            'missing_fields': '❌ Benutzername und Passwort erforderlich',
            'invalid_credentials': '❌ Ungültige Anmeldedaten',
            'server_error': '❌ Server-Fehler. Bitte später erneut versuchen'
        };
        
        const message = errorMap[result.error] || '❌ Ein Fehler ist aufgetreten';
        showToast(message, 'danger', 5000);
    }
}
```

### 11.3 Validierung: parseBoolean

```javascript
function parseBoolean(value, defaultValue = true) {
    if (value === true || value === 1 || value === '1' || value === 'true') {
        return true;
    }
    if (value === false || value === 0 || value === '0' || value === 'false' || value === null) {
        return false;
    }
    return defaultValue;
}
```

---

## 12. Deployment & Verwendung

### 12.1 Umgebungsvariablen (.env)

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/werwolf

# Server-Port
PORT=3000

# Node Environment
NODE_ENV=production
```

### 12.2 Starten

```bash
# Installation
npm install

# Tests laufen
npm test

# Server starten
npm start
# Server läuft auf http://localhost:3000
```

### 12.3 Browser-Zugriff

1. Browser zu `http://localhost:3000` öffnen
2. Registrieren oder einloggen
3. Raum-Code eingeben oder Spiel erstellen
4. Mit anderen Spielern spielen

---

## 13. Zusammenfassung: Anforderungserfüllung

| Anforderung | Status | Evidenz |
|-------------|--------|---------|
| Authentifizierung mit bcrypt | ✅ | [authRoutes.js](routes/authRoutes.js#L15-L35) |
| 10 Salt-Runden | ✅ | `bcrypt.hash(password, 10)` |
| Supertest POC | ✅ | [api.test.js](tests/api.test.js) |
| Jäger-Rache-Mechanik | ✅ | `hunter_revenge` Phase in [Game.js](models/Game.js) |
| Login-Gate | ✅ | [index.html](index.html#L1-L30) |
| Logout-Button | ✅ | [screen-game](index.html#L80) + logoutUser() |
| Mobile-Responsive | ✅ | [style1.css](css/style1.css#L400-L450) (@media 600px) |
| Session-Persistierung | ✅ | sessionStorage `ww_username` |
| MongoDB Speicherung | ✅ | User + Game Collections |
| REST API CRUD | ✅ | POST/GET/PATCH/DELETE in [gameRoutes.js](routes/gameRoutes.js) |

---

**Dokumentation vervollständigt**: 2024  
**Projektstand**: Phase 8 - Dokumentation (Code eingefroren)  
**Alle Anforderungen erfüllt**: ✅
