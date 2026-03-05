const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const MODEL_CONFIG = [
  {
    key: 'chatgpt52',
    title: 'ChatGPT 5.2',
    provider: 'openai',
    model: process.env.OPENAI_MODEL || 'gpt-5',
  },
  {
    key: 'gemini3',
    title: 'Gemini 3',
    provider: 'gemini',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
  },
  {
    key: 'doubao',
    title: '豆包（免费版最强）',
    provider: 'doubao',
    model: process.env.DOUBAO_MODEL || 'doubao-seed-1-6-250615',
  },
  {
    key: 'deepseekr1',
    title: 'DeepSeek R1',
    provider: 'deepseek',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-reasoner',
  },
];

async function callOpenAI(instruction, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return '未配置 OPENAI_API_KEY';
  }

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: instruction,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI 请求失败: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.output_text || '(无输出)';
}

async function callGemini(instruction, model) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return '未配置 GEMINI_API_KEY';
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: instruction }] }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini 请求失败: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') || '(无输出)';
}

async function callArk(instruction, providerModel, baseUrl, apiKeyEnv, providerLabel) {
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) {
    return `未配置 ${apiKeyEnv}`;
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: providerModel,
      messages: [{ role: 'user', content: instruction }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${providerLabel} 请求失败: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '(无输出)';
}

async function callModel(cfg, instruction) {
  switch (cfg.provider) {
    case 'openai':
      return callOpenAI(instruction, cfg.model);
    case 'gemini':
      return callGemini(instruction, cfg.model);
    case 'doubao':
      return callArk(
        instruction,
        cfg.model,
        process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
        'DOUBAO_API_KEY',
        '豆包'
      );
    case 'deepseek':
      return callArk(
        instruction,
        cfg.model,
        process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        'DEEPSEEK_API_KEY',
        'DeepSeek'
      );
    default:
      return '未知模型提供商';
  }
}

app.post('/api/compare', async (req, res) => {
  const instruction = (req.body?.instruction || '').trim();
  if (!instruction) {
    return res.status(400).json({ error: 'instruction 不能为空' });
  }

  const tasks = MODEL_CONFIG.map(async (cfg) => {
    try {
      const output = await callModel(cfg, instruction);
      return { key: cfg.key, title: cfg.title, output, error: null };
    } catch (error) {
      return {
        key: cfg.key,
        title: cfg.title,
        output: '',
        error: error.message || '调用失败',
      };
    }
  });

  const results = await Promise.all(tasks);
  return res.json({ results });
});

app.get('/api/models', (_req, res) => {
  res.json({
    models: MODEL_CONFIG.map((m) => ({ key: m.key, title: m.title })),
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
