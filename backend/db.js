const { Pool } = require('pg');

// This logic checks if DATABASE_URL exists (on Render). 
// If it doesn't, it falls back to your local settings.
const isProduction = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
    
  
});

module.exports = pool;