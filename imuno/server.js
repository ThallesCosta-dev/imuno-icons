import express from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received request:', JSON.stringify(req.body, null, 2));
    const { messages, model = 'deepseek/deepseek-chat-v3.1:free', apiKey } = req.body;

    if (!apiKey) {
      console.error('API key not provided');
      return res.status(400).json({ error: 'API key not configured' });
    }

    console.log('Forwarding request to OpenRouter');
    console.log('Model:', model);
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');

    const payload = JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const requestOptions = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'HTTP-Referer': 'https://imuno-icons.com',
        'X-Title': 'BioFlow',
      },
    };

    const forwardResponse = await new Promise((resolve, reject) => {
      const reqForward = https.request(requestOptions, (resp) => {
        let dataStr = '';
        console.log('OpenRouter response headers:', resp.headers);
        resp.on('data', (chunk) => { 
          dataStr += chunk;
          console.log('Received chunk:', chunk.length, 'bytes');
        });
        resp.on('end', () => {
          console.log('OpenRouter response complete. Status:', resp.statusCode);
          console.log('Response body length:', dataStr.length);
          try {
            const json = dataStr ? JSON.parse(dataStr) : {};
            resolve({ status: resp.statusCode || 500, ok: (resp.statusCode || 500) >= 200 && (resp.statusCode || 500) < 300, body: json });
          } catch (e) {
            console.error('JSON parse error:', e.message);
            console.error('Raw response:', dataStr.substring(0, 500));
            resolve({ status: resp.statusCode || 500, ok: false, body: { error: { message: dataStr || 'Invalid JSON from OpenRouter' } } });
          }
        });
      });
      reqForward.on('error', (err) => {
        console.error('HTTPS request error:', err);
        reject(err);
      });
      reqForward.write(payload);
      reqForward.end();
    });

    console.log('OpenRouter response status:', forwardResponse.status);

    if (!forwardResponse.ok) {
      console.error('OpenRouter error:', forwardResponse.body);
      return res.status(forwardResponse.status).json(forwardResponse.body);
    }

    res.json(forwardResponse.body);
  } catch (error) {
    console.error('API Proxy Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
