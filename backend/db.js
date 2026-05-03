const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,        // Return DATE/DATETIME as 'YYYY-MM-DD' strings, not JS Date objects
    timezone: '+05:30'        // Tell mysql2 the DB server is in IST
});

module.exports = pool;
