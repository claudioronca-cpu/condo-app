const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase in many environments
  }
});

// Helper for simplified queries (emulating some of sqlite's simplicity where needed)
const db = {
  run: async (text, params) => {
    return pool.query(text, params);
  },
  get: async (text, params) => {
    const res = await pool.query(text, params);
    return res.rows[0];
  },
  all: async (text, params) => {
    const res = await pool.query(text, params);
    return res.rows;
  }
};

console.log('PostgreSQL Connection Pool initialized.');

module.exports = db;
