console.log('🔵 secure.js: INÍCIO');

// backend/routes/vulnerable.js
const express = require('express');
const router = express.Router();
const { promisePool, logQuery } = require('../database');

// 🔴 LOGIN VULNERÁVEL - NÃO USAR EM PRODUÇÃO
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // ❌ QUERY VULNERÁVEL - CONCATENAÇÃO DIRETA
  const query = `
    SELECT * FROM users 
    WHERE username = '${username}' 
    AND password = '${password}'
  `;

  logQuery(query, { username, password }, true);

  try {
    const [rows] = await promisePool.query(query);
    
    // Log da tentativa de login
    await promisePool.query(
      'INSERT INTO login_attempts (username, ip_address, success, query_used) VALUES (?, ?, ?, ?)',
      [username, req.ip, rows.length > 0, query.substring(0, 200)] // Limita o tamanho da query no log
    );

    if (rows.length > 0) {
      res.json({ 
        success: true, 
        user: rows[0],
        message: 'Login realizado com sucesso (VULNERÁVEL!)',
        query
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas',
        query
      });
    }
  } catch (error) {
    // ❌ EXPOR ERROS SQL - PERIGOSO!
    res.status(500).json({ 
      error: error.message,
      query,
      message: 'Erro SQL exposto - VULNERÁVEL!'
    });
  }
});

// 🔴 BUSCA VULNERÁVEL - NÃO USAR EM PRODUÇÃO
router.get('/products', async (req, res) => {
  const { search } = req.query;
  
  // Se não tiver search, retorna todos (ainda vulnerável)
  if (!search) {
    const query = 'SELECT * FROM products ORDER BY id';
    try {
      const [rows] = await promisePool.query(query);
      return res.json({ 
        products: rows,
        query,
        count: rows.length
      });
    } catch (error) {
      return res.status(500).json({ error: error.message, query });
    }
  }
  
  // ❌ QUERY VULNERÁVEL
  const query = `
    SELECT * FROM products 
    WHERE name LIKE '%${search}%' 
    OR description LIKE '%${search}%'
  `;

  logQuery(query, { search }, true);

  try {
    const [rows] = await promisePool.query(query);
    res.json({ 
      products: rows,
      query,
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      query
    });
  }
});

// 🔴 ROTA PARA TESTAR UNION ATTACK
router.get('/user-data', async (req, res) => {
  const { id } = req.query;
  
  // ❌ QUERY VULNERÁVEL A UNION ATTACK
  const query = `SELECT id, username, email FROM users WHERE id = ${id || 1}`;

  logQuery(query, { id }, true);

  try {
    const [rows] = await promisePool.query(query);
    res.json({ 
      data: rows,
      query
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      query
    });
  }
});

// 🔴 ROTA VULNERÁVEL PARA TESTAR INJEÇÃO EM ORDEM
router.get('/sort', async (req, res) => {
  const { order } = req.query;
  
  // ❌ VULNERÁVEL - order by injection
  const query = `SELECT id, name, price FROM products ORDER BY ${order || 'id'}`;

  try {
    const [rows] = await promisePool.query(query);
    res.json({ 
      products: rows,
      query
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      query
    });
  }
});

console.log('🔵 secure.js: router definido?', router ? 'sim' : 'não');
console.log('🔵 secure.js: FINAL');
module.exports = router;