# 四模型回复对比网页

一个简单的网页工具：你输入一条 instruction，页面会并列展示 4 个模型的回复：

- ChatGPT 5.2
- Gemini 3
- 豆包（免费版最强）
- DeepSeek R1

## 快速开始

```bash
npm install
cp .env.example .env
npm start
```

打开 `http://localhost:3000`。

## 配置说明

在 `.env` 中填写对应平台 API Key：

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `DOUBAO_API_KEY`
- `DEEPSEEK_API_KEY`

可按需修改模型 ID（`*_MODEL`）和部分 Base URL。

## 说明

- 该项目主要用于快速对比，默认温度参数较保守。
- 如果某个 key 未配置，对应卡片会显示未配置提示。
- 具体模型可用性以各厂商 API 实际支持为准。
