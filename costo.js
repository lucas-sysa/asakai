const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyyAx5O4daGWXxH2gh4PqJgE5db7eG5sQmKkenBTllfSezoUCCef_eWcnsX6B12YYuNmw/exec';

// Filtros
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

// Charts
let paradasLineaChart, materiaPrimaChart, logisticaChart;

// Datos
let paradasLineaData = [], materiaPrimaData = [], logisticaData = [];

// Inicializar selects de fecha
function cargarSelects() {
  for (let d=1; d<=31; d++){
    const option = document.createElement('option');
    option.value = d.toString().padStart(2,'0');
    option.textContent = d;
    daySelect.appendChild(option);
  }
  for (let m=1; m<=12; m++){
    const option = document.createElement('option');
    option.value = m.toString().padStart(2,'0');
    option.textContent = m;
    monthSelect.appendChild(option);
  }
  for (let y=2000; y<=2030; y++){
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}

// Cargar datos desde Google Sheet
async function cargarDatos(){
  try {
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    paradasLineaData = data.paradasLinea;
    materiaPrimaData = data.porMateriaPrima;
    logisticaData = data.porLogistica;
    actualizarDashboard();
    crearGraficos();
    llenarTabla();
  } catch(e){
    console.error('Error cargando datos:', e);
  }
}

// Filtrar por fecha
function filtrarPorFecha(data){
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;
  return data.filter(row=>{
    const fecha = row.Fecha ? row.Fecha.split('T')[0].split('-') : [];
    const [fYear,fMonth,fDay] = fecha;
    return (!day || fDay===day) && (!month || fMonth===month) && (!year || fYear===year);
  });
}

// Actualizar dashboard
function actualizarDashboard(){
  const linea = filtrarPorFecha(paradasLineaData);

  const totalMinParadas = linea.reduce((sum,r)=> sum + Number(r['Cantidad de Min Paradas de Línea']||0),0);
  const totalParadasLinea = linea.reduce((sum,r)=> sum + Number(r['TOTAL PARADAS DE LÍNEA']||0),0);
  const ultimaParadaLinea = linea.length ? linea[linea.length-1]['ULTIMA PARADA DE LÍNEA'] : 0;

  document.getElementById('totalMinParadas').textContent = totalMinParadas;
  document.getElementById('totalParadasLinea').textContent = totalParadasLinea;
  document.getElementById('ultimaParadaLinea').textContent =ultimaParadaLinea;
}

// Crear gráficos
function crearGraficos(){
  const linea = filtrarPorFecha(paradasLineaData);
  const materia = filtrarPorFecha(materiaPrimaData);
  const logistica = filtrarPorFecha(logisticaData);

  // Paradas de Línea
  const ctxLinea = document.getElementById('paradasLineaChart').getContext('2d');
  if(paradasLineaChart) paradasLineaChart.destroy();
  paradasLineaChart = new Chart(ctxLinea,{
    type:'bar',
    data:{
      labels: linea.map(r=> r.Fecha.split('T')[0]),
      datasets:[{
        label:'Cantidad de Min Paradas de Línea',
        data: linea.map(r=>Number(r['Cantidad de Min Paradas de Línea']||0)),
        backgroundColor:'rgba(255,99,132,0.6)'
      }]
    },
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });

  // Por Materia Prima
  const ctxMateria = document.getElementById('materiaPrimaChart').getContext('2d');
  if(materiaPrimaChart) materiaPrimaChart.destroy();
  materiaPrimaChart = new Chart(ctxMateria,{
    type:'bar',
    data:{
      labels: materia.map(r=> r.Fecha.split('T')[0]),
      datasets:[{
        label:'Por Materia Prima',
        data: materia.map(()=>1), // solo cantidad de eventos
        backgroundColor:'rgba(54,162,235,0.6)'
      }]
    },
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });

  // Por Logística
  const ctxLog = document.getElementById('logisticaChart').getContext('2d');
  if(logisticaChart) logisticaChart.destroy();
  logisticaChart = new Chart(ctxLog,{
    type:'bar',
    data:{
      labels: logistica.map(r=> r.Fecha.split('T')[0]),
      datasets:[{
        label:'Por Logística',
        data: logistica.map(()=>1),
        backgroundColor:'rgba(255,206,86,0.6)'
      }]
    },
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });
}

// Llenar tabla
function llenarTabla(){
  const tbody = document.querySelector('#historialTable tbody');
  tbody.innerHTML = '';
  const maxLength = Math.max(paradasLineaData.length, materiaPrimaData.length, logisticaData.length);

  for(let i=0;i<maxLength;i++){
    const l = paradasLineaData[i] || {};
    const m = materiaPrimaData[i] || {};
    const log = logisticaData[i] || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${l.Fecha||m.Fecha||log.Fecha||''}</td>
                    <td>${l['Cantidad de Min Paradas de Línea']||''}</td>
                    <td>${l['Comentarios Relevantes']||''}</td>
                    <td>${l['TOTAL PARADAS DE LÍNEA']||''}</td>
                    <td>${l['ULTIMA PARADA DE LÍNEA']||''}</td>
                    <td>${m['Por MATERIA PRIMA']||''}</td>
                    <td>${m['Comentarios Relevantes']||''}</td>
                    <td>${log['Por LOGÍSTICA']||''}</td>
                    <td>${log['Comentarios Relevantes']||''}</td>`;
    tbody.appendChild(tr);
  }
}

// Eventos
filterBtn.addEventListener('click',()=>{
  actualizarDashboard();
  crearGraficos();
  llenarTabla();
});

resetBtn.addEventListener('click',()=>{
  daySelect.value=''; monthSelect.value=''; yearSelect.value='';
  actualizarDashboard();
  crearGraficos();
  llenarTabla();
});

// Inicialización
cargarSelects();
cargarDatos();
