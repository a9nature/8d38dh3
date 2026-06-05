const http = require('http');

// 1. CARREGA AS SUAS 10 MAINKEYS DO NOVO SISTEMA DO DUCK.AI
const DUCK_KEYS = [
  process.env.DUCK_KEY_1, process.env.DUCK_KEY_2, process.env.DUCK_KEY_3,
  process.env.DUCK_KEY_4, process.env.DUCK_KEY_5, process.env.DUCK_KEY_6,
  process.env.DUCK_KEY_7, process.env.DUCK_KEY_8, process.env.DUCK_KEY_9,
  process.env.DUCK_KEY_10
].filter(Boolean); 

const PORT = process.env.PORT || 3000;
// ... o resto do código continua igual abaixo

const server = http.createServer((req, res) => {
  // Libera o acesso para o seu LobeChat (CORS) para evitar erros de segurança
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Rota padrão exigida pelo LobeChat
  if (req.url === '/v1/chat/completions' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const parsedBody = JSON.parse(body);

        if (DUCK_KEYS.length === 0) {
          throw new Error('Nenhuma DUCK_KEY foi configurada nas variáveis de ambiente da Zeabur.');
        }

        // --- ROTAÇÃO DAS CHAVES ---
        // Sorteia um índice de 0 até o total de chaves cadastradas
        const randomIndex = Math.floor(Math.random() * DUCK_KEYS.length);
        const selectedKey = DUCK_KEYS[randomIndex];
        
        console.log(`[LOG] Rotação: Enviando requisição usando a Chave de Posição ${randomIndex + 1}`);

        // Faz a requisição para a API simulando o ecossistema do Duck.ai atualizado
        const response = await fetch('https://duck.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${selectedKey}`, // Envia a mainKey correspondente no Bearer Token
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({
            model: parsedBody.model || 'claude-3-haiku', // Usa o modelo enviado pelo LobeChat ou Haiku como padrão
            messages: parsedBody.messages,
            stream: false
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Resposta inválida do Duck.ai: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Retorna a resposta limpa e formatada para o LobeChat
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));

      } catch (error) {
        console.error(`[ERRO] ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro no servidor de rotação', details: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Use a rota /v1/chat/completions por método POST');
  }
});

server.listen(PORT, () => {
  console.log(`Gerenciador Duck.ai Atualizado rodando na porta ${PORT}`);
});
