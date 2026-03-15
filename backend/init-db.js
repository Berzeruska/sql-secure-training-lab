// backend/init-db.js
const mysql = require('mysql2');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Configuração inicial do banco de dados\n');
console.log('Este script irá:');
console.log('1. Criar o usuário training_user');
console.log('2. Criar o banco de dados training_lab');
console.log('3. Criar as tabelas necessárias');
console.log('4. Inserir dados iniciais\n');

rl.question('Digite a senha do root do MySQL: ', async (rootPassword) => {
  let connection;
  
  try {
    // Conectar como root
    connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: rootPassword,
      multipleStatements: true // Permite múltiplos comandos SQL
    });

    console.log('\n📡 Conectado ao MySQL...');

    // Criar usuário do treinamento (se não existir)
    await connection.promise().query(`
      CREATE USER IF NOT EXISTS 'training_user'@'localhost' 
      IDENTIFIED BY 'Training@123'
    `);
    console.log('✅ Usuário training_user criado/verificado');

    // Criar banco de dados
    await connection.promise().query(`
      CREATE DATABASE IF NOT EXISTS training_lab
      CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ Banco de dados training_lab criado/verificado');

    // Dar privilégios
    await connection.promise().query(`
      GRANT ALL PRIVILEGES ON training_lab.* 
      TO 'training_user'@'localhost'
    `);
    
    await connection.promise().query('FLUSH PRIVILEGES');
    console.log('✅ Privilégios concedidos');

    // Selecionar o banco
    await connection.promise().query('USE training_lab');

    // Criar tabelas
    console.log('\n📦 Criando tabelas...');

    // Tabela de usuários
    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela users criada');

    // Tabela de produtos
    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela products criada');

    // Tabela de logs de tentativas
    await connection.promise().query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50),
        ip_address VARCHAR(45),
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT FALSE,
        query_used TEXT
      )
    `);
    console.log('✅ Tabela login_attempts criada');

    // Inserir dados iniciais
    console.log('\n📝 Inserindo dados iniciais...');

    // Verificar se já existem usuários
    const [users] = await connection.promise().query('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      await connection.promise().query(`
        INSERT INTO users (username, password, email, role) VALUES
        ('admin', 'admin123', 'admin@lab.com', 'admin'),
        ('alice', 'password123', 'alice@lab.com', 'user'),
        ('bob', 'bob123', 'bob@lab.com', 'user'),
        ('charlie', 'charlie123', 'charlie@lab.com', 'user'),
        ('dave', 'dave123', 'dave@lab.com', 'user')
      `);
      console.log('✅ Usuários iniciais inseridos');
    } else {
      console.log('⏩ Usuários já existentes, pulando inserção');
    }

    // Verificar se já existem produtos
    const [products] = await connection.promise().query('SELECT COUNT(*) as count FROM products');
    
    if (products[0].count === 0) {
      await connection.promise().query(`
        INSERT INTO products (name, price, description) VALUES
        ('Laptop Pro', 4999.99, 'Notebook de alta performance com 16GB RAM e SSD 512GB'),
        ('Smartphone X', 2499.99, 'Smartphone 5G com câmera de 48MP e 128GB'),
        ('Tablet Mini', 1299.99, 'Tablet de 8 polegadas ideal para leitura e entretenimento'),
        ('Smart Watch', 899.99, 'Relógio inteligente com monitor cardíaco e GPS'),
        ('Headphones', 499.99, 'Fone Bluetooth com cancelamento de ruído ativo')
      `);
      console.log('✅ Produtos iniciais inseridos');
    } else {
      console.log('⏩ Produtos já existentes, pulando inserção');
    }

    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('   Usuário: training_user');
    console.log('   Senha: Training@123');
    console.log('   Banco: training_lab');
    console.log('\n🚀 Agora você pode iniciar o servidor com: npm start');
    
    connection.end();
    rl.close();
    
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:');
    console.error(error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🔑 Senha do root incorreta! Tente novamente.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔌 MySQL não está rodando! Inicie o MySQL primeiro.');
    }
    
    if (connection) connection.end();
    rl.close();
  }
});

// Tratamento para quando o usuário cancela (Ctrl+C)
rl.on('SIGINT', () => {
  console.log('\n\n👋 Operação cancelada pelo usuário');
  rl.close();
  process.exit(0);
});