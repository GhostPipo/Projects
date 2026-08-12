const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'username_and_password_required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: String(username).trim(),
      password: passwordHash
    });

    return res.status(201).json({ username: user.username });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ error: 'username_already_exists' });
    }

    return res.status(500).json({ error: 'register_failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'username_and_password_required' });
    }

    const normalizedUsername = String(username).trim();
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    return res.json({ username: user.username });
  } catch (error) {
    return res.status(500).json({ error: 'login_failed' });
  }
});

module.exports = router;
