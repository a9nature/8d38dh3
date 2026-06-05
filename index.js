const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DUK_KEYS = [
  process.env.DUCK_KEY_1, process.env.DUCK_KEY_2, process.env.DUCK_KEY_3,
  process.env.DUCK_KEY_4, process.env.DUCK_KEY_5, process.env.DUCK_KEY_6,
  process.env.DUCK_KEY_7, process.env.DUCK_KEY_8, process.env.DUCK_KEY_9,
  process.env.DUCK_KEY_10
].filter(Boolean); 

app.post('/duckchat/v1/chat', async (req, res) => {
  try {
    const parsedBody = req.body;

    if (DUK_KEYS.length === 0) {
      throw new Error('Nenhuma DUCK_KEY foi configurada nas variáveis de ambiente.');
    }

    const randomIndex = Math.floor(Math.random() * DUK_KEYS.length);
    const selectedKey = DUK_KEYS[randomIndex];
    
    const modeloFinal = parsedBody.model || 'gpt-4o-mini';
    console.log(`[LOG] Rotação: Usando chave ${randomIndex + 1} para o modelo: ${modeloFinal}`);

    // Faz o envio com cabeçalhos completos de simulação de navegador anti-block
    const response = await fetch('https://duck.ai/duckchat/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Authorization': `Bearer ${selectedKey}`,
        'Origin': 'https://duck.ai',
        'Referer': 'https://duck.ai/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        model: modeloFinal,
        messages: parsedBody.messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resposta do Duck.ai: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error(`[ERRO] ${error.message}`);
    res.status(500).json({ error: 'Erro no proxy', details: error.message });
  }
});

app.get('/duckchat/v1/chat', (req, res) => {
  res.status(405).send('Use requisições do tipo POST para interagir com o chat.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gerenciador Duck.ai Multi-Modelo rodando na porta ${PORT}`);
});
