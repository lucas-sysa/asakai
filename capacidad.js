const API_URL = "https://script.google.com/macros/s/AKfycbwfZkegTN-KIWvJ3r6F5KFkIfEKPbbibkSJe-TeP_uXZxnXNzZ8PkqGtjBTKpJdZSif6A/exec";

// Dashboard y contenedores
const dashboardContainer = document.getElementById('dashboard-container');
const comentariosContainer = document.getElementById('comentarios-container');
const chartsContainer = document.getElementById('charts-container');

// Filtros
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

let allData = {
  disponibilidad: [],
  despacho: [],
  vs: [],
  rendimiento: [],
  reparadas: []
};

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

// Función fetch
async function getData(sheetName) {
  try {
    const res = await fetch(`${API_URL}?sheet=${sheetName}`);
    return await res.json();
  } catch (e) {
    console.error("Error cargando datos:", e);
    return [];
  }
}

// Filtrar por fecha
function filtrarPorFecha(data){
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;
  return data.filter(row=>{
    const [fYear,fMonth,fDay] = row.Fecha.split('T')[0].split('-');
    return (!day || fDay===day) && (!month || fMonth===month) && (!year || fYear===year);
  });
}

// Crear dashboard
function actualizarDashboard() {
  dashboardContainer.innerHTML = '';

  // Ejemplo: totales por dataset
  dashboardContainer.appendChild(crearItemDashboard('Disponibilidad Registros', filtrarPorFecha(allData.disponibilidad).length));
  dashboardContainer.appendChild(crearItemDashboard('Cumplimiento Despacho Registros', filtrarPorFecha(allData.despacho).length));
  dashboardContainer.appendChild(crearItemDashboard('Despachado vs Producido Registros', filtrarPorFecha(allData.vs).length));
  dashboardContainer.appendChild(crearItemDashboard('Rendimiento Registros', filtrarPorFecha(allData.rendimiento).length));
  dashboardContainer.appendChild(crearItemDashboard('Reparadas Retenidas Registros', filtrarPorFecha(allData.reparadas).length));
}

function crearItemDashboard(titulo, valor){
  const div = document.createElement('div');
  div.className = 'dashboard-item';
  div.innerHTML = `<h3>${titulo}</h3><p>${valor}</p>`;
  return div;
}

// Crear gráficos
let charts = [];
async function crearGraficos() {
  chartsContainer.innerHTML = '';

  function crearChart(id, tipo, data, datasets){
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 300;
    chartsContainer.appendChild(canvas);

    return new Chart(canvas.getContext('2d'), {
      type: tipo,
      data: { labels: data.map(d=>d.Fecha.split('T')[0]), datasets },
      options: { responsive: false }
    });
  }

  // Disponibilidad
  charts.push(crearChart('chartDisponibilidad','line',
    filtrarPorFecha(allData.disponibilidad),
    [
      {label:"Esperadas", data: filtrarPorFecha(allData.disponibilidad).map(d=>d["Cantidad de Unidades Esperadas"]), borderColor:"blue"},
      {label:"Producidas", data: filtrarPorFecha(allData.disponibilidad).map(d=>d["Cantidad de Unidades Producidas"]), borderColor:"green"}
    ]
  ));

  // Cumplimiento Despacho
  charts.push(crearChart('chartDespacho','bar',
    filtrarPorFecha(allData.despacho),
    [
      {label:"Planificadas", data: filtrarPorFecha(allData.despacho).map(d=>d["Cantidad de Unidades Planificadas"]), backgroundColor:"orange"},
      {label:"Despachadas", data: filtrarPorFecha(allData.despacho).map(d=>d["Cantidad de Unidades Despachadas"]), backgroundColor:"teal"}
    ]
  ));

  // Despachado vs Producido
  charts.push(crearChart('chartVs','line',
    filtrarPorFecha(allData.vs),
    [
      {label:"Producidas", data: filtrarPorFecha(allData.vs).map(d=>d["Cantidad de Unidades Producidas"]), borderColor:"blue"},
      {label:"Despachadas", data: filtrarPorFecha(allData.vs).map(d=>d["Cantidad de Unidades Despachadas"]), borderColor:"green"}
    ]
  ));

  // Rendimiento
  charts.push(crearChart('chartRendimiento','line',
    filtrarPorFecha(allData.rendimiento),
    [
      {label:"Te/Tr", data: filtrarPorFecha(allData.rendimiento).map(d=>d["Te/Tr"]), borderColor:"purple"}
    ]
  ));

  // Reparadas Retenidas
  charts.push(crearChart('chartReparadas','bar',
    filtrarPorFecha(allData.reparadas),
    [
      {label:"Reparadas", data: filtrarPorFecha(allData.reparadas).map(d=>d.REPARADAS), backgroundColor:"green"},
      {label:"Retenidas", data: filtrarPorFecha(allData.reparadas).map(d=>d.RETENIDAS), backgroundColor:"red"}
    ]
  ));
}

// Cargar todos los datos
async function cargarDatos() {
  allData.disponibilidad = await getData("Disponibilidad");
  allData.despacho = await getData("Cumplimiento Despacho");
  allData.vs = await getData("Despachado vs Producido");
  allData.rendimiento = await getData("Rendimiento");
  allData.reparadas = await getData("Reparadas Retenidas");

  actualizarDashboard();
  crearGraficos();
}

// Eventos filtros
filterBtn.addEventListener('click', ()=>{
  actualizarDashboard();
  crearGraficos();
});

resetBtn.addEventListener('click', ()=>{
  daySelect.value = '';
  monthSelect.value = '';
  yearSelect.value = '';
  actualizarDashboard();
  crearGraficos();
});

// Inicializar
cargarSelects();
cargarDatos();

