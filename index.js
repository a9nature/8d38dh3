const http = require('http');

// 1. CARREGA AS SUAS 10 MAINKEYS DO NOVO SISTEMA DO DUCK.AI
const DUCK_KEYS = [
  process.env.DUCK_KEY_1, process.env.DUCK_KEY_2, process.env.DUCK_KEY_3,
  process.env.DUCK_KEY_4, process.env.DUCK_KEY_5, process.env.DUCK_KEY_6,
  process.env.DUCK_KEY_7, process.env.DUCK_KEY_8, process.env.DUCK_KEY_9,
  process.env.DUCK_KEY_10
].filter(Boolean); 

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/duckchat/v1/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const parsedBody = JSON.parse(body);

        if (DUCK_KEYS.length === 0) {
          throw new Error('Nenhuma DUCK_KEY foi configurada nas variáveis de ambiente.');
        }

        const randomIndex = Math.floor(Math.random() * DUCK_KEYS.length);
        const selectedKey = DUCK_KEYS[randomIndex];
        
        console.log(`[LOG] Rotação: Usando chave na posição ${randomIndex + 1}`);

        const response = await fetch('https://duck.ai/duckchat/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${selectedKey}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: JSON.stringify({
            model: parsedBody.model || 'claude-3-haiku',
            messages: parsedBody.messages,
            stream: false
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Resposta do Duck.ai: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));

      } catch (error) {
        console.error(`[ERRO] ${error.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro no proxy', details: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Use a rota /duckchat/v1/chat');
  }
});

server.listen(PORT, () => {
  console.log(`Gerenciador Duck.ai Atualizado rodando na porta ${PORT}`);
});
