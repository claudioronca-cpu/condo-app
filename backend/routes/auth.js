const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = process.env.JWT_SECRET || 'secret-key-change-in-prod';

// Register
router.post('/register', async (req, res) => {
    const { address, name, surname, unit_number, email, phone, password, role, condo_id } = req.body;

    if (!name || !surname || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields: name, surname, email, password' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Scenario 1: User is creating a new condo
        if (address) {
            db.run(`INSERT INTO condos (address) VALUES (?)`, [address], function (err) {
                if (err) return res.status(500).json({ error: err.message });

                const newCondoId = this.lastID;
                db.run(`INSERT INTO users (name, surname, unit_number, email, phone, role, condo_id, password_hash) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [name, surname, unit_number, email, phone, 'admin', newCondoId, hashedPassword],
                    function (err2) {
                        if (err2) return res.status(500).json({ error: err2.message });
                        return res.status(201).json({ message: 'User and condo created', userId: this.lastID, condoId: newCondoId });
                    }
                );
            });
        } else {
            // Scenario 2: User is joining an existing condo via invite, or just registering without a condo initially.
            const userRole = role || 'owner';
            db.run(`INSERT INTO users (name, surname, unit_number, email, phone, role, condo_id, password_hash) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, surname, unit_number, email, phone, userRole, condo_id || null, hashedPassword],
                function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            return res.status(400).json({ error: 'Email already exists' });
                        }
                        return res.status(500).json({ error: err.message });
                    }
                    return res.status(201).json({ message: 'User created', userId: this.lastID });
                }
            );
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
