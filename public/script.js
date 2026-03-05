const resultEl = document.getElementById('results');
const form = document.getElementById('prompt-form');
const submitBtn = document.getElementById('submit-btn');

const modelTitles = ['ChatGPT 5.2', 'Gemini 3', '豆包（免费版最强）', 'DeepSeek R1'];

function renderLoading() {
  resultEl.innerHTML = modelTitles
    .map(
      (title) => `
      <article class="card">
        <h2>${title}</h2>
        <div class="content loading">正在请求...</div>
      </article>
    `
    )
    .join('');
}

function renderResults(results) {
  resultEl.innerHTML = results
    .map(
      (item) => `
      <article class="card">
        <h2>${item.title}</h2>
        <div class="content ${item.error ? 'error' : ''}">${
        item.error ? `❌ ${item.error}` : item.output
      }</div>
      </article>
    `
    )
    .join('');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const instruction = form.instruction.value.trim();
  if (!instruction) {
    alert('请输入 instruction');
    return;
  }

  submitBtn.disabled = true;
  renderLoading();

  try {
    const response = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`接口错误: ${response.status} ${text}`);
    }

    const data = await response.json();
    renderResults(data.results || []);
  } catch (error) {
    resultEl.innerHTML = `
      <article class="card" style="grid-column: 1 / -1">
        <h2>请求失败</h2>
        <div class="content error">${error.message}</div>
      </article>
    `;
  } finally {
    submitBtn.disabled = false;
  }
});

renderLoading();
