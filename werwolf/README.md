Werwolf — Node.js Backend

Aktueller Stand
- Das Backend nutzt Express + MongoDB (Mongoose).
- Die App ist getrennt in `app.js` (Express-Setup) und `server.js` (DB-Verbindung + Serverstart).
- REST-Routen liegen unter `/api/games`.

Schnellstart (Windows)

1. Node.js installieren (>=16)
2. Im Projektordner:

```powershell
npm install
copy .env.example .env   # oder manuell anpassen
npm start
```

3. Öffne im Browser `http://localhost:3000/index.html`

Umgebungsvariablen
- `PORT` (z. B. `3000`)
- `MONGO_URI` (MongoDB Atlas oder lokale MongoDB-Verbindung)

API-Basis
- `POST /api/games`
- `POST /api/games/:room_code/players`
- `GET /api/games/:room_code`
- `PATCH /api/games/:room_code`
- `DELETE /api/games/:room_code`
