const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let dbConfig;

// Try to load config from JSON file first
try {
    const configPath = path.join(__dirname, '../config/database.json');
    if (fs.existsSync(configPath)) {
        dbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('Database config loaded from JSON file');
    }
} catch (err) {
    console.log('Could not load database config from JSON file:', err.message);
}

// Fall back to environment variables if JSON config is not available
if (!dbConfig) {
    dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    };
    console.log('Database config loaded from environment variables');
}

// Filter out any invalid MySQL connection properties
const validMySQLOptions = [
    'host', 'port', 'user', 'password', 'database', 
    'charset', 'timezone', 'connectTimeout', 'ssl',
    'debug', 'trace', 'multipleStatements', 'flags'
];

// Create a clean config with only valid MySQL options
const cleanDbConfig = {};
for (const option of validMySQLOptions) {
    if (dbConfig[option] !== undefined) {
        cleanDbConfig[option] = dbConfig[option];
    }
}

// Add a reasonable connection timeout
if (!cleanDbConfig.connectTimeout) {
    cleanDbConfig.connectTimeout = 10000; // 10 seconds
}

// Log the database config (without sensitive info)
console.log('Database connection attempt to:', cleanDbConfig.host);

// Create a connection pool for better performance and reliability
const pool = mysql.createPool({
    ...cleanDbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Convert to promise-based pool for easier use with async/await
const promisePool = pool.promise();

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused');
        }
        if (err.code === 'ETIMEDOUT') {
            console.error('Database connection timed out');
        }
    } else {
        console.log('Connected to MySQL database successfully');
        connection.release(); // Release connection when done
    }
});

// Handle unexpected errors
pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    // Attempt to reconnect automatically
});

module.exports = pool;
