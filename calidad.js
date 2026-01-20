const SHEET_URL = "https://script.google.com/macros/s/AKfycbznAa54CLIDbTYLMbznKOs-aw9_rEGeCDZZ1qOXxevXnFa6h61wG24UhlXyjMIdt8I/exec";

let dataGlobal = null;
let charts = {}; // Objeto para guardar todas las instancias de Chart.js

async function loadData() {
    try {
        const res = await fetch(SHEET_URL);
        const json = await res.json();
        dataGlobal = {
            Reclamos: Array.isArray(json.Reclamos) ? json.Reclamos : [],
            BuenoDirecto: Array.isArray(json.BuenoDirecto) ? json.BuenoDirecto : [],
            Retenciones: Array.isArray(json.Retenciones) ? json.Retenciones : []
        };
        populateFilters();
        updateDashboard();
    } catch (err) {
        console.error("Error cargando datos:", err);
    }
}

function populateFilters() {
    const fechas = dataGlobal.Reclamos.map(r => new Date(r.Fecha)).filter(d => !isNaN(d));
    const days = [...new Set(fechas.map(d => d.getDate()))].sort((a,b)=>a-b);
    const months = [...new Set(fechas.map(d => d.getMonth()+1))].sort((a,b)=>a-b);
    const years = [...new Set(fechas.map(d => d.getFullYear()))].sort((a,b)=>a-b);

    const fill = (el, vals) => {
        el.innerHTML = '<option value="">Todos</option>';
        vals.forEach(v => el.innerHTML += `<option value="${v}">${v}</option>`);
    };
    fill(document.getElementById('daySelect'), days);
    fill(document.getElementById('monthSelect'), months);
    fill(document.getElementById('yearSelect'), years);
}

function getFiltered(arr) {
    const d = document.getElementById('daySelect').value;
    const m = document.getElementById('monthSelect').value;
    const y = document.getElementById('yearSelect').value;
    return arr.filter(r => {
        const date = new Date(r.Fecha);
        return (!d || date.getDate() == d) && (!m || (date.getMonth()+1) == m) && (!y || date.getFullYear() == y);
    });
}

function updateDashboard() {
    const fRec = getFiltered(dataGlobal.Reclamos);
    const fRet = getFiltered(dataGlobal.Retenciones);
    const fBue = getFiltered(dataGlobal.BuenoDirecto);

    // --- LOGICA RECLAMOS ---
    const hoyRec = fRec.length > 0 ? Number(fRec[fRec.length-1]["Reclamos de Clientes"]) : 0;
    const mesRec = fRec.reduce((acc, r) => acc + (Number(r["Reclamos de Clientes"]) || 0), 0);
    document.getElementById('totalReclamos').textContent = hoyRec;
    document.getElementById('mesReclamos').textContent = mesRec;
    document.getElementById('card-reclamos').className = `dashboard-item ${hoyRec > 0 ? 'bg-rojo' : 'bg-verde'}`;

    // --- LOGICA RETENIDAS ---
    const hoyRet = fRet.length > 0 ? Number(fRet[fRet.length-1]["RETENIDAS TOTALES"]) : 0;
    document.getElementById('totalRetenidas').textContent = hoyRet;
    document.getElementById('card-retenidas').className = `dashboard-item ${hoyRet > 0 ? 'bg-rojo' : 'bg-verde'}`;

    // --- LOGICA BD ---
    const hoyBD = fBue.length > 0 ? (Number(fBue[fBue.length-1]["% de Bueno Directo Diario"]) * 100) : 0;
    const promBD = fBue.length > 0 ? (fBue.reduce((acc, r) => acc + (Number(r["% de Bueno Directo Diario"]) || 0), 0) / fBue.length) * 100 : 0;
    document.getElementById('totalBD').textContent = hoyBD.toFixed(1) + "%";
    document.getElementById('mesBD').textContent = promBD.toFixed(1) + "%";
    document.getElementById('card-bd').className = `dashboard-item ${hoyBD >= 85 ? 'bg-verde' : 'bg-rojo'}`;

    renderCharts(fRec, fRet, fBue);
}

function renderCharts(fRec, fRet, fBue) {
    const commonX = { ticks: { maxRotation: 90, minRotation: 90 } };
    const dateLabels = (arr) => arr.map(r => {
        const d = new Date(r.Fecha);
        return `${d.getDate()}/${d.getMonth()+1}`;
    });

    const createOrUpdate = (id, type, data, options = {}) => {
        if (charts[id]) charts[id].destroy();
        charts[id] = new Chart(document.getElementById(id), { type, data, options: { responsive: true, ...options } });
    };

    // Columna 1
    createOrUpdate('reclamosChart', 'bar', {
        labels: dateLabels(fRec),
        datasets: [{ label: 'Reclamos', data: fRec.map(r => r["Reclamos de Clientes"]), backgroundColor: '#3498db' }]
    }, { scales: { x: commonX } });


    const marcaData = {};
    fRec.forEach(r => { const m = r.MARCA || 'N/A'; marcaData[m] = (marcaData[m] || 0) + Number(r["Reclamos de Clientes"]); });
    createOrUpdate('marcasChart', 'bar', {
        labels: Object.keys(marcaData),
        datasets: [{ label: 'Por Marca', data: Object.values(marcaData), backgroundColor: '#9b59b6' }]
    }, { indexAxis: 'y' });

    // Columna 2
    createOrUpdate('unidadesRetenidasChart', 'bar', {
        labels: dateLabels(fRet),
        datasets: [{ label: 'U. Retenidas', data: fRet.map(r => r["Cantidad de Unidades RETENIDAS PISO"]), backgroundColor: '#e67e22' }]
    }, { scales: { x: commonX } });

    createOrUpdate('retencionesMasivasChart', 'bar', {
        labels: dateLabels(fRet),
        datasets: [{ label: 'Ret. Masivas', data: fRet.map(r => r["Cantidad de Retenciones MASIVAS"]), backgroundColor: '#f1c40f' }]
    }, { scales: { x: commonX } });

    // Columna 3
    createOrUpdate('buenoDirectoChart', 'line', {
        labels: dateLabels(fBue),
        datasets: [
            { label: '% BD', data: fBue.map(r => Number(r["% de Bueno Directo Diario"])*100), borderColor: '#2980b9', tension: 0.3 },
            { label: 'Meta 85%', data: Array(fBue.length).fill(85), borderColor: '#27ae60', borderDash: [5,5], pointRadius: 0 }
        ]
    }, { scales: { x: commonX, y: { min: 0, max: 100 } } });
}

document.getElementById('filterBtn').onclick = updateDashboard;
document.getElementById('resetBtn').onclick = () => {
    document.getElementById('daySelect').value = "";
    document.getElementById('monthSelect').value = "";
    document.getElementById('yearSelect').value = "";
    updateDashboard();
};

loadData();
