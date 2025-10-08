const SHEET_URL = "https://script.google.com/macros/s/AKfycbznAa54CLIDbTYLMbznKOs-aw9_rEGeCDZZ1qOXxevXnFa6h61wG24UhlXyjMIdt8I/exec";

// --- Elementos HTML ---
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

// --- Cargar datos desde Google Sheets ---
async function loadData() {
    try {
        const res = await fetch(SHEET_URL);
        const json = await res.json();
        dataGlobal = { Reclamos: json }; // Aseguramos que exista la propiedad Reclamos
        populateFilters();
        updateCharts();
    } catch (err) {
        console.error("Error cargando datos:", err);
    }
}

// --- Llenar filtros automáticamente ---
function populateFilters() {
    if (!dataGlobal) return;

    const fechas = dataGlobal.Reclamos.map(r => new Date(r.Fecha)).filter(d => !isNaN(d));
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

// --- Filtrar datos según selects ---
function getFilteredData() {
    const day = daySelect.value;
    const month = monthSelect.value;
    const year = yearSelect.value;

    return dataGlobal.Reclamos.filter(r => {
        if (!r.Fecha) return false;
        const d = new Date(r.Fecha);
        const matchDay = !day || d.getDate() === Number(day);
        const matchMonth = !month || d.getMonth()+1 === Number(month);
        const matchYear = !year || d.getFullYear() === Number(year);
        return matchDay && matchMonth && matchYear;
    });
}

// --- Actualizar dashboard ---
function updateDashboard(filtered) {
    const total = filtered.reduce((acc, r) => acc + (Number(r["Reclamos de Clientes"]) || 0), 0);
    totalReclamosEl.textContent = total;
}

// --- Crear/Actualizar gráficos ---
function updateCharts() {
    if (!dataGlobal) return;

    const filtered = getFilteredData();
    updateDashboard(filtered);

    // Gráfico Reclamos de Clientes por fecha
    const fechas = filtered.map(r => r.Fecha);
    const valores = filtered.map(r => Number(r["Reclamos de Clientes"]) || 0);

    if(reclamosChart) reclamosChart.destroy();
    reclamosChart = new Chart(reclamosChartCtx, {
        type: 'bar',
        data: { 
            labels: fechas, 
            datasets: [{ label: 'Reclamos de Clientes', data: valores, backgroundColor: 'rgba(75,192,192,0.6)' }] 
        },
        options: { responsive:true, plugins:{legend:{display:false}} }
    });

    // Gráfico Reclamos con/sin riesgo
    const conRiesgo = filtered.map(r => r.Comentarios_Reclamo1.includes("CON RIESGO") ? 1 : 0);
    const sinRiesgo = filtered.map(r => r.Comentarios_Reclamo1.includes("SIN RIESGO") ? 1 : 0);

    if(riesgoChart) riesgoChart.destroy();
    riesgoChart = new Chart(riesgoChartCtx, {
        type: 'bar',
        data: { 
            labels: fechas, 
            datasets:[
                { label: 'Con Riesgo', data: conRiesgo, backgroundColor: 'red' },
                { label: 'Sin Riesgo', data: sinRiesgo, backgroundColor: 'green' }
            ] 
        },
        options: { responsive:true, plugins:{legend:{position:'top'}} }
    });
}

// --- Botones ---
filterBtn.addEventListener('click', updateCharts);
resetBtn.addEventListener('click', () => {
    daySelect.value = monthSelect.value = yearSelect.value = '';
    updateCharts();
});

// --- Inicializar ---
loadData();
