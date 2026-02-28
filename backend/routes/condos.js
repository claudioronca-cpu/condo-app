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

    // Generate a secure 13 character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 13; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    db.run(`INSERT INTO invites (code, condo_id, email, role) VALUES (?, ?, ?, ?)`,
        [code, req.user.condo_id, email, role || 'owner'],
        function (err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to generate invitation code' });
            }

            res.json({
                message: 'Invitation generated successfully',
                invite_code: code,
                email: email,
                role: role || 'owner'
            });
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
