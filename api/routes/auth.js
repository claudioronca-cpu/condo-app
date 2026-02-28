const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = process.env.JWT_SECRET || 'secret-key-change-in-prod';

// Helper to parse address into a Condo Name
const parseCondoName = (address) => {
    if (!address) return "Unnamed Condo";

    // Split by comma and take the first part (the street name and number)
    let firstPart = address.split(',')[0].trim();

    // Remove common street prefixes
    const prefixes = ['via ', 'viale ', 'piazza ', 'corso ', 'largo ', 'street ', 'avenue ', 'road '];
    let lowerPart = firstPart.toLowerCase();

    for (let prefix of prefixes) {
        if (lowerPart.startsWith(prefix)) {
            firstPart = firstPart.substring(prefix.length).trim();
            break;
        }
    }

    // Capitalize each word
    return firstPart.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// Register
router.post('/register', async (req, res) => {
    const { address, name, surname, unit_number, email, phone, password, invite_code } = req.body;

    if (!name || !surname || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields: name, surname, email, password' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Scenario 1: User is creating a new condo
        if (address) {
            const condoName = parseCondoName(address);

            try {
                const condoRes = await db.run(
                    `INSERT INTO condos (address, name) VALUES ($1, $2) RETURNING id`,
                    [address, condoName]
                );
                const newCondoId = condoRes.rows[0].id;

                const userRes = await db.run(
                    `INSERT INTO users (name, surname, unit_number, email, phone, role, condo_id, password_hash) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                    [name, surname, unit_number, email, phone, 'admin', newCondoId, hashedPassword]
                );

                return res.status(201).json({
                    message: 'User and condo created',
                    userId: userRes.rows[0].id,
                    condoId: newCondoId
                });
            } catch (dbErr) {
                if (dbErr.message.includes('unique constraint') || dbErr.message.includes('already exists')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: dbErr.message });
            }
        } else if (invite_code) {
            // Scenario 2: User is joining an existing condo via a secure 13-character invite code
            const invite = await db.get(`SELECT * FROM invites WHERE code = $1`, [invite_code]);

            if (!invite) return res.status(400).json({ error: 'Invalid invite code.' });
            if (invite.used) return res.status(400).json({ error: 'This invite code has already been used.' });
            if (invite.email.toLowerCase() !== email.toLowerCase()) {
                return res.status(400).json({ error: 'This invite code is not assigned to this email address.' });
            }

            try {
                const userRes = await db.run(
                    `INSERT INTO users (name, surname, unit_number, email, phone, role, condo_id, password_hash) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                    [name, surname, unit_number, email, phone, invite.role, invite.condo_id, hashedPassword]
                );
                const newUserId = userRes.rows[0].id;

                // Mark invite as used
                await db.run(`UPDATE invites SET used = TRUE WHERE id = $1`, [invite.id]);

                return res.status(201).json({ message: 'User created and joined condo successfully', userId: newUserId });
            } catch (dbErr) {
                if (dbErr.message.includes('unique constraint') || dbErr.message.includes('already exists')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: dbErr.message });
            }
        } else {
            return res.status(400).json({ error: 'You must provide a new Condo Address or an Invite Code.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.get(`SELECT * FROM users WHERE email = $1`, [email]);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({
            id: user.id,
            role: user.role,
            condo_id: user.condo_id,
            name: user.name,
            surname: user.surname
        }, SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, name: user.name, role: user.role, condo_id: user.condo_id } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Forgot Password - generate a reset token
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const user = await db.get(`SELECT id FROM users WHERE email = $1`, [email]);
        if (!user) return res.status(404).json({ error: 'No account found with that email' });

        // Generate a 20-character reset token
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 20; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Token expires in 1 hour
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        await db.run(
            `INSERT INTO reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)`,
            [email, token, expiresAt]
        );

        // In production, send this via email. For now, return it directly.
        res.json({ message: 'Reset token generated', token });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create reset token' });
    }
});

// Reset Password - validate token and update password
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });

    try {
        const resetToken = await db.get(`SELECT * FROM reset_tokens WHERE token = $1 AND used = FALSE`, [token]);
        if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset token' });

        // Check expiry
        if (new Date(resetToken.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Reset token has expired' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hashedPassword, resetToken.email]);

        // Mark token as used
        await db.run(`UPDATE reset_tokens SET used = TRUE WHERE id = $1`, [resetToken.id]);

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
