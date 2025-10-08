const SHEET_URL = "https://script.google.com/macros/s/AKfycbznAa54CLIDbTYLMbznKOs-aw9_rEGeCDZZ1qOXxevXnFa6h61wG24UhlXyjMIdt8I/exec";

// Referencias a elementos
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

const totalReclamosEl = document.getElementById('totalReclamos');

const reclamosChartCtx = document.getElementById('reclamosChart').getContext('2d');
const riesgoChartCtx = document.getElementById('riesgoChart').getContext('2d');

let dataGlobal = null;
let reclamosChart, riesgoChart;

// Función para cargar datos desde el Sheet
async function loadData() {
  const res = await fetch(SHEET_URL);
  dataGlobal = await res.json();
  populateFilters();
  updateDashboard();
  updateCharts();
}

// Poblar filtros automáticamente
function populateFilters() {
  if (!dataGlobal) return;

  const fechas = dataGlobal.Reclamos.map(r => new Date(r.Fecha));
  const days = [...new Set(fechas.map(d => d.getDate()))].sort((a,b)=>a-b);
  const months = [...new Set(fechas.map(d => d.getMonth()+1))].sort((a,b)=>a-b);
  const years = [...new Set(fechas.map(d => d.getFullYear()))].sort((a,b)=>a-b);

  daySelect.innerHTML = '<option value="">Todos</option>';
  monthSelect.innerHTML = '<option value="">Todos</option>';
  yearSelect.innerHTML = '<option value="">Todos</option>';

  days.forEach(d => daySelect.innerHTML += `<option value="${d}">${d}</option>`);
  months.forEach(m => monthSelect.innerHTML += `<option value="${m}">${m}</option>`);
  years.forEach(y => yearSelect.innerHTML += `<option value="${y}">${y}</option>`);
}

// Filtrar datos según los selects
function getFilteredData() {
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;

  return dataGlobal.Reclamos.filter(r => {
    const d = new Date(r.Fecha);
    return (!day || d.getDate() == day) &&
           (!month || d.getMonth()+1 == month) &&
           (!year || d.getFullYear() == year);
  });
}

// Actualizar dashboard
function updateDashboard() {
  if (!dataGlobal) return;
  const totalReclamos = dataGlobal.Reclamos.length;
  totalReclamosEl.textContent = totalReclamos;
}

// Crear/Actualizar gráficos
function updateCharts() {
  if (!dataGlobal) return;

  const filtered = getFilteredData();

  // Gráfico Reclamos de Clientes por fecha
  const fechas = filtered.map(r => r.Fecha);
  const valores = filtered.map(r => Number(r["Reclamos de Clientes"]));

  if(reclamosChart) reclamosChart.destroy();
  reclamosChart = new Chart(reclamosChartCtx, {
    type: 'bar',
    data: {
      labels: fechas,
      datasets: [{
        label: 'Reclamos de Clientes',
        data: valores,
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  // Gráfico Reclamos con/sin riesgo
  // Para este ejemplo, asumimos que si "Comentarios_Reclamo1" existe, es con riesgo
  const conRiesgo = filtered.map(r => r.Comentarios_Reclamo1 ? 1 : 0);
  const sinRiesgo = filtered.map(r => r.Comentarios_Reclamo1 ? 0 : 1);

  if(riesgoChart) riesgoChart.destroy();
  riesgoChart = new Chart(riesgoChartCtx, {
    type: 'bar',
    data: {
      labels: fechas,
      datasets: [
        { label: 'Con Riesgo', data: conRiesgo, backgroundColor: 'red' },
        { label: 'Sin Riesgo', data: sinRiesgo, backgroundColor: 'green' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } }
    }
  });
}

// Botones de filtros
filterBtn.addEventListener('click', () => {
  updateCharts();
});

resetBtn.addEventListener('click', () => {
  daySelect.value = monthSelect.value = yearSelect.value = '';
  updateCharts();
});

// Inicializar
loadData();


