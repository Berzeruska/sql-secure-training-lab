// frontend/app.js
const app = {
    API_BASE: '',

    init: function() {
        this.loadStats();
        this.loadDatabaseTables();
        this.loadPayloads();
        this.renderChecklist();
        this.renderQuiz();
    },

    // Navegação principal
    showMainTab: function(tab) {
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        document.getElementById('page-' + tab).style.display = 'block';
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        window.scrollTo(0, 0);
        if (tab === 'lab') this.loadDatabaseTables();
    },

    // Sub-abas do laboratório
    switchLabTab: function(btn, panelId) {
        const parent = btn.closest('.tabs-container');
        parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(panelId).classList.add('active');
    },

    // Sub-abas da defesa
    switchDefesaTab: function(btn, panelId) {
        const parent = btn.closest('.tabs-container');
        parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(panelId).classList.add('active');
    },

    // Accordion
    toggleAcc: function(header) {
        header.closest('.acc-item').classList.toggle('open');
    },

    // ========== FUNÇÕES DE LOGIN ==========
    vulnLogin: async function() {
        const user = document.getElementById('vuln-user').value;
        const pass = document.getElementById('vuln-pass').value;
        const resultDiv = document.getElementById('vuln-result');
        const queryDiv = document.getElementById('query-log');

        if (!user) {
            this.showResult('vuln-result', 'warn', 'Digite um usuário');
            return;
        }

        try {
            const response = await fetch('/api/vulnerable/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });

            const data = await response.json();
            
            if (data.query && queryDiv) {
                queryDiv.innerHTML = `<span class="term-warn">🔴 Query vulnerável executada:</span><br><br>${data.query}`;
            }

            if (data.success) {
                this.showResult('vuln-result', 'danger', 
                    `🔓 INJEÇÃO BEM-SUCEDIDA!<br>Logado como: <strong>${data.user.username}</strong> (${data.user.role})<br><br>Dados: ${JSON.stringify(data.user)}`);
                document.getElementById('vuln-user').classList.add('danger-input');
            } else {
                this.showResult('vuln-result', 'warn', data.message || 'Credenciais inválidas');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showResult('vuln-result', 'danger', 'Erro de conexão com o servidor');
        }
    },

    secureLogin: async function() {
        const user = document.getElementById('secure-user').value;
        const pass = document.getElementById('secure-pass').value;
        const resultDiv = document.getElementById('secure-result');

        if (!user || !pass) {
            this.showResult('secure-result', 'warn', 'Preencha usuário e senha');
            return;
        }

        try {
            const response = await fetch('/api/secure/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });

            const data = await response.json();

            if (data.success) {
                this.showResult('secure-result', 'success', 
                    `✅ Login seguro realizado!<br>Bem-vindo, ${data.user.username}`);
            } else {
                this.showResult('secure-result', 'warn', data.message);
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showResult('secure-result', 'danger', 'Erro de conexão com o servidor');
        }
    },

    setPayload: function(user, pass) {
        document.getElementById('vuln-user').value = user;
        document.getElementById('vuln-pass').value = pass;
    },

    // ========== UNION ATTACK ==========
    unionSearch: async function() {
        const term = document.getElementById('union-search').value;
        const resultDiv = document.getElementById('union-result');
        const dataDiv = document.getElementById('union-data');

        if (!term) {
            this.showResult('union-result', 'warn', 'Digite um termo para busca');
            return;
        }

        try {
            const response = await fetch(`/api/vulnerable/products?search=${encodeURIComponent(term)}`);
            const data = await response.json();

            if (data.query) {
                resultDiv.className = 'result-box show result-info';
                resultDiv.innerHTML = `<strong>Query executada:</strong><br><code>${data.query}</code>`;
            }

            if (term.toLowerCase().includes('union')) {
                if (data.products && data.products.length > 0) {
                    let html = '<strong>🔓 DADOS EXTRAÍDOS VIA UNION:</strong><br><br>';
                    data.products.forEach(p => {
                        if (p.username) {
                            html += `👤 ${p.username} | ${p.password || '****'} | ${p.email || ''}<br>`;
                        } else {
                            html += `📦 ${p.name} - R$ ${p.price}<br>`;
                        }
                    });
                    dataDiv.innerHTML = html;
                }
            } else if (data.products) {
                if (data.products.length > 0) {
                    let html = '<strong>📦 Produtos encontrados:</strong><br><br>';
                    data.products.forEach(p => {
                        html += `• ${p.name} - R$ ${p.price}<br>  ${p.description || ''}<br><br>`;
                    });
                    dataDiv.innerHTML = html;
                } else {
                    dataDiv.innerHTML = 'Nenhum produto encontrado';
                }
            }

            this.showResult('union-result', data.error ? 'danger' : 'success', 
                data.error || `${data.count || 0} resultado(s)`);
        } catch (error) {
            console.error('Erro:', error);
            this.showResult('union-result', 'danger', 'Erro de conexão');
        }
    },

    setUnionPayload: function(payload) {
        document.getElementById('union-search').value = payload;
        this.unionSearch();
    },

    // ========== BLIND SQLi ==========
    blindTest: async function() {
        const id = document.getElementById('blind-id').value;
        const resultDiv = document.getElementById('blind-result');

        try {
            const startTime = Date.now();
            const response = await fetch(`/api/vulnerable/user-data?id=${encodeURIComponent(id)}`);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const data = await response.json();

            let message = '';
            if (responseTime > 2000) {
                message += `⏱ Tempo de resposta: ${responseTime}ms (POSSÍVEL TIME-BASED!)\n`;
            }

            if (data.error) {
                message += `❌ Erro: ${data.error}`;
                this.showResult('blind-result', 'warn', message);
            } else if (data.data && data.data.length > 0) {
                message += `✅ Dados retornados (TRUE)`;
                this.showResult('blind-result', 'success', message);
            } else {
                message += `❌ Nenhum dado retornado (FALSE)`;
                this.showResult('blind-result', 'info', message);
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showResult('blind-result', 'danger', 'Erro de conexão');
        }
    },

    setBlindPayload: function(payload) {
        document.getElementById('blind-id').value = payload;
        this.blindTest();
    },

    // ========== ERROR-BASED (CORRIGIDO) ==========
    errorSearch: async function() {
        const id = document.getElementById('error-id').value;
        const resultDiv = document.getElementById('error-result');

        try {
            const response = await fetch(`/api/vulnerable/user-data?id=${encodeURIComponent(id)}`);
            const data = await response.json();

            if (data.error) {
                this.showResult('error-result', 'danger', 
                    `💥 ERRO SQL EXPOSTO!<br><br>${data.error}`);
            } else if (data.data && data.data.length > 0) {
                this.showResult('error-result', 'success', 
                    `✅ Usuário encontrado: ${data.data[0].username}`);
            } else {
                this.showResult('error-result', 'info', 'Nenhum erro, usuário não encontrado');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showResult('error-result', 'danger', 'Erro de conexão');
        }
    },

    setErrorPayload: function(payload) {
        document.getElementById('error-id').value = payload;
        this.errorSearch();
    },

    // ========== ESTATÍSTICAS ==========
    loadStats: async function() {
        try {
            const response = await fetch('/admin/stats');
            const data = await response.json();

            document.getElementById('stat-users').textContent = data.users || 0;
            document.getElementById('stat-products').textContent = data.products || 0;
            
            if (data.recent_attempts && data.recent_attempts.length > 0) {
                const total = data.recent_attempts.reduce((acc, day) => acc + day.total_attempts, 0);
                const success = data.recent_attempts.reduce((acc, day) => acc + day.successful_logins, 0);
                const rate = total > 0 ? Math.round((success / total) * 100) : 0;
                document.getElementById('stat-attempts').textContent = total;
                document.getElementById('stat-success').textContent = rate + '%';
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    },

    // ========== DADOS DO BANCO ==========
    loadDatabaseTables: async function() {
        try {
            const usersResponse = await fetch('/api/secure/users');
            const usersData = await usersResponse.json();
            
            if (usersData.users) {
                let html = '';
                usersData.users.forEach(u => {
                    html += `<tr>
                        <td>${u.id}</td>
                        <td>${u.username}</td>
                        <td>${u.email || '-'}</td>
                        <td><span class="${u.role === 'admin' ? 'tag-admin' : 'tag-user'}">${u.role}</span></td>
                    </tr>`;
                });
                document.getElementById('users-tbody').innerHTML = html;
            }

            const productsResponse = await fetch('/api/secure/products');
            const productsData = await productsResponse.json();
            
            if (productsData.products) {
                let html = '';
                productsData.products.forEach(p => {
                    html += `<tr>
                        <td>${p.id}</td>
                        <td>${p.name}</td>
                        <td>R$ ${p.price}</td>
                    </tr>`;
                });
                document.getElementById('products-tbody').innerHTML = html;
            }
        } catch (error) {
            console.error('Erro ao carregar dados do banco:', error);
        }
    },

    // ========== PAYLOADS TABLE ==========
    loadPayloads: function() {
        const payloads = [
            { type: 'Auth Bypass', class: 'label-danger', payload: "' OR '1'='1' --", goal: 'Login sem senha', tab: 'bypass' },
            { type: 'Auth Bypass', class: 'label-danger', payload: "admin'#", goal: 'Ignorar senha (MySQL)', tab: 'bypass' },
            { type: 'Auth Bypass', class: 'label-danger', payload: "' OR 1=1 LIMIT 1 --", goal: 'Primeiro usuário', tab: 'bypass' },
            { type: 'UNION', class: 'label-warn', payload: "' ORDER BY 3--", goal: 'Descobrir colunas', tab: 'union' },
            { type: 'UNION', class: 'label-warn', payload: "' UNION SELECT 1,username,password FROM users--", goal: 'Extrair credenciais', tab: 'union' },
            { type: 'UNION', class: 'label-warn', payload: "' UNION SELECT 1,@@version,database()--", goal: 'Versão do DB', tab: 'union' },
            { type: 'Blind', class: 'label-purple', payload: "1 AND 1=1", goal: 'Teste TRUE', tab: 'blind' },
            { type: 'Blind', class: 'label-purple', payload: "1 AND 1=2", goal: 'Teste FALSE', tab: 'blind' },
            { type: 'Blind', class: 'label-purple', payload: "1 AND (SELECT COUNT(*) FROM users) > 0", goal: 'Verificar users', tab: 'blind' },
            { type: 'Error', class: 'label-info', payload: "1 AND extractvalue(1,concat(0x7e,(SELECT version())))--", goal: 'Extrair versão', tab: 'error' },
        ];

        const tbody = document.getElementById('payload-tbody');
        if (!tbody) return;

        let html = '';
        payloads.forEach(p => {
            html += `<tr>
                <td><span class="label ${p.class}">${p.type}</span></td>
                <td><code class="payload-code">${p.payload}</code></td>
                <td>${p.goal}</td>
                <td><button class="try-btn" onclick="app.tryPayload('${p.tab}','${p.payload.replace(/'/g, "\\'")}')">Testar</button></td>
            </tr>`;
        });
        tbody.innerHTML = html;
    },

    tryPayload: function(tab, payload) {
        this.showMainTab('lab');
        setTimeout(() => {
            const tabMap = { bypass: 'tab-bypass', union: 'tab-union', blind: 'tab-blind', error: 'tab-error' };
            const panelId = tabMap[tab];
            
            const tabs = document.querySelectorAll('#page-lab .tab');
            tabs.forEach((t, index) => {
                if ((tab === 'bypass' && index === 0) ||
                    (tab === 'union' && index === 1) ||
                    (tab === 'blind' && index === 2) ||
                    (tab === 'error' && index === 3)) {
                    t.click();
                }
            });

            if (tab === 'bypass') {
                document.getElementById('vuln-user').value = payload;
            } else if (tab === 'union') {
                document.getElementById('union-search').value = payload;
                this.unionSearch();
            } else if (tab === 'blind') {
                document.getElementById('blind-id').value = payload;
                this.blindTest();
            } else if (tab === 'error') {
                document.getElementById('error-id').value = payload;
                this.errorSearch();
            }
        }, 100);
    },

    // ========== CHECKLIST ==========
    checklistItems: [
        { cat:'Queries', text:'Usar prepared statements em TODAS as queries SQL', critical:true },
        { cat:'Queries', text:'Nunca concatenar variáveis diretamente em queries', critical:true },
        { cat:'Queries', text:'Considerar uso de ORM (Sequelize, Prisma, Hibernate)', critical:false },
        { cat:'Autenticação', text:'Armazenar senhas com bcrypt ou Argon2 (nunca MD5/SHA1)', critical:true },
        { cat:'Autenticação', text:'Implementar rate limiting no login', critical:false },
        { cat:'Autenticação', text:'Usar autenticação de dois fatores (2FA)', critical:false },
        { cat:'Validação', text:'Validar tipo e formato de todas as entradas', critical:true },
        { cat:'Validação', text:'Usar whitelist de caracteres para campos com formato conhecido', critical:false },
        { cat:'Erros', text:'Nunca exibir mensagens de erro SQL ao usuário final', critical:true },
        { cat:'Erros', text:'Usar logs internos para erros, mensagens genéricas para usuário', critical:true },
        { cat:'Privilégios', text:'Usar princípio do mínimo privilégio para usuário do banco', critical:true },
        { cat:'Infraestrutura', text:'Manter banco de dados e dependências atualizados', critical:false },
        { cat:'Infraestrutura', text:'Configurar WAF como camada adicional', critical:false },
        { cat:'Testes', text:'Executar testes de segurança (OWASP ZAP, SQLMap em staging)', critical:false },
    ],

    renderChecklist: function() {
        const container = document.getElementById('checklist-container');
        if (!container) return;
        const cats = [...new Set(this.checklistItems.map(i => i.cat))];
        let html = '';
        cats.forEach(cat => {
            html += `<div style="margin-bottom:20px"><div style="font-size:12px;font-weight:600;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">${cat}</div>`;
            this.checklistItems.filter(i => i.cat === cat).forEach((item, idx) => {
                const id = 'chk-' + this.checklistItems.indexOf(item);
                html += `<label for="${id}" style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px;cursor:pointer;transition:background 0.15s" onmouseenter="this.style.background='var(--surface)'" onmouseleave="this.style.background='var(--bg3)'">
                    <input type="checkbox" id="${id}" onchange="app.updateChecklist()" style="margin-top:2px;accent-color:var(--accent)">
                    <span style="font-size:13px;line-height:1.5">${item.text}${item.critical ? ' <span class="label label-danger" style="font-size:10px;vertical-align:middle">Crítico</span>' : ''}</span>
                </label>`;
            });
            html += '</div>';
        });
        container.innerHTML = html;
        this.updateChecklist();
    },

    updateChecklist: function() {
        const total = this.checklistItems.length;
        const checked = document.querySelectorAll('[id^="chk-"]:checked').length;
        const pct = Math.round(checked / total * 100);
        document.getElementById('checklist-score').textContent = `${checked}/${total} itens`;
        document.getElementById('checklist-pct').textContent = pct + '%';
        document.getElementById('checklist-progress').style.width = pct + '%';
    },

    // ========== QUIZ ==========
    quizQuestions: [
        { q: 'Qual é a defesa mais eficaz contra SQL Injection?', opts: ['Escapar caracteres especiais', 'Usar prepared statements', 'Usar um WAF', 'Validar o tamanho do input'], correct: 1, exp: 'Prepared statements separam código SQL dos dados.' },
        { q: 'O que o payload `\' OR \'1\'=\'1\' --` faz em uma query de login?', opts: ['Cria um novo usuário', 'Causa um erro', 'Faz o login sem senha', 'Exclui usuários'], correct: 2, exp: 'A condição OR \'1\'=\'1\' é sempre verdadeira.' },
        { q: 'Qual tipo de SQLi funciona mesmo quando a aplicação não exibe resultados?', opts: ['Error-Based', 'UNION-Based', 'Blind SQLi', 'Stacked Queries'], correct: 2, exp: 'Blind SQLi infere informações via comportamento.' },
        { q: 'Por que senhas devem ser armazenadas com bcrypt?', opts: ['É mais rápido que MD5', 'É reversível', 'Inclui salt e é lento', 'É padrão SQL'], correct: 2, exp: 'bcrypt gera hash com salt e é deliberadamente lento.' },
        { q: 'O que é UNION-Based SQL Injection?', opts: ['Un ataque que une senhas', 'Usar UNION para combinar queries', 'Unir múltiplos servidores', 'Criar um segundo banco'], correct: 1, exp: 'UNION permite extrair dados de outras tabelas.' },
        { q: 'Qual é o problema com exibir erros SQL ao usuário?', opts: ['Deixa a aplicação lenta', 'Revela estrutura do banco', 'Viola a LGPD', 'Consome memória'], correct: 1, exp: 'Mensagens de erro revelam informações valiosas.' },
        { q: 'O que é o princípio do mínimo privilégio?', opts: ['Usar senha simples', 'Permissões mínimas', 'Nunca criar admins', 'Compartilhar senhas'], correct: 1, exp: 'Limita o dano caso haja injeção.' },
        { q: 'Qual ferramenta automatiza ataques SQLi?', opts: ['Burp Suite', 'SQLMap', 'Metasploit', 'Nmap'], correct: 1, exp: 'SQLMap é especializada em SQLi.' },
        { q: 'Por que um WAF não é suficiente como única defesa?', opts: ['É caro', 'Pode ser bypassado', 'Não funciona com HTTPS', 'Bloqueia tudo'], correct: 1, exp: 'Atacantes conseguem bypassar WAFs.' },
        { q: 'No Node.js com mysql2, qual a forma CORRETA de usar prepared statements?', opts: ['db.query(`SELECT * FROM users WHERE id=${id}`)', 'db.query("SELECT ... WHERE id=?", [id])', 'db.query("SELECT ... WHERE id=" + id)', 'db.query("SELECT ... WHERE id=\\"" + id + "\\"")'], correct: 1, exp: 'Usa placeholder ? e passa dados separadamente.' },
    ],

    quizState: { current: 0, score: 0, answered: [] },

    renderQuiz: function() {
        this.quizState = { current: 0, score: 0, answered: Array(this.quizQuestions.length).fill(null) };
        const container = document.getElementById('quiz-container');
        document.getElementById('quiz-summary').style.display = 'none';
        container.style.display = 'block';
        this.showQuestion(0);
    },

    showQuestion: function(idx) {
        const q = this.quizQuestions[idx];
        const container = document.getElementById('quiz-container');
        container.innerHTML = `
            <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
                <span style="font-size:13px;color:var(--text3);font-family:var(--mono)">Questão ${idx+1} de ${this.quizQuestions.length}</span>
                <span style="font-size:13px;color:var(--accent);font-family:var(--mono)">Pontos: ${this.quizState.score}</span>
            </div>
            <div class="progress-bar" style="margin-bottom:24px"><div class="progress-fill" style="width:${(idx/this.quizQuestions.length)*100}%"></div></div>
            <div class="card">
                <div class="card-body">
                    <div style="font-size:16px;font-weight:600;margin-bottom:20px;line-height:1.5">${q.q}</div>
                    <div class="quiz-opts">
                        ${q.opts.map((opt, i) => `<div class="quiz-opt" onclick="app.answerQuiz(${idx}, ${i}, this)">${opt}</div>`).join('')}
                    </div>
                    <div id="qfeedback" class="quiz-feedback"></div>
                </div>
            </div>
        `;
    },

    answerQuiz: function(qIdx, optIdx, el) {
        if (this.quizState.answered[qIdx] !== null) return;
        this.quizState.answered[qIdx] = optIdx;
        const q = this.quizQuestions[qIdx];
        const opts = document.querySelectorAll('.quiz-opt');
        opts.forEach(o => o.style.pointerEvents = 'none');
        const fb = document.getElementById('qfeedback');

        if (optIdx === q.correct) {
            el.classList.add('correct');
            this.quizState.score++;
            fb.className = 'quiz-feedback show result-success';
            fb.innerHTML = `✅ Correto! ${q.exp}`;
        } else {
            el.classList.add('wrong');
            opts[q.correct].classList.add('correct');
            fb.className = 'quiz-feedback show result-danger';
            fb.innerHTML = `❌ Incorreto. ${q.exp}`;
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn-primary';
        nextBtn.style.marginTop = '16px';
        nextBtn.textContent = qIdx < this.quizQuestions.length - 1 ? 'Próxima →' : 'Ver resultado';
        nextBtn.onclick = () => {
            if (qIdx < this.quizQuestions.length - 1) {
                this.showQuestion(qIdx + 1);
            } else {
                this.showQuizSummary();
            }
        };
        fb.appendChild(nextBtn);
    },

    showQuizSummary: function() {
        document.getElementById('quiz-container').style.display = 'none';
        const summary = document.getElementById('quiz-summary');
        summary.style.display = 'block';
        const pct = Math.round(this.quizState.score / this.quizQuestions.length * 100);
        const emojis = ['😬', '😐', '🤔', '😊', '🎉', '🏆'];
        const emoji = emojis[Math.min(Math.floor(pct / 20), 5)];
        const messages = ['Continue estudando!', 'Bom começo!', 'No caminho certo!', 'Bom trabalho!', 'Excelente!', 'Especialista!'];
        const msgIdx = Math.min(Math.floor(pct / 20), 5);
        document.getElementById('quiz-emoji').textContent = emoji;
        document.getElementById('quiz-final-score').textContent = `${this.quizState.score}/${this.quizQuestions.length} pontos`;
        document.getElementById('quiz-message').textContent = `${pct}% — ${messages[msgIdx]}`;
        document.getElementById('quiz-progress-bar').style.width = pct + '%';
    },

    resetQuiz: function() {
        this.renderQuiz();
    },

    showResult: function(elementId, type, message) {
        const div = document.getElementById(elementId);
        if (!div) return;
        div.className = `result-box show result-${type}`;
        div.innerHTML = message;
    }
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});

window.app = app;