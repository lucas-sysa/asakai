const SHEET_URL = "https://script.google.com/macros/s/AKfycbznAa54CLIDbTYLMbznKOs-aw9_rEGeCDZZ1qOXxevXnFa6h61wG24UhlXyjMIdt8I/exec";

// --- Elementos HTML ---
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

const totalReclamosEl = document.getElementById('totalReclamos');
const totalRetenidasEl = document.getElementById('totalRetenidas');

const reclamosChartCtx = document.getElementById('reclamosChart').getContext('2d');
const riesgoChartCtx = document.getElementById('riesgoChart').getContext('2d');
const buenoDirectoChartCtx = document.getElementById('buenoDirectoChart').getContext('2d');
const retencionesMasivasChartCtx = document.getElementById('retencionesMasivasChart').getContext('2d');
const unidadesRetenidasChartCtx = document.getElementById('unidadesRetenidasChart').getContext('2d');
const marcasChartCtx = document.getElementById('marcasChart').getContext('2d');

let dataGlobal = null;
let reclamosChart, riesgoChart, buenoDirectoChart, retencionesMasivasChart, unidadesRetenidasChart, marcasChart;

// --- Cargar datos desde Google Sheets ---
async function loadData() {
    try {
        const res = await fetch(SHEET_URL);
        const json = await res.json();

        dataGlobal = {
            Reclamos: Array.isArray(json.Reclamos) ? json.Reclamos : (Array.isArray(json) ? json : []),
            BuenoDirecto: Array.isArray(json.BuenoDirecto) ? json.BuenoDirecto : [],
            Retenciones: Array.isArray(json.Retenciones) ? json.Retenciones : []
        };

        populateFilters();
        updateCharts();
    } catch (err) {
        console.error("Error cargando datos:", err);
    }
}

// --- Llenar filtros automáticamente ---
function populateFilters() {
    if (!dataGlobal || !dataGlobal.Reclamos) return;

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
function getFilteredData(array) {
    if (!array) return [];

    const day = daySelect.value;
    const month = monthSelect.value;
    const year = yearSelect.value;

    return array.filter(r => {
        if (!r.Fecha) return false;
        const d = new Date(r.Fecha);
        const matchDay = !day || d.getDate() === Number(day);
        const matchMonth = !month || d.getMonth()+1 === Number(month);
        const matchYear = !year || d.getFullYear() === Number(year);
        return matchDay && matchMonth && matchYear;
    });
}

// --- Actualizar dashboard ---
function updateDashboard(filteredReclamos, filteredRetenciones) {
    const totalReclamos = filteredReclamos.reduce((acc,r) => acc + (Number(r["Reclamos de Clientes"]) || 0), 0);
    const totalRetenidas = filteredRetenciones.reduce((acc,r) => acc + (Number(r["RETENIDAS TOTALES"]) || 0), 0);
    totalReclamosEl.textContent = totalReclamos;
    totalRetenidasEl.textContent = totalRetenidas;
}

// --- Crear/Actualizar gráficos ---
function updateCharts() {
    const filteredReclamos = getFilteredData(dataGlobal.Reclamos);
    const filteredBueno = getFilteredData(dataGlobal.BuenoDirecto);
    const filteredRetenciones = getFilteredData(dataGlobal.Retenciones);

    updateDashboard(filteredReclamos, filteredRetenciones);

    updateReclamosChart(filteredReclamos);
    updateRiesgoChart(filteredReclamos);
    updateBuenoDirectoChart(filteredBueno);
    updateRetencionesMasivasChart(filteredRetenciones);
    updateUnidadesRetenidasChart(filteredRetenciones);
    updateMarcasChart(filteredReclamos);
}

// --- Gráficos individuales ---
function updateReclamosChart(filtered) {
    const fechas = filtered.map(r => r.Fecha);
    const valores = filtered.map(r => Number(r["Reclamos de Clientes"])||0);
    if(reclamosChart) reclamosChart.destroy();
    reclamosChart = new Chart(reclamosChartCtx, {
        type:'bar',
        data:{labels:fechas,datasets:[{label:'Reclamos de Clientes',data:valores,backgroundColor:'rgba(75,192,192,0.6)'}]},
        options:{responsive:true, plugins:{legend:{display:false}}}
    });
}

function updateRiesgoChart(filtered) {
    const fechas = filtered.map(r => r.Fecha);
    const conRiesgo = filtered.map(r => r.Comentarios_Reclamo1 && r.Comentarios_Reclamo1.includes("CON RIESGO")?1:0);
    const sinRiesgo = filtered.map(r => r.Comentarios_Reclamo1 && r.Comentarios_Reclamo1.includes("SIN RIESGO")?1:0);
    if(riesgoChart) riesgoChart.destroy();
    riesgoChart = new Chart(riesgoChartCtx, {
        type:'bar',
        data:{labels:fechas,datasets:[
            {label:'Con Riesgo',data:conRiesgo,backgroundColor:'red'},
            {label:'Sin Riesgo',data:sinRiesgo,backgroundColor:'green'}
        ]},
        options:{responsive:true, plugins:{legend:{position:'top'}}}
    });
}

function updateBuenoDirectoChart(filtered) {
    const fechas = filtered.map(r => r.Fecha);
    const valores = filtered.map(r => Number(r["% de Bueno Directo Diario"])||0);
    if(buenoDirectoChart) buenoDirectoChart.destroy();
    buenoDirectoChart = new Chart(buenoDirectoChartCtx,{
        type:'line',
        data:{labels:fechas,datasets:[{label:'% Bueno Directo Diario',data:valores,borderColor:'blue',backgroundColor:'rgba(0,0,255,0.2)',fill:true,tension:0.2}]},
        options:{responsive:true, plugins:{legend:{position:'top'}}}
    });
}

function updateRetencionesMasivasChart(filtered) {
    const fechas = filtered.map(r => r.Fecha);
    const valores = filtered.map(r => Number(r["Cantidad de Retenciones MASIVAS"])||0);
    if(retencionesMasivasChart) retencionesMasivasChart.destroy();
    retencionesMasivasChart = new Chart(retencionesMasivasChartCtx,{
        type:'bar',
        data:{labels:fechas,datasets:[{label:'Retenciones Masivas',data:valores,backgroundColor:'orange'}]},
        options:{responsive:true, plugins:{legend:{position:'top'}}}
    });
}

function updateUnidadesRetenidasChart(filtered) {
    const fechas = filtered.map(r => r.Fecha);
    const valores = filtered.map(r => Number(r["Cantidad de Unidades RETENIDAS PISO"])||0);
    if(unidadesRetenidasChart) unidadesRetenidasChart.destroy();
    unidadesRetenidasChart = new Chart(unidadesRetenidasChartCtx,{
        type:'bar',
        data:{labels:fechas,datasets:[{label:'Unidades Retenidas',data:valores,backgroundColor:'purple'}]},
        options:{responsive:true, plugins:{legend:{position:'top'}}}
    });
}

function updateMarcasChart(filtered) {
    const marcaCounts = {};
    filtered.forEach(r => {
        const marca = r.MARCA || "SIN MARCA";
        const reclamos = Number(r["Reclamos de Clientes"]) || 0;
        marcaCounts[marca] = (marcaCounts[marca] || 0) + reclamos;
    });
    const labels = Object.keys(marcaCounts);
    const data = Object.values(marcaCounts);
    if(marcasChart) marcasChart.destroy();
    marcasChart = new Chart(marcasChartCtx,{
        type:'bar',
        data:{labels:labels,datasets:[{label:'Reclamos por Marca',data:data,backgroundColor:'rgba(255,99,132,0.6)'}]},
        options:{responsive:true, plugins:{legend:{display:false}}}
    });
}

// --- Botones ---
filterBtn.addEventListener('click', updateCharts);
resetBtn.addEventListener('click',()=>{
    daySelect.value=monthSelect.value=yearSelect.value='';
    updateCharts();
});

// --- Inicializar ---
loadData();
