const SHEET_URL = "https://script.google.com/macros/s/AKfycbznAa54CLIDbTYLMbznKOs-aw9_rEGeCDZZ1qOXxevXnFa6h61wG24UhlXyjMIdt8I/exec";

const SHEET_URL = "AQUÍ_VA_TU_WEB_APP_URL";

// Referencias a elementos
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

const totalReclamosEl = document.getElementById('totalReclamos');
const totalRetenidasEl = document.getElementById('totalRetenidas');

// Tablas y gráficos
const comentariosTableBody = document.querySelector('#comentariosTable tbody');
const historialTableBody = document.querySelector('#historialTable tbody');

let dataGlobal = null;

// Función para cargar datos
async function loadData() {
  const res = await fetch(SHEET_URL);
  dataGlobal = await res.json();
  populateFilters();
  updateDashboard();
  updateCharts();
  populateTables();
}

// Poblar filtros
function populateFilters() {
  if (!dataGlobal) return;
  const fechas = dataGlobal.Reclamos.map(r => new Date(r.Fecha));
  const days = [...new Set(fechas.map(d => d.getDate()))].sort((a,b)=>a-b);
  const months = [...new Set(fechas.map(d => d.getMonth()+1))].sort((a,b)=>a-b);
  const years = [...new Set(fechas.map(d => d.getFullYear()))].sort((a,b)=>a-b);

  days.forEach(d => daySelect.innerHTML += `<option value="${d}">${d}</option>`);
  months.forEach(m => monthSelect.innerHTML += `<option value="${m}">${m}</option>`);
  years.forEach(y => yearSelect.innerHTML += `<option value="${y}">${y}</option>`);
}

// Función para filtrar datos
function getFilteredData() {
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;

  return dataGlobal.Reclamos.filter(r => {
    const d = new Date(r.Fecha);
    return (!day || d.getDate()==day) &&
           (!month || d.getMonth()+1==month) &&
           (!year || d.getFullYear()==year);
  });
}

// Dashboard
function updateDashboard() {
  if (!dataGlobal) return;
  const totalReclamos = dataGlobal.Reclamos.length;
  const totalRetenidas = dataGlobal.Retenciones.reduce((sum,r) => sum + Number(r["RETENIDAS TOTALES"]),0);

  totalReclamosEl.textContent = totalReclamos;
  totalRetenidasEl.textContent = totalRetenidas;
}

// Chart.js
function updateCharts() {
  if (!dataGlobal) return;

  // Reclamos por Marca
  const marcas = {};
  dataGlobal.Reclamos.forEach(r => {
    marcas[r.MARCA] = (marcas[r.MARCA]||0) + 1;
  });
  const ctxMarcas = document.getElementById('marcasChart').getContext('2d');
  new Chart(ctxMarcas, {
    type:'bar',
    data: {
      labels: Object.keys(marcas),
      datasets:[{label:'Reclamos por Marca', data:Object.values(marcas), backgroundColor:'rgba(75, 192, 192, 0.6)'}]
    }
  });

  // Bueno Directo Diario
  const fechas = dataGlobal.BuenoDirecto.map(b=>b.Fecha);
  const valores = dataGlobal.BuenoDirecto.map(b=>Number(b["% de Bueno Directo Diario"]));
  const ctxBueno = document.getElementById('buenoDirectoChart').getContext('2d');
  new Chart(ctxBueno,{
    type:'line',
    data:{labels:fechas,datasets:[{label:'% Bueno Directo Diario', data:valores, borderColor:'blue', fill:false}]}
  });

  // Retenciones Masivas
  const fechasR = dataGlobal.Retenciones.map(r=>r.Fecha);
  const masivas = dataGlobal.Retenciones.map(r=>Number(r["Cantidad de Retenciones MASIVAS"]));
  const ctxRetMas = document.getElementById('retencionesMasivasChart').getContext('2d');
  new Chart(ctxRetMas,{
    type:'bar',
    data:{labels:fechasR,datasets:[{label:'Retenciones Masivas', data:masivas, backgroundColor:'orange'}]}
  });

  // Unidades Retenidas
  const unidades = dataGlobal.Retenciones.map(r=>Number(r["Cantidad de Unidades RETENIDAS PISO"]));
  const ctxUnidades = document.getElementById('unidadesRetenidasChart').getContext('2d');
  new Chart(ctxUnidades,{
    type:'bar',
    data:{labels:fechasR,datasets:[{label:'Unidades Retenidas', data:unidades, backgroundColor:'red'}]}
  });
}

// Tablas
function populateTables() {
  if (!dataGlobal) return;

  // Comentarios
  comentariosTableBody.innerHTML = '';
  dataGlobal.Reclamos.forEach((r,i)=>{
    comentariosTableBody.innerHTML += `<tr>
      <td>${i+1}</td>
      <td>${r.Comentarios_Reclamo1}</td>
      <td>${r.Comentarios_Reclamo2}</td>
      <td>${r.Fecha}</td>
      <td>${r["Reclamos de Clientes"]}</td>
      <td>${r.MARCA}</td>
    </tr>`;
  });

  // Historial completo
  historialTableBody.innerHTML = '';
  const maxLen = Math.max(dataGlobal.Reclamos.length, dataGlobal.BuenoDirecto.length, dataGlobal.Retenciones.length);
  for(let i=0;i<maxLen;i++){
    const rec = dataGlobal.Reclamos[i]||{};
    const bueno = dataGlobal.BuenoDirecto[i]||{};
    const ret = dataGlobal.Retenciones[i]||{};
    historialTableBody.innerHTML += `<tr>
      <td>${rec.Fecha || bueno.Fecha || ret.Fecha || ''}</td>
      <td>${rec["Reclamos de Clientes"] || ''}</td>
      <td>${rec.MARCA || ''}</td>
      <td>${rec.Comentarios_Reclamo1 || ''}</td>
      <td>${rec.Comentarios_Reclamo2 || ''}</td>
      <td>${bueno["% de Bueno Directo Diario"] || ''}</td>
      <td>${ret["Cantidad de Unidades RETENIDAS PISO"] || ''}</td>
      <td>${ret["Cantidad de Retenciones MASIVAS"] || ''}</td>
      <td>${ret["RETENIDAS TOTALES"] || ''}</td>
    </tr>`;
  }
}

// Filtros
filterBtn.addEventListener('click', ()=>{
  // Podés agregar lógica de filtro en gráficos si querés
  const filtered = getFilteredData();
  console.log("Filtrados:", filtered);
});
resetBtn.addEventListener('click', ()=>{
  daySelect.value = monthSelect.value = yearSelect.value = '';
  loadData();
});

// Inicializar
loadData();
