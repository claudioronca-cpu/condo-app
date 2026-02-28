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

// Get condo details
router.get('/details', auth, (req, res) => {
    db.get(`SELECT id, address, name, created_at FROM condos WHERE id = ?`, [req.user.condo_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Condo not found' });
        res.json(row);
    });
});

// Update condo settings (admin only)
router.put('/settings', auth, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can update condo settings' });
    }

    const { address, name } = req.body;
    if (!address || !name) {
        return res.status(400).json({ error: 'Address and name are required' });
    }

    db.run(`UPDATE condos SET address = ?, name = ? WHERE id = ?`,
        [address, name, req.user.condo_id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Condo settings updated successfully' });
        }
    );
});

module.exports = router;
