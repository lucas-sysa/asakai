const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzCtx5s-x3cfUZK9Q72vbzbmtSxwmbQrG0qWkePVCs63Vo1cvhfskm-NxdSZ2wbrDN5/exec';

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

// Actualizar dashboards
function actualizarDashboard() {
  const reclamos = filtrarPorFecha(reclamosData);
  const retenciones = filtrarPorFecha(retencionesData);

  const totalReclamos = reclamos.reduce((sum,r)=> sum + Number(r['Reclamos de Clientes']),0);
  const totalRetenidas = retenciones.reduce((sum,r)=> sum + Number(r['RETENIDAS TOTALES']),0);

  document.getElementById('totalReclamos').textContent = totalReclamos;
  document.getElementById('totalRetenidas').textContent = totalRetenidas;
}

// Llenar tablas ocultas (para usar internamente)
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
                      <td>${r['Reclamos de Clientes']}</td>
                      <td>${r.MARCA}</td>`;
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

// Crear todos los gráficos
function crearGraficos() {
  const reclamos = filtrarPorFecha(reclamosData);
  const bueno = filtrarPorFecha(buenoDirectoData);
  const retenciones = filtrarPorFecha(retencionesData);

  // Gráfico de torta: Reclamos con/sin riesgo
  const conRiesgo = reclamos.filter(r=> r['Comentarios_Reclamo1'] || r['Comentarios_Reclamo2']).length;
  const sinRiesgo = reclamos.length - conRiesgo;
  const ctxRiesgo = document.getElementById('riesgoChart').getContext('2d');
  if(riesgoChart) riesgoChart.destroy();
  riesgoChart = new Chart(ctxRiesgo,{
    type:'doughnut',
    data:{labels:['Sin Riesgo','Con Riesgo'], datasets:[{data:[sinRiesgo,conRiesgo], backgroundColor:['#28a745','#dc3545']}]},
    options:{responsive:true, plugins:{legend:{position:'bottom'}}}
  });

  // Gráfico de barras: Reclamos de Clientes
  const ctxReclamos = document.getElementById('reclamosChart').getContext('2d');
  if(reclamosChart) reclamosChart.destroy();
  reclamosChart = new Chart(ctxReclamos,{
    type:'bar',
    data:{labels:reclamos.map(r=> r.Fecha.split('T')[0]), datasets:[{label:'Reclamos', data: reclamos.map(r=>Number(r['Reclamos de Clientes'])), backgroundColor:'rgba(255,99,132,0.6)'}]},
    options:{responsive:true, scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}
  });

  // Gráfico de barras: Bueno Directo
  const ctxBueno = document.getElementById('buenoDirectoChart').getContext('2d');
  if(buenoDirectoChart) buenoDirectoChart.destroy();
  buenoDirectoChart = new Chart(ctxBueno,{
    type:'bar',
    data:{labels:bueno.map(b=> b.Fecha.split('T')[0]), datasets:[{label:'% Bueno Directo', data:bueno.map(b=>Number(b['% de Bueno Directo Diario'])), backgroundColor:'rgba(54,162,235,0.6)'}]},
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });

  // Gráfico de barras: Retenciones Masivas
  const ctxRetMasivas = document.getElementById('retencionesMasivasChart').getContext('2d');
  if(retencionesMasivasChart) retencionesMasivasChart.destroy();
  retencionesMasivasChart = new Chart(ctxRetMasivas,{
    type:'bar',
    data:{labels:retenciones.map(r=> r.Fecha.split('T')[0]), datasets:[{label:'Retenciones Masivas', data: retenciones.map(r=>Number(r['Cantidad de Retenciones MASIVAS'])), backgroundColor:'rgba(255,206,86,0.6)'}]},
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });

  // Gráfico de barras: Unidades Retenidas
  const ctxUnidades = document.getElementById('unidadesRetenidasChart').getContext('2d');
  if(unidadesRetenidasChart) unidadesRetenidasChart.destroy();
  unidadesRetenidasChart = new Chart(ctxUnidades,{
    type:'bar',
    data:{labels:retenciones.map(r=> r.Fecha.split('T')[0]), datasets:[{label:'Unidades Retenidas', data: retenciones.map(r=>Number(r['Cantidad de Unidades RETENIDAS PISO'])), backgroundColor:'rgba(75,192,192,0.6)'}]},
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });

  // Gráfico de barras: Reclamos por Marca
  const marcasCount = {};
  reclamos.forEach(r=>{ if(r.MARCA) marcasCount[r.MARCA] = (marcasCount[r.MARCA]||0)+Number(r['Reclamos de Clientes']); });
  const ctxMarcas = document.getElementById('marcasChart').getContext('2d');
  if(marcasChart) marcasChart.destroy();
  marcasChart = new Chart(ctxMarcas,{
    type:'bar',
    data:{labels:Object.keys(marcasCount), datasets:[{label:'Reclamos por Marca', data:Object.values(marcasCount), backgroundColor:Object.keys(marcasCount).map(()=>`hsl(${Math.random()*360},70%,60%)`)}]},
    options:{responsive:true, scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}
  });
}

// Eventos
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

// Inicialización
cargarSelects();
cargarDatos();



