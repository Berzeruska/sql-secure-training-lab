const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de logs exista
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Configuração do logger sem dependências externas
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(logDir, 'application.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: path.join(logDir, 'sql-injection.log'),
            level: 'warn',
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

// Adicionar console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Middleware para log de requisições
const requestLogger = (req, res, next) => {
    global.currentRequest = req;
    
    // Detectar possíveis tentativas de SQL Injection
    const sqlInjectionPatterns = [
        /'.*OR.*'/, /UNION.*SELECT/, /DROP\s+TABLE/, /INSERT\s+INTO/,
        /DELETE\s+FROM/, /UPDATE.*SET/, /--/, /#/, /\/\*.*\*\//
    ];

    const queryParams = JSON.stringify(req.query);
    const bodyParams = JSON.stringify(req.body);
    
    sqlInjectionPatterns.forEach(pattern => {
        if (pattern.test(queryParams) || pattern.test(bodyParams)) {
            logger.warn('Possível tentativa de SQL Injection detectada', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                query: req.query,
                body: req.body,
                userAgent: req.headers['user-agent']
            });
        }
    });

    next();
};

module.exports = {
    logger,
    requestLogger
};
