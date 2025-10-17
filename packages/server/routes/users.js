const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all users
router.get('/', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user
router.post('/', (req, res) => {
  try {
    const { name, pincode, social_security, identification, role, avatar_color } = req.body;
    
    if (!name || !pincode) {
      return res.status(400).json({ error: 'Name and pincode are required' });
    }

    const result = db.prepare(`
      INSERT INTO users (name, pincode, social_security, identification, role, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, pincode, social_security || '', identification || '', role || 'User', avatar_color || '#3b82f6');

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', (req, res) => {
  try {
    const { name, pincode, social_security, identification, role, avatar_color } = req.body;
    
    const result = db.prepare(`
      UPDATE users 
      SET name = ?, pincode = ?, social_security = ?, identification = ?, role = ?, avatar_color = ?
      WHERE id = ?
    `).run(name, pincode, social_security || '', identification || '', role || 'User', avatar_color || '#3b82f6', req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify pincode
router.post('/verify', (req, res) => {
  try {
    const { userId, pincode } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND pincode = ?').get(userId, pincode);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid pincode' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
