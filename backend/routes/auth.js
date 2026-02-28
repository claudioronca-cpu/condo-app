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
    // invite_code replaces condo_id + role for joining existing condos
    const { address, name, surname, unit_number, email, phone, password, invite_code } = req.body;

    if (!name || !surname || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields: name, surname, email, password' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Scenario 1: User is creating a new condo
        if (address) {
            const condoName = parseCondoName(address);

            db.run(`INSERT INTO condos (address, name) VALUES (?, ?)`, [address, condoName], function (err) {
                if (err) return res.status(500).json({ error: err.message });

                const newCondoId = this.lastID;
                db.run(`INSERT INTO users (name, surname, unit_number, email, phone, role, condo_id, password_hash) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [name, surname, unit_number, email, phone, 'admin', newCondoId, hashedPassword],
                    function (err2) {
                        if (err2) {
                            if (err2.message.includes('UNIQUE constraint failed')) {
                                return res.status(400).json({ error: 'Email already exists' });
                            }
                            return res.status(500).json({ error: err2.message });
                        }
                        return res.status(201).json({ message: 'User and condo created', userId: this.lastID, condoId: newCondoId });
                    }
                );
            });
        } else if (invite_code) {
            // Scenario 2: User is joining an existing condo via a secure 13-character invite code
            db.get(`SELECT * FROM invites WHERE code = ?`, [invite_code], (err, invite) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!invite) return res.status(400).json({ error: 'Invalid invite code.' });
                if (invite.used) return res.status(400).json({ error: 'This invite code has already been used.' });
                if (invite.email.toLowerCase() !== email.toLowerCase()) {
                    return res.status(400).json({ error: 'This invite code is not assigned to this email address.' });
                }

                // Code is valid, let's create the user
                db.run(`INSERT INTO users (name, surname, unit_number, email, phone, role, condo_id, password_hash) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [name, surname, unit_number, email, phone, invite.role, invite.condo_id, hashedPassword],
                    function (err2) {
                        if (err2) {
                            if (err2.message.includes('UNIQUE constraint failed')) {
                                return res.status(400).json({ error: 'Email already exists' });
                            }
                            return res.status(500).json({ error: err2.message });
                        }
                        const newUserId = this.lastID;

                        // Mark invite as used
                        db.run(`UPDATE invites SET used = 1 WHERE id = ?`, [invite.id], (err3) => {
                            if (err3) console.error("Failed to mark invite as used:", err3);
                        });

                        return res.status(201).json({ message: 'User created and joined condo successfully', userId: newUserId });
                    }
                );
            });
        } else {
            return res.status(400).json({ error: 'You must provide a new Condo Address or an Invite Code.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
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
    });
});

// Forgot Password - generate a reset token
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'No account found with that email' });

        // Generate a 20-character reset token
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 20; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Token expires in 1 hour
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        db.run(`INSERT INTO reset_tokens (email, token, expires_at) VALUES (?, ?, ?)`,
            [email, token, expiresAt],
            function (err) {
                if (err) return res.status(500).json({ error: 'Failed to create reset token' });
                // In production, send this via email. For now, return it directly.
                res.json({ message: 'Reset token generated', token });
            }
        );
    });
});

// Reset Password - validate token and update password
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });

    db.get(`SELECT * FROM reset_tokens WHERE token = ? AND used = 0`, [token], async (err, resetToken) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!resetToken) return res.status(400).json({ error: 'Invalid or expired reset token' });

        // Check expiry
        if (new Date(resetToken.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Reset token has expired' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`UPDATE users SET password_hash = ? WHERE email = ?`, [hashedPassword, resetToken.email], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Mark token as used
            db.run(`UPDATE reset_tokens SET used = 1 WHERE id = ?`, [resetToken.id]);

            res.json({ message: 'Password has been reset successfully' });
        });
    });
});

module.exports = router;
