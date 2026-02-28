const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// Add a new user to the condo (Invite)
router.post('/invite', auth, async (req, res) => {
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

    try {
        await db.run(
            `INSERT INTO invites (code, condo_id, email, role) VALUES ($1, $2, $3, $4)`,
            [code, req.user.condo_id, email, role || 'owner']
        );

        res.json({
            message: 'Invitation generated successfully',
            invite_code: code,
            email: email,
            role: role || 'owner'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate invitation code' });
    }
});

// List condo members
router.get('/members', auth, async (req, res) => {
    try {
        const rows = await db.all(
            `SELECT id, name, surname, email, phone, unit_number, role 
             FROM users WHERE condo_id = $1`,
            [req.user.condo_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get condo details
router.get('/details', auth, async (req, res) => {
    try {
        const row = await db.get(`SELECT id, address, name, created_at FROM condos WHERE id = $1`, [req.user.condo_id]);
        if (!row) return res.status(404).json({ error: 'Condo not found' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update condo settings (admin only)
router.put('/settings', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can update condo settings' });
    }

    const { address, name } = req.body;
    if (!address || !name) {
        return res.status(400).json({ error: 'Address and name are required' });
    }

    try {
        await db.run(
            `UPDATE condos SET address = $1, name = $2 WHERE id = $3`,
            [address, name, req.user.condo_id]
        );
        res.json({ message: 'Condo settings updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
