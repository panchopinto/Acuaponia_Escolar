const STORAGE_KEY = 'acuaponia_escolar_registros';
const SETTINGS_KEY = 'acuaponia_escolar_settings';
const GOOGLE_SCRIPT_URL = 'PEGA_AQUI_TU_URL_DE_APPS_SCRIPT';

const el = (selector) => document.querySelector(selector);
const els = (selector) => [...document.querySelectorAll(selector)];

const state = {
  records: [],
  waterChart: null,
  airChart: null,
  fontScale: 1,
};

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const theme = saved.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  state.fontScale = saved.fontScale || 1;
  document.documentElement.style.setProperty('--font-scale', state.fontScale);
  document.body.classList.toggle('dyslexia', !!saved.dyslexia);
  document.body.classList.toggle('high-contrast', !!saved.contrast);
  document.body.classList.toggle('reduce-motion', !!saved.reduceMotion);
  document.body.classList.toggle('highlight-links', !!saved.highlightLinks);
}

function saveSettings(next = {}) {
  const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const merged = { ...current, ...next };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

function togglePanel() {
  const panel = el('#accessPanel');
  const btn = el('#accessToggle');
  const hidden = panel.hasAttribute('hidden');
  if (hidden) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
  btn.setAttribute('aria-expanded', String(hidden));
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  saveSettings({ theme: next });
}

function updateFont(scale) {
  state.fontScale = Math.max(0.9, Math.min(1.35, scale));
  document.documentElement.style.setProperty('--font-scale', state.fontScale);
  saveSettings({ fontScale: state.fontScale });
}

function speakPage() {
  speechSynthesis.cancel();
  const text = document.body.innerText.slice(0, 5000);
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'es-CL';
  speechSynthesis.speak(utter);
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function exportCsv(records) {
  if (!records.length) return showMessage('No hay registros para exportar.', true);
  const headers = ['fecha', 'curso', 'equipo', 'tempAgua', 'tempAmbiente', 'alimentacion', 'peces', 'plantas', 'observaciones'];
  const lines = [headers.join(',')];
  records.forEach(row => lines.push(headers.map(h => csvEscape(row[h])).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'acuaponia_registros.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function getRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  state.records = records;
  renderRecords();
  renderCharts();
}

function showMessage(text, isError = false) {
  const msg = el('#formMessage');
  msg.textContent = text;
  msg.style.color = isError ? '#fca5a5' : 'var(--secondary)';
}

function renderRecords() {
  const tbody = el('#recordsBody');
  tbody.innerHTML = '';
  const sorted = [...state.records].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).slice(-12).reverse();

  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="6">Aún no hay registros guardados.</td></tr>';
    return;
  }

  sorted.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.fecha}</td>
      <td>${row.equipo}</td>
      <td>${row.tempAgua} °C</td>
      <td>${row.tempAmbiente} °C</td>
      <td>${row.peces}</td>
      <td>${row.plantas}</td>
    `;
    tbody.appendChild(tr);
  });
}

function chartConfig(label, labels, data) {
  return {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data,
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text') } } },
      scales: {
        x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted') }, grid: { color: 'rgba(148,163,184,.15)' } },
        y: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--muted') }, grid: { color: 'rgba(148,163,184,.15)' } }
      }
    }
  };
}

function renderCharts() {
  const labels = [...state.records].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).map(r => r.fecha);
  const waterData = [...state.records].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).map(r => Number(r.tempAgua));
  const airData = [...state.records].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).map(r => Number(r.tempAmbiente));

  if (state.waterChart) state.waterChart.destroy();
  if (state.airChart) state.airChart.destroy();

  state.waterChart = new Chart(el('#waterChart'), chartConfig('Temperatura del agua', labels, waterData));
  state.airChart = new Chart(el('#airChart'), chartConfig('Temperatura ambiente', labels, airData));
}

async function sendToGoogleSheets(payload) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('PEGA_AQUI')) {
    return { ok: false, reason: 'No se ha configurado la URL de Google Apps Script.' };
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, reason: 'No fue posible enviar a Google Sheets en este momento.' };
  }
}

function normalizeFormData(formData) {
  return Object.fromEntries(formData.entries());
}

function bindForm() {
  const form = el('#dailyForm');
  form.fecha.value = new Date().toISOString().slice(0, 10);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = normalizeFormData(new FormData(form));

    const next = [...getRecords(), payload];
    saveRecords(next);
    showMessage('Registro guardado localmente. Enviando a Google Sheets...');

    const result = await sendToGoogleSheets(payload);
    if (result.ok) {
      showMessage('Registro guardado localmente y enviado a Google Sheets.');
    } else {
      showMessage(`Registro guardado localmente. ${result.reason}`, true);
    }

    form.reset();
    form.fecha.value = new Date().toISOString().slice(0, 10);
    form.curso.value = '1° medio';
  });

  el('#saveLocalBtn').addEventListener('click', () => {
    const payload = normalizeFormData(new FormData(form));
    if (!payload.fecha || !payload.equipo) return showMessage('Completa al menos la fecha y el equipo.', true);
    const next = [...getRecords(), payload];
    saveRecords(next);
    showMessage('Registro guardado localmente.');
  });

  el('#exportCsvBtn').addEventListener('click', () => exportCsv(state.records));
  el('#clearLocalDataBtn').addEventListener('click', () => {
    if (!confirm('¿Seguro que deseas borrar los datos locales del navegador?')) return;
    localStorage.removeItem(STORAGE_KEY);
    saveRecords([]);
    showMessage('Datos locales eliminados.');
  });
}

function bindAccessibility() {
  el('#accessToggle').addEventListener('click', togglePanel);
  el('#menuToggle')?.addEventListener('click', () => el('#mainNav').classList.toggle('open'));

  els('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const current = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');

      if (action === 'toggle-theme') toggleTheme();
      if (action === 'font-plus') updateFont(state.fontScale + 0.05);
      if (action === 'font-minus') updateFont(state.fontScale - 0.05);
      if (action === 'font-reset') updateFont(1);
      if (action === 'toggle-dyslexia') {
        document.body.classList.toggle('dyslexia');
        saveSettings({ dyslexia: !current.dyslexia });
      }
      if (action === 'toggle-contrast') {
        document.body.classList.toggle('high-contrast');
        saveSettings({ contrast: !current.contrast });
      }
      if (action === 'speak') speakPage();
      if (action === 'stop-speak') speechSynthesis.cancel();
      if (action === 'toggle-motion') {
        document.body.classList.toggle('reduce-motion');
        saveSettings({ reduceMotion: !current.reduceMotion });
      }
      if (action === 'toggle-highlight-links') {
        document.body.classList.toggle('highlight-links');
        saveSettings({ highlightLinks: !current.highlightLinks });
      }
    });
  });
}

function bindQuiz() {
  el('#quizBtn').addEventListener('click', () => {
    let score = 0;
    els('.question').forEach((question, index) => {
      const answer = question.dataset.answer;
      const chosen = el(`input[name="q${index + 1}"]:checked`)?.value;
      if (chosen === answer) score += 1;
    });
    el('#quizResult').textContent = `Obtuviste ${score} de 3 respuestas correctas.`;
  });
}

function seedDemoData() {
  if (getRecords().length) return;
  const demo = [
    { fecha: '2026-03-04', curso: '1° medio', equipo: 'Equipo Agua 1', tempAgua: 18.1, tempAmbiente: 19.3, alimentacion: 'Media', peces: 'Activos', plantas: 'Bueno', observaciones: 'Sistema estable.' },
    { fecha: '2026-03-05', curso: '1° medio', equipo: 'Equipo Agua 1', tempAgua: 17.8, tempAmbiente: 18.7, alimentacion: 'Media', peces: 'Normales', plantas: 'Bueno', observaciones: 'Sin novedades.' },
    { fecha: '2026-03-06', curso: '1° medio', equipo: 'Equipo Agua 2', tempAgua: 17.1, tempAmbiente: 16.4, alimentacion: 'Baja', peces: 'Lentos', plantas: 'Regular', observaciones: 'Mañana fría.' },
    { fecha: '2026-03-07', curso: '1° medio', equipo: 'Equipo Agua 2', tempAgua: 18.5, tempAmbiente: 20.1, alimentacion: 'Alta', peces: 'Muy activos', plantas: 'Muy bueno', observaciones: 'Buena respuesta al alimento.' }
  ];
  saveRecords(demo);
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  bindAccessibility();
  bindForm();
  bindQuiz();
  seedDemoData();
  state.records = getRecords();
  renderRecords();
  renderCharts();
  registerSW();
});
