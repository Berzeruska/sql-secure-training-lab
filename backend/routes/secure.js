console.log('🔵 secure.js: INÍCIO');
// backend/routes/secure.js
const express = require('express');
const router = express.Router();
const { promisePool, logQuery } = require('../database');

// ✅ LOGIN SEGURO COM PREPARED STATEMENTS
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // ✅ QUERY SEGURA - PREPARED STATEMENT
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  const params = [username, password];

  logQuery(query, params, false);

  try {
    const [rows] = await promisePool.query(query, params);
    
    // Log da tentativa de login
    await promisePool.query(
      'INSERT INTO login_attempts (username, ip_address, success) VALUES (?, ?, ?)',
      [username, req.ip, rows.length > 0]
    );

    if (rows.length > 0) {
      res.json({ 
        success: true, 
        user: {
          id: rows[0].id,
          username: rows[0].username,
          email: rows[0].email,
          role: rows[0].role
        },
        message: 'Login realizado com sucesso (SEGURO!)'
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas'
      });
    }
  } catch (error) {
    // ✅ NÃO EXPOR ERROS SQL
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno no servidor'
    });
  }
});

// ✅ BUSCA SEGURA COM PREPARED STATEMENTS
router.get('/products', async (req, res) => {
  const { search } = req.query;
  
  // Se não tiver search, retorna todos os produtos
  if (!search) {
    try {
      const [rows] = await promisePool.query('SELECT * FROM products ORDER BY id');
      return res.json({ 
        products: rows,
        count: rows.length
      });
    } catch (error) {
      console.error('Erro na busca:', error);
      return res.status(500).json({ message: 'Erro interno no servidor' });
    }
  }
  
  // ✅ QUERY SEGURA COM LIKE
  const query = `
    SELECT * FROM products 
    WHERE name LIKE ? OR description LIKE ?
  `;
  const searchPattern = `%${search}%`;
  const params = [searchPattern, searchPattern];

  logQuery(query, params, false);

  try {
    const [rows] = await promisePool.query(query, params);
    res.json({ 
      products: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({ 
      message: 'Erro interno no servidor'
    });
  }
});

// ✅ ROTA SEGURA PARA DADOS DE USUÁRIO POR ID
router.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  
  // ✅ VALIDAÇÃO DE ENTRADA
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ 
      message: 'ID deve ser um número válido' 
    });
  }

  const query = 'SELECT id, username, email, role FROM users WHERE id = ?';
  
  try {
    const [rows] = await promisePool.query(query, [id]);
    
    if (rows.length > 0) {
      res.json({ user: rows[0] });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

// ✅ LISTAR TODOS OS USUÁRIOS (sem senhas) - NOVA ROTA
router.get('/users', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY id'
    );
    res.json({ users: rows });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// ✅ ROTA PARA ESTATÍSTICAS DO USUÁRIO (quantos produtos, etc)
router.get('/stats/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!/^\d+$/.test(userId)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    // Exemplo de query para estatísticas (adaptar conforme suas tabelas)
    const [userStats] = await promisePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM login_attempts WHERE success = true) as successful_logins
    `);
    
    res.json({ stats: userStats[0] });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

// ✅ ROTA DE HEALTH CHECK (para teste)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API segura está funcionando',
    timestamp: new Date().toISOString()
  });
});

console.log('🔵 secure.js: router definido?', router ? 'sim' : 'não');
console.log('🔵 secure.js: FINAL');
module.exports = router;