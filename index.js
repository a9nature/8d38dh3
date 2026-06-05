const express = require('express');
const cors = require('cors');

const app = express();

// Ativa a liberação do CORS para acabar com o "Failed to fetch"
app.use(cors());

// Permite que o servidor entenda requisições com formato JSON automaticamente
app.use(express.json());

// Permite que o servidor encontre e abra o seu arquivo HTML do front-end
app.use(express.static(__dirname));

// CARREGA AS SUAS 10 MAINKEYS DO NOVO SISTEMA DO DUCK.AI
const DUK_KEYS = [
  process.env.DUCK_KEY_1, process.env.DUCK_KEY_2, process.env.DUCK_KEY_3,
  process.env.DUCK_KEY_4, process.env.DUCK_KEY_5, process.env.DUCK_KEY_6,
  process.env.DUCK_KEY_7, process.env.DUCK_KEY_8, process.env.DUCK_KEY_9,
  process.env.DUCK_KEY_10
].filter(Boolean); 

// ROTA DO SEU FRONT-END CONECTADA AO EXPRESS
app.post('/duckchat/v1/chat', async (req, res) => {
  try {
    // O Express já tratou o JSON e guardou no req.body
    const parsedBody = req.body;

    // Verifica se as chaves foram configuradas no Render
    if (DUK_KEYS.length === 0) {
      throw new Error('Nenhuma DUCK_KEY foi configurada nas variáveis de ambiente.');
    }

    // Sistema de rotação aleatória de chaves
    const randomIndex = Math.floor(Math.random() * DUK_KEYS.length);
    const selectedKey = DUK_KEYS[randomIndex];
    
    console.log(`[LOG] Rotação: Usando chave na posição ${randomIndex + 1}`);

    // Faz o envio seguro ocultando as chaves do Front-end
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

    // Se o Duck responder com erro
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resposta do Duck.ai: ${response.status} - ${errorText}`);
    }

    // Devolve os dados recebidos do Duck direto para o seu Front-end
    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error(`[ERRO] ${error.message}`);
    res.status(500).json({ error: 'Erro no proxy', details: error.message });
  }
});

// Resposta amigável caso alguém tente entrar na rota da API via navegador (GET)
app.get('/duckchat/v1/chat', (req, res) => {
  res.status(405).send('Use requisições do tipo POST para interagir com o chat.');
});

// Configuração correta da porta para o ambiente do Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gerenciador Duck.ai rodando perfeitamente na porta ${PORT}`);
});
