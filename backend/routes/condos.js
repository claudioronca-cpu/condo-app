const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Add a new user to the condo (Invite)
router.post('/invite', auth, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can invite members' });
    }

    const { email, role } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required for invitation' });
    }

    // To simulate an invite, the admin pre-creates a dummy record or generates a code.
    // We'll return a simple mock invitation code that the frontend can display.
    // The new user can then register using this code. We'll simplify and just return condo_id.
    res.json({
        message: 'Invitation generated successfully',
        invite_condo_id: req.user.condo_id,
        instructions: `User should register and pass condo_id: ${req.user.condo_id} and role: ${role || 'owner'}`
    });
});

// List condo members
router.get('/members', auth, (req, res) => {
    db.all(
        `SELECT id, name, surname, email, phone, unit_number, role 
     FROM users WHERE condo_id = ?`,
        [req.user.condo_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

module.exports = router;
