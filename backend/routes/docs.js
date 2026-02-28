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
router.post('/', auth, upload.single('document'), (req, res) => {
    const { title, target_user_id } = req.body;
    const file = req.file;

    if (!file || !title) {
        return res.status(400).json({ error: 'Title and document are required' });
    }

    // Role validation
    // Rule: Users (owners) can upload common docs.
    // Rule: Admins can upload common docs AND docs for single users.
    if (target_user_id && req.user.role !== 'admin') {
        // Check if the user is uploading a targeted doc. Only admins can do this.
        // Cleanup the uploaded file to avoid orphaned files:
        fs.unlinkSync(file.path);
        return res.status(403).json({ error: 'Only admins can upload documents for specific users' });
    }

    const query = `
    INSERT INTO documents (title, file_path, uploaded_by, condo_id, target_user_id)
    VALUES (?, ?, ?, ?, ?)
  `;
    const params = [
        title,
        file.filename,
        req.user.id,
        req.user.condo_id,
        target_user_id || null
    ];

    db.run(query, params, function (err) {
        if (err) {
            fs.unlinkSync(file.path);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Document uploaded successfully', docId: this.lastID });
    });
});

// Retrieve documents based on user access
router.get('/', auth, (req, res) => {
    const user = req.user;

    let query = `
    SELECT d.id, d.title, d.file_path, d.created_at, u.name as uploader_name, u.role as uploader_role, d.target_user_id 
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.condo_id = ?
  `;

    if (user.role !== 'admin') {
        // Owners can only see common docs or docs targeted to them
        query += ` AND (d.target_user_id IS NULL OR d.target_user_id = ${user.id})`;
    } else {
        // Admins see everything in the condo
    }

    query += ` ORDER BY d.created_at DESC`;

    db.all(query, [user.condo_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
