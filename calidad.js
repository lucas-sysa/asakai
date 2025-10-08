const SHEET_URL = 'https://script.google.com/macros/s/AKfycbz6f-ZtkMo-twdl0U9NjMd03tKv_SU8FYM1-ENkcUR8fNq_Tq5L5gJ5JohTz_PkKIkxWg/exec';

// Filtros
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

// Charts
let reclamosChart, buenoDirectoChart, retencionesMasivasChart, unidadesRetenidasChart, marcasChart, riesgoChart;

// Datos
let reclamosData = [], buenoDirectoData = [], retencionesData = [];

// Inicializar selects de fecha
function cargarSelects() {
  for (let d = 1; d <= 31; d++) {
    const option = document.createElement('option');
    option.value = d.toString().padStart(2,'0');
    option.textContent = d;
    daySelect.appendChild(option);
  }
  for (let m = 1; m <= 12; m++) {
    const option = document.createElement('option');
    option.value = m.toString().padStart(2,'0');
    option.textContent = m;
    monthSelect.appendChild(option);
  }
  for (let y = 2000; y <= 2030; y++) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}

// Cargar datos desde Google Sheet
async function cargarDatos() {
  try {
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    reclamosData = data.reclamos;
    buenoDirectoData = data.buenoDirecto;
    retencionesData = data.retenciones;
    actualizarDashboard();
    crearGraficos();
    llenarTablas();
  } catch(e) {
    console.error('Error al cargar datos:', e);
    alert("No se pudieron cargar los datos. Revisa la URL del Web App y que esté publicado correctamente.");
  }
}

// Filtrar por fecha
function filtrarPorFecha(data) {
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;
  return data.filter(row => {
    const [fYear,fMonth,fDay] = row.Fecha.split('T')[0].split('-');
    return (!day || fDay===day) && (!month || fMonth===month) && (!year || fYear===year);
  });
}

// --- Resto del código de dashboards, tablas y gráficos igual que antes ---

filterBtn.addEventListener('click',()=>{
  actualizarDashboard();
  crearGraficos();
  llenarTablas();
});

resetBtn.addEventListener('click',()=>{
  daySelect.value=''; monthSelect.value=''; yearSelect.value='';
  actualizarDashboard();
  crearGraficos();
  llenarTablas();
});

cargarSelects();
cargarDatos();

