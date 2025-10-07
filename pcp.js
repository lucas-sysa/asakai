const SHEET_URL = "https://script.google.com/macros/s/AKfycbwBTLbeH3cMl3GRxuY6pi5VGaneqLv1TEE_KPLvB93Q3gz4BTHgksn4LCXVzE6b4w-foQ/exec";

// Tablas ocultas
const produccionTable = document.querySelector('#produccionTable tbody');
const cumplimientoTable = document.querySelector('#cumplimientoTable tbody');
const pendienteTable = document.querySelector('#pendienteTable tbody');
const entregasTable = document.querySelector('#entregasTable tbody');
const despachoTable = document.querySelector('#despachoTable tbody');
const entregasTotalesTable = document.querySelector('#entregasTotalesTable tbody');

// Dashboard
const dashboardContainer = document.getElementById('dashboard-container');
const comentariosContainer = document.getElementById('comentarios-container');

// Gráficos
let chartProduccion, chartCumplimiento, chartPendiente, chartEntregas, chartDespacho, chartEntregasTotales;

// Filtros
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

let allData = {
  PRODUCCION: [],
  CUMPLIMIENTO: [],
  PENDIENTE: [],
  ENTREGAS: [],
  DESPACHO: [],
  "ENTREGAS TOTALES": []
};

// --- FUNCIONES ---

// Formatear fechas a DD/MM/YYYY
function formatDate(fechaISO) {
  const date = new Date(fechaISO);
  const day = String(date.getDate()).padStart(2,'0');
  const month = String(date.getMonth()+1).padStart(2,'0'); // enero=0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Cargar selects de fecha
function cargarSelects() {
  for(let d=1; d<=31; d++){
    const option = document.createElement('option');
    option.value = d.toString().padStart(2,'0');
    option.textContent = d;
    daySelect.appendChild(option);
  }
  for(let m=1; m<=12; m++){
    const option = document.createElement('option');
    option.value = m.toString().padStart(2,'0');
    option.textContent = m;
    monthSelect.appendChild(option);
  }
  for(let y=2000; y<=2030; y++){
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}

// Cargar datos desde Sheet
async function cargarDatos() {
  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();

    allData.PRODUCCION = data.PRODUCCION || [];
    allData.CUMPLIMIENTO = data.CUMPLIMIENTO || [];
    allData.PENDIENTE = data.PENDIENTE || [];
    allData.ENTREGAS = data.ENTREGAS || [];
    allData.DESPACHO = data.DESPACHO || [];
    allData["ENTREGAS TOTALES"] = data["ENTREGAS TOTALES"] || [];

    mostrarDatos();
    actualizarDashboard();
    mostrarComentarios();
  } catch(err){
    console.error('Error cargando datos:', err);
  }
}

// Filtrar por fecha
function filtrarPorFecha(data){
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;
  return data.filter(row=>{
    const [fYear,fMonth,fDay] = row.FECHA.split('-');
    return (!day || fDay===day) && (!month || fMonth===month) && (!year || fYear===year);
  });
}

// Mostrar datos en tablas ocultas y actualizar gráficos
function mostrarDatos() {
  llenarTabla(produccionTable, filtrarPorFecha(allData.PRODUCCION), ['FECHA','PRODUCIDO REAL ACUMULADO','PLANIFICADO MENSUAL','Comentarios Relevantes']);
  llenarTabla(cumplimientoTable, filtrarPorFecha(allData.CUMPLIMIENTO), ['FECHA','REAL','PROYECTO','Comentarios Relevantes']);
  llenarTabla(pendienteTable, filtrarPorFecha(allData.PENDIENTE), ['FECHA','ENTREGAS LESA','ENTREGAS MAGNY','PENDIENTE','Comentarios Relevantes']);
  llenarTabla(entregasTable, filtrarPorFecha(allData.ENTREGAS), ['FECHA','ENTREGAS TOTALES','ENTREGAS PLANIFICADAS','Comentarios Relevantes']);
  llenarTabla(despachoTable, filtrarPorFecha(allData.DESPACHO), ['FECHA','DESPACHOS ACUMULADOS','PRODUCCIÓN ACUMULADA','Comentarios Relevantes']);
  llenarTabla(entregasTotalesTable, filtrarPorFecha(allData["ENTREGAS TOTALES"]), ['FECHA','PRODUCCIÓN ACUMULADA','ENTREGAS TOTALES','Comentarios Relevantes']);
  crearGraficos();
}

// Llenar tablas (ocultas)
function llenarTabla(tbody, data, columnas){
  tbody.innerHTML = '';
  data.forEach((row,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td>` + columnas.map(c=>`<td>${row[c] || ''}</td>`).join('');
    tbody.appendChild(tr);
  });
}

// Actualizar dashboard
function actualizarDashboard() {
  dashboardContainer.innerHTML = '';

  function crearItem(titulo, valor){
    const div = document.createElement('div');
    div.className = 'dashboard-item';
    div.innerHTML = `<h3>${titulo}</h3><p>${valor}</p>`;
    return div;
  }

  dashboardContainer.appendChild(crearItem('Producción - Registros', filtrarPorFecha(allData.PRODUCCION).length));
  dashboardContainer.appendChild(crearItem('Cumplimiento - Registros', filtrarPorFecha(allData.CUMPLIMIENTO).length));
  dashboardContainer.appendChild(crearItem('Pendiente - Registros', filtrarPorFecha(allData.PENDIENTE).length));
  dashboardContainer.appendChild(crearItem('Entregas - Registros', filtrarPorFecha(allData.ENTREGAS).length));
  dashboardContainer.appendChild(crearItem('Despacho - Registros', filtrarPorFecha(allData.DESPACHO).length));
  dashboardContainer.appendChild(crearItem('Entregas Totales - Registros', filtrarPorFecha(allData["ENTREGAS TOTALES"]).length));
}

// Crear gráficos
function crearGraficos(){
  const container = document.getElementById('charts-container');
  container.innerHTML = '';

  function crearChart(id, titulo, data, keys, tipo='line', colores=[]){
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const datasets = keys.map((k,i)=>({
      label: k,
      data: data.map(d=>d[k] || 0),
      borderColor: colores[i] || '#007BFF',
      backgroundColor: colores[i] || '#007BFF',
      fill: tipo==='line' ? false : true
    }));
    return new Chart(canvas.getContext('2d'), { 
      type: tipo, 
      data:{ labels: data.map(d=>formatDate(d.FECHA)), datasets }, 
      options:{ responsive:false } 
    });
  }

  chartProduccion = crearChart('produccionChart','Producción', filtrarPorFecha(allData.PRODUCCION), ['PRODUCIDO REAL ACUMULADO','PLANIFICADO MENSUAL'], 'line',['#007BFF','#ff4136']);
  chartCumplimiento = crearChart('cumplimientoChart','Cumplimiento', filtrarPorFecha(allData.CUMPLIMIENTO), ['REAL','PROYECTO'],'bar',['#2ecc40','#ff851b']);
  chartPendiente = crearChart('pendienteChart','Pendiente', filtrarPorFecha(allData.PENDIENTE), ['ENTREGAS LESA','ENTREGAS MAGNY','PENDIENTE'],'bar',['#007BFF','#b10dc9','#ff4136']);
  chartEntregas = crearChart('entregasChart','Entregas', filtrarPorFecha(allData.ENTREGAS), ['ENTREGAS TOTALES','ENTREGAS PLANIFICADAS'],'line',['#17a2b8','#ffdc00']);
  chartDespacho = crearChart('despachoChart','Despacho', filtrarPorFecha(allData.DESPACHO), ['DESPACHOS ACUMULADOS','PRODUCCIÓN ACUMULADA'],'line',['#2ecc40','#ff4136']);
  chartEntregasTotales = crearChart('entregasTotalesChart','Entregas Totales', filtrarPorFecha(allData["ENTREGAS TOTALES"]), ['PRODUCCIÓN ACUMULADA','ENTREGAS TOTALES'],'bar',['#007BFF','#ff851b']);
}

// Mostrar comentarios
function mostrarComentarios(){
  comentariosContainer.innerHTML = '';
  function crearSeccion(titulo, data, columna){
    const filtered = filtrarPorFecha(data).filter(d=>d[columna]);
    if(filtered.length){
      const section = document.createElement('div');
      section.className = 'comentario-section';
      section.innerHTML = `<h3>${titulo}</h3>`;
      filtered.forEach(r=>{
        const card = document.createElement('div');
        card.className='comentario-card';
        card.innerHTML = `<strong>${formatDate(r.FECHA)}</strong><p>${r[columna]}</p>`;
        section.appendChild(card);
      });
      comentariosContainer.appendChild(section);
    }
  }
  crearSeccion('Producción', allData.PRODUCCION,'Comentarios Relevantes');
  crearSeccion('Cumplimiento', allData.CUMPLIMIENTO,'Comentarios Relevantes');
  crearSeccion('Pendiente', allData.PENDIENTE,'Comentarios Relevantes');
  crearSeccion('Entregas', allData.ENTREGAS,'Comentarios Relevantes');
  crearSeccion('Despacho', allData.DESPACHO,'Comentarios Relevantes');
  crearSeccion('Entregas Totales', allData["ENTREGAS TOTALES"],'Comentarios Relevantes');
}

// --- EVENTOS ---
filterBtn.addEventListener('click', ()=>{
  mostrarDatos();
  actualizarDashboard();
  mostrarComentarios();
});

resetBtn.addEventListener('click', ()=>{
  daySelect.value = '';
  monthSelect.value = '';
  yearSelect.value = '';
  mostrarDatos();
  actualizarDashboard();
  mostrarComentarios();
});

// --- INICIALIZACIÓN ---
cargarSelects();
cargarDatos();

