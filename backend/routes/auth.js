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

module.exports = router;
