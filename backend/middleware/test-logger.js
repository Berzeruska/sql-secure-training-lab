const logger = require('./logger');
console.log('Conteúdo do logger:', Object.keys(logger));
console.log('requestLogger é função?', typeof logger.requestLogger === 'function');
if (typeof logger.requestLogger === 'function') {
  console.log('OK - é função');
} else {
  console.log('ERRO - não é função, valor:', logger.requestLogger);
}
