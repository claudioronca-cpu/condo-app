const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../database');
const auth = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Upload a document
router.post('/', auth, upload.single('document'), async (req, res) => {
    const { title, target_user_id } = req.body;
    const file = req.file;

    if (!file || !title) {
        return res.status(400).json({ error: 'Title and document are required' });
    }

    // Role validation
    if (target_user_id && req.user.role !== 'admin') {
        fs.unlinkSync(file.path);
        return res.status(403).json({ error: 'Only admins can upload documents for specific users' });
    }

    const query = `
        INSERT INTO documents (title, file_path, uploaded_by, condo_id, target_user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `;
    const params = [
        title,
        file.filename,
        req.user.id,
        req.user.condo_id,
        target_user_id || null
    ];

    try {
        const result = await db.run(query, params);
        res.status(201).json({ message: 'Document uploaded successfully', docId: result.rows[0].id });
    } catch (err) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(500).json({ error: err.message });
    }
});

// Retrieve documents based on user access
router.get('/', auth, async (req, res) => {
    const user = req.user;

    let query = `
        SELECT d.id, d.title, d.file_path, d.created_at, u.name as uploader_name, u.role as uploader_role, d.target_user_id 
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.condo_id = $1
    `;

    const params = [user.condo_id];

    if (user.role !== 'admin') {
        // Owners can only see common docs or docs targeted to them
        query += ` AND (d.target_user_id IS NULL OR d.target_user_id = $2)`;
        params.push(user.id);
    }

    query += ` ORDER BY d.created_at DESC`;

    try {
        const rows = await db.all(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
