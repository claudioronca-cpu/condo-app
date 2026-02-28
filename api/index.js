const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database'); // Starts DB connection and schema setup

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents statically (only for test, usually protected via API)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const condoRoutes = require('./routes/condos');
const docRoutes = require('./routes/docs');

const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/condos', condoRoutes);
apiRouter.use('/docs', docRoutes);

// Health check / ping
apiRouter.get('/ping', (req, res) => res.json({ status: 'ok', message: 'CondoConnect API is online' }));

app.use('/api', apiRouter);
app.use('/', apiRouter); // Catch-all for Vercel routing

// General error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
