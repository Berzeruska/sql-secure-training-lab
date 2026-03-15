console.log('🔵 database.js: início');

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
// Importa apenas a instância do logger (não o objeto inteiro)
const { logger } = require('./middleware/logger');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'training_user',
  password: '123456',
  database: 'training_lab',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const promisePool = pool.promise();

// Logger personalizado para queries SQL (com tratamento de erro)
const logQuery = (query, params, isVulnerable = false) => {
  try {
    const timestamp = new Date().toISOString();
    const userAgent = global.currentRequest?.headers['user-agent'] || 'unknown';
    const ip = global.currentRequest?.ip || 'unknown';

    const logEntry = {
      timestamp,
      query,
      params,
      type: isVulnerable ? 'VULNERABLE' : 'SECURE',
      userAgent,
      ip
    };

    // Usa logger.info se disponível
    if (logger && typeof logger.info === 'function') {
      logger.info('SQL Query executed', logEntry);
    }

    // Log em formato legível para o arquivo de queries
    const logLine = `[${timestamp}] ${isVulnerable ? '🔴 VULNERÁVEL' : '🟢 SEGURO'} - Query: ${query} | Params: ${JSON.stringify(params)}\n`;
    fs.appendFileSync(path.join(__dirname, '../logs/sql-queries.log'), logLine);
  } catch (err) {
    console.error('Erro no logQuery (não crítico):', err.message);
  }
};

// Inicialização do banco de dados
const initializeDatabase = async () => {
  try {
    await promisePool.query('CREATE DATABASE IF NOT EXISTS training_lab');
    await promisePool.query('USE training_lab');

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50),
        ip_address VARCHAR(45),
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT FALSE,
        query_used TEXT
      )
    `);

    const [users] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      await promisePool.query(`
        INSERT INTO users (username, password, email, role) VALUES
        ('admin', 'admin123', 'admin@lab.com', 'admin'),
        ('alice', 'password123', 'alice@lab.com', 'user'),
        ('bob', 'bob123', 'bob@lab.com', 'user'),
        ('charlie', 'charlie123', 'charlie@lab.com', 'user'),
        ('dave', 'dave123', 'dave@lab.com', 'user')
      `);
    }

    const [products] = await promisePool.query('SELECT COUNT(*) as count FROM products');
    if (products[0].count === 0) {
      await promisePool.query(`
        INSERT INTO products (name, price, description) VALUES
        ('Laptop Pro', 4999.99, 'Notebook de alta performance com 16GB RAM'),
        ('Smartphone X', 2499.99, 'Modelo mais recente com 5G'),
        ('Tablet Mini', 1299.99, 'Tablet compacto de 8 polegadas'),
        ('Smart Watch', 899.99, 'Relógio inteligente com GPS'),
        ('Headphones', 499.99, 'Fone de ouvido premium com cancelamento de ruído')
      `);
    }

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
};

module.exports = {
  promisePool,
  logQuery,
  initializeDatabase
};

console.log('🔵 database.js: exportando...');