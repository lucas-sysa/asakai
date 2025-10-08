const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxIpUxwCYqHI-hkLOz0Uq4HB68MKPRhHQ6_pSPMAihzXRKkmE3eFX1rfjrYYanSLef4CQ/exec';

// Selects
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

// Gráficos
let reclamosChart, buenoDirectoChart, retencionesMasivasChart, unidadesRetenidasChart, marcasChart, riesgoChart;

// Datos
let reclamosData = [], buenoDirectoData = [], retencionesData = [];

// Inicializar selects
function cargarSelects() {
  for (let d=1; d<=31; d++) daySelect.appendChild(new Option(d,d));
  for (let m=1; m<=12; m++) monthSelect.appendChild(new Option(m,m));
  for (let y=2000; y<=2030; y++) yearSelect.appendChild(new Option(y,y));
}

// Cargar datos desde Google Sheet
async function cargarDatos() {
  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();
    reclamosData = data.reclamos;
    buenoDirectoData = data.buenoDirecto;
    retencionesData = data.retenciones;
    actualizarDashboard();
    llenarTablas();
    crearGraficos();
  } catch(e) {
    console.error('Error al cargar datos:', e);
  }
}

// Filtrar por fecha
function filtrarPorFecha(data) {
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;
  return data.filter(row => {
    if(!row.Fecha) return false;
    const [fYear,fMonth,fDay] = row.Fecha.split('T')[0].split('-');
    return (!day || fDay==day) && (!month || fMonth==month) && (!year || fYear==year);
  });
}

// Actualizar dashboard
function actualizarDashboard() {
  const reclamos = filtrarPorFecha(reclamosData);
  const retenciones = filtrarPorFecha(retencionesData);
  document.getElementById('totalReclamos').textContent =
    reclamos.reduce((sum,r)=>sum+Number(r['Reclamos de Clientes']||0),0);
  document.getElementById('totalRetenidas').textContent =
    retenciones.reduce((sum,r)=>sum+Number(r['RETENIDAS TOTALES']||0),0);
}

// Llenar tablas ocultas
function llenarTablas() {
  const tbodyComentarios = document.querySelector('#comentariosTable tbody');
  tbodyComentarios.innerHTML = '';
  filtrarPorFecha(reclamosData).forEach((r,i)=>{
    if(r.Comentarios_Reclamo1 || r.Comentarios_Reclamo2){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td>
                      <td>${r.Comentarios_Reclamo1||''}</td>
                      <td>${r.Comentarios_Reclamo2||''}</td>
                      <td>${r.Fecha.split('T')[0]}</td>
                      <td>${r['Reclamos de Clientes']||0}</td>
                      <td>${r.MARCA||''}</td>`;
      tbodyComentarios.appendChild(tr);
    }
  });

  const tbodyHistorial = document.querySelector('#historialTable tbody');
  tbodyHistorial.innerHTML = '';
  const reclamosFiltrados = filtrarPorFecha(reclamosData);
  const buenoFiltrados = filtrarPorFecha(buenoDirectoData);
  const retencionesFiltrados = filtrarPorFecha(retencionesData);

  const maxLength = Math.max(reclamosFiltrados.length, buenoFiltrados.length, retencionesFiltrados.length);

  for(let i=0;i<maxLength;i++){
    const r = reclamosFiltrados[i] || {};
    const b = buenoFiltrados[i] || {};
    const ret = retencionesFiltrados[i] || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.Fecha||b.Fecha||ret.Fecha||''}</td>
                    <td>${r['Reclamos de Clientes']||''}</td>
                    <td>${r.MARCA||''}</td>
                    <td>${r.Comentarios_Reclamo1||''}</td>
                    <td>${r.Comentarios_Reclamo2||''}</td>
                    <td>${b['% de Bueno Directo Diario']||''}</td>
                    <td>${ret['Cantidad de Unidades RETENIDAS PISO']||''}</td>
                    <td>${ret['Cantidad de Retenciones MASIVAS']||''}</td>
                    <td>${ret['RETENIDAS TOTALES']||''}</td>`;
    tbodyHistorial.appendChild(tr);
  }
}

// Crear gráficos
function crearGraficos() {
  const reclamos = filtrarPorFecha(reclamosData);
  const bueno = filtrarPorFecha(buenoDirectoData);
  const retenciones = filtrarPorFecha(retencionesData);

  // Gráfico de riesgo
  const conRiesgo = reclamos.filter(r=>r.Comentarios_Reclamo1||r.Comentarios_Reclamo2).length;
  const sinRiesgo = reclamos.length - conRiesgo;
  const ctxRiesgo = document.getElementById('riesgoChart').getContext('2d');
  if(riesgoChart) riesgoChart.destroy();
  riesgoChart = new Chart(ctxRiesgo,{type:'doughnut',data:{labels:['Sin Riesgo','Con Riesgo'],datasets:[{data:[sinRiesgo,conRiesgo],backgroundColor:['#28a745','#dc3545']}]}});
  
  // Otros gráficos
  function crearBarChart(ctx, labels, data, label, color){
    if(ctx.chart) ctx.chart.destroy();
    ctx.chart = new Chart(ctx,{type:'bar',data:{labels, datasets:[{label, data, backgroundColor: color}]}, options:{responsive:true, scales:{y:{beginAtZero:true}}}});
  }

  crearBarChart(document.getElementById('reclamosChart').getContext('2d'), reclamos.map(r=>r.Fecha.split('T')[0]), reclamos.map(r=>Number(r['Reclamos de Clientes']||0)), 'Reclamos', 'rgba(255,99,132,0.6)');
  crearBarChart(document.getElementById('buenoDirectoChart').getContext('2d'), bueno.map(b=>b.Fecha.split('T')[0]), bueno.map(b=>Number(b['% de Bueno Directo Diario']||0)), '% Bueno Directo', 'rgba(54,162,235,0.6)');
  crearBarChart(document.getElementById('retencionesMasivasChart').getContext('2d'), retenciones.map(r=>r.Fecha.split('T')[0]), retenciones.map(r=>Number(r['Cantidad de Retenciones MASIVAS']||0)), 'Retenciones Masivas', 'rgba(255,206,86,0.6)');
  crearBarChart(document.getElementById('unidadesRetenidasChart').getContext('2d'), retenciones.map(r=>r.Fecha.split('T')[0]), retenciones.map(r=>Number(r['Cantidad de Unidades RETENIDAS PISO']||0)), 'Unidades Retenidas', 'rgba(75,192,192,0.6)');

  // Gráfico de marcas
  const marcasCount = {};
  reclamos.forEach(r=>{ if(r.MARCA) marcasCount[r.MARCA] = (marcasCount[r.MARCA]||0)+Number(r['Reclamos de Clientes']||0); });
  const ctxMarcas = document.getElementById('marcasChart').getContext('2d');
  if(marcasChart) marcasChart.destroy();
  marcasChart = new Chart(ctxMarcas,{type:'bar', data:{labels:Object.keys(marcasCount), datasets:[{label:'Reclamos por Marca', data:Object.values(marcasCount), backgroundColor:Object.keys(marcasCount).map(()=>`hsl(${Math.random()*360},70%,60%)`)}]}});
}

// Eventos
filterBtn.addEventListener('click',()=>{ actualizarDashboard(); llenarTablas(); crearGraficos(); });
resetBtn.addEventListener('click',()=>{ daySelect.value=''; monthSelect.value=''; yearSelect.value=''; actualizarDashboard(); llenarTablas(); crearGraficos(); });

// Inicialización
cargarSelects();
cargarDatos();


