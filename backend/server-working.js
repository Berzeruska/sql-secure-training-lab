const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

console.log('🔵 Iniciando servidor...');

let database, logger, vulnerableRoutes, secureRoutes;

try {
    database = require('./database');
    console.log('✅ database carregado');
} catch (error) {
    console.error('❌ Erro database:', error.message);
    process.exit(1);
}

try {
    logger = require('./middleware/logger');
    console.log('✅ logger carregado');
    console.log('📦 Exportações:', Object.keys(logger));
    console.log('🔧 requestLogger é função?', typeof logger.requestLogger === 'function');
} catch (error) {
    console.error('❌ Erro logger:', error.message);
    process.exit(1);
}

try {
    vulnerableRoutes = require('./routes/vulnerable');
    secureRoutes = require('./routes/secure');
    console.log('✅ rotas carregadas');
} catch (error) {
    console.error('❌ Erro rotas:', error.message);
    process.exit(1);
}

const app = express();
const PORT = 3000; // ou 3001 se necessário

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log (se disponível)
if (logger && typeof logger.requestLogger === 'function') {
    console.log('✅ Usando logger original');
    app.use(logger.requestLogger);
} else {
    console.log('⚠️ Usando logger simples (fallback)');
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// Servir arquivos estáticos do frontend
const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    console.log('✅ Frontend encontrado');
} else {
    console.log('⚠️ Frontend não encontrado, criando básico...');
    fs.mkdirSync(frontendPath, { recursive: true });
    const html = `<!DOCTYPE html><html><head><title>SQL Lab</title></head><body style="background:#0a0e17;color:#00d4ff;font-family:monospace;padding:50px"><h1>✅ Servidor funcionando!</h1><p>Logger original funcionando!</p></body></html>`;
    fs.writeFileSync(path.join(frontendPath, 'index.html'), html);
    app.use(express.static(frontendPath));
}

// ----- ROTAS DA API (devem vir antes da rota curinga) -----
app.use('/api/vulnerable', vulnerableRoutes);
app.use('/api/secure', secureRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'API funcionando!', time: new Date().toISOString() });
});

app.get('/api/vulnerable/health', (req, res) => res.json({ status: 'vulnerable API ok' }));
app.get('/api/secure/health', (req, res) => res.json({ status: 'secure API ok' }));

app.get('/admin/stats', async (req, res) => {
    try {
        const db = database.promisePool;
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [productCount] = await db.query('SELECT COUNT(*) as count FROM products');
        res.json({ users: userCount[0].count, products: productCount[0].count });
    } catch (error) {
        console.error('Erro em /admin/stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// ----- ROTA CURINGA (para SPA) -----
app.use((req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Página não encontrada');
    }
});

// ----- Middleware de erro global (deve ser o último) -----
app.use((err, req, res, next) => {
    console.error('🔥 Erro não capturado:', err);
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
});

// Inicialização do banco e start do servidor
console.log('🔵 Inicializando banco de dados...');
database.initializeDatabase()
    .then(() => {
        console.log('✅ Banco de dados OK');
        startServer();
    })
    .catch(error => {
        console.error('❌ Erro no banco:', error.message);
        console.log('⚠️ Continuando sem banco...');
        startServer();
    });

function startServer() {
    const server = app.listen(PORT, () => {
        console.log('\n=================================');
        console.log('🚀 SERVIDOR RODANDO!');
        console.log(`📌 URL: http://localhost:${PORT}`);
        console.log('=================================\n');
    });

    server.on('error', (err) => {
        console.error('❌ Erro ao iniciar servidor:', err);
        if (err.code === 'EADDRINUSE') {
            console.error(`Porta ${PORT} já está em uso. Tente outra porta.`);
        }
        process.exit(1);
    });
}