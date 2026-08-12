const express = require('express');
const path = require('path');
const gameRoutes = require('./routes/gameRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/games', gameRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;
