# SQL Secure Training Lab

Laboratório educacional interativo para aprendizado de SQL Injection (SQLi) e técnicas de defesa.  
O projeto simula ambientes vulneráveis e seguros, com banco de dados real e logging de todas as operações.

![Preview](https://via.placeholder.com/800x400?text=SQL+Secure+Training+Lab+Preview)

## 🧠 Objetivo

Este projeto foi desenvolvido com fins **exclusivamente educacionais**. Ele permite que estudantes e profissionais de segurança entendam na prática como ataques de SQL Injection funcionam e como preveni-los utilizando prepared statements, ORM, validação de entrada, WAF e outras boas práticas.

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express, MySQL2
- **Banco de Dados:** MySQL / MariaDB
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Logging:** Winston (com rotação de logs)
- **Estilização:** CSS customizado com temas cyberpunk e fontes JetBrains Mono / Space Grotesk

## 📦 Funcionalidades

- ✅ Autenticação vulnerável vs segura (login com SQLi)
- ✅ UNION‑based attack (extração de dados de outras tabelas)
- ✅ Blind SQL Injection (boolean‑based e time‑based)
- ✅ Error‑based SQL Injection
- ✅ Biblioteca de payloads pré‑definidos para testes
- ✅ Visualização dos dados do banco (usuários e produtos)
- ✅ Seção de defesas com exemplos de código em várias linguagens
- ✅ Quiz interativo sobre SQL Injection e segurança
- ✅ Checklist de boas práticas de segurança
- ✅ Logs completos de todas as queries executadas (em arquivo e console)

## 🚀 Como Executar o Projeto

### Pré‑requisitos

- Node.js (v16 ou superior)
- MySQL / MariaDB instalado e rodando
- Git (opcional)

### Passo a passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/sql-secure-training-lab.git
   cd sql-secure-training-lab
2. **instale depências**
   bash
      npm install
3. **Configure o banco de dados**

Crie um arquivo .env na raiz do projeto com o seguinte conteúdo (ajuste usuário/senha conforme sua instalação):
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=training_lab
PORT=3000
NODE_ENV=development
4. **Inicialize o banco de dados e crie o usuário de treinamento**
   bash
     npm run init-db
     **Será solicitada a senha do root do MySQL. O script criará:**

    Banco training_lab

    Usuário training_user (senha: 123456) – você pode alterar a senha editando o arquivo backend/database.js se desejar.

    Tabelas users, products e login_attempts

    Dados iniciais (5 usuários e 5 produtos)
5. **inicie o servidor**
    bash
     npm start
6. **Acesse no navegador**
   http://localhost:3000

    **🧪 Como Usar o Laboratório**

  Navegue pelas abas: Laboratório, Defesa, Quiz.
    
  Na aba Laboratório, escolha o tipo de ataque (Auth Bypass, UNION, Blind, Error‑based).
   
  Insira os payloads sugeridos ou crie os seus.
  
  Observe os resultados e as queries geradas.

  Na aba Defesa, estude as técnicas e marque o checklist de segurança.

   No Quiz, teste seus conhecimentos.
