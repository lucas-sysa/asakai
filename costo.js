const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyIZWOyTkhdSgeVgWwXH74ol558fBOOxigfrNmGEbxy6XPzt7Y7SnFvWhwMYBJ_7BeYzA/exec'; 

// Tablas ocultas
const paradasTable = document.querySelector('#paradasTable tbody');
const materiaPrimaTable = document.querySelector('#materiaPrimaTable tbody');
const logisticaTable = document.querySelector('#logisticaTable tbody');

// Dashboard
const dashboardContainer = document.getElementById('dashboard-container');
const comentariosContainer = document.getElementById('comentarios-container'); // Contenedor para comentarios

// Gráficos
let chartParadas, chartMateriaPrima, chartLogistica;

// Filtros
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

let allData = {
  paradas: [],
  materiaPrima: [],
  logistica: []
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

// Cargar datos desde Sheet
async function cargarDatos() {
  try {
    const response = await fetch(SHEET_URL);
    const data = await response.json();

    // Separar por hoja
    allData.paradas = data.filter(d => d.hoja === 'Paradas de Lineas');
    allData.materiaPrima = data.filter(d => d.hoja === 'Por Materia Prima');
    allData.logistica = data.filter(d => d.hoja === 'Por Logistica');

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
    const [fYear,fMonth,fDay] = row.Fecha.split('T')[0].split('-');
    return (!day || fDay===day) && (!month || fMonth===month) && (!year || fYear===year);
  });
}

// Mostrar datos en tablas ocultas y actualizar gráficos
function mostrarDatos() {
  llenarTabla(paradasTable, filtrarPorFecha(allData.paradas), ['Fecha','Paradas de Línea','Cantidad de Min Paradas de Línea','Comentarios Relevantes']);
  llenarTabla(materiaPrimaTable, filtrarPorFecha(allData.materiaPrima), ['Fecha','Por MATERIA PRIMA','Comentarios Relevantes']);
  llenarTabla(logisticaTable, filtrarPorFecha(allData.logistica), ['Fecha','Por LOGÍSTICA','Comentarios Relevantes']);
  crearGraficos();
}

// Llenar tablas (ocultas)
function llenarTabla(tbody, data, columnas){
  tbody.innerHTML = '';
  data.forEach((row,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td>` + columnas.map(c=>`<td>${c === 'Fecha' ? row[c].split('T')[0] : row[c] || ''}</td>`).join('');
    tbody.appendChild(tr);
  });
}

// Actualizar dashboard de indicadores
function actualizarDashboard() {
  dashboardContainer.innerHTML = '';

  const totalMinutos = allData.paradas.reduce((sum,d)=>sum + Number(d['Cantidad de Min Paradas de Línea'] || 0),0);
  const totalParadas = allData.paradas.length;
  const ultimaParada = allData.paradas.length > 0 ? allData.paradas[allData.paradas.length-1]['Fecha'].split('T')[0] : 'N/A';

  dashboardContainer.appendChild(crearItemDashboard('Paradas de Línea - Total Minutos', totalMinutos));
  dashboardContainer.appendChild(crearItemDashboard('Paradas de Línea - Total Paradas', totalParadas));
  dashboardContainer.appendChild(crearItemDashboard('Última Parada de Línea', ultimaParada));

  // Por Materia Prima
  const totalMateriaPrima = allData.materiaPrima.filter(d => d['Comentarios Relevantes']).length;
  dashboardContainer.appendChild(crearItemDashboard('Por Materia Prima - Comentarios Relevantes', totalMateriaPrima));

  // Por Logistica
  const totalLogistica = allData.logistica.filter(d => d['Comentarios Relevantes']).length;
  dashboardContainer.appendChild(crearItemDashboard('Por Logística - Comentarios Relevantes', totalLogistica));
}

function crearItemDashboard(titulo, valor){
  const div = document.createElement('div');
  div.className = 'dashboard-item';
  div.innerHTML = `<h3>${titulo}</h3><p>${valor}</p>`;
  return div;
}

// Crear gráficos de barras
function crearGraficos(){
  const chartsContainer = document.getElementById('charts-container');
  chartsContainer.innerHTML = '';

  chartParadas = crearBarChart(chartsContainer, 'Paradas de Línea', filtrarPorFecha(allData.paradas), 'Cantidad de Min Paradas de Línea');
  chartMateriaPrima = crearBarChart(chartsContainer, 'Por Materia Prima', filtrarPorFecha(allData.materiaPrima), 'Por MATERIA PRIMA');
  chartLogistica = crearBarChart(chartsContainer, 'Por Logística', filtrarPorFecha(allData.logistica), 'Por LOGÍSTICA');
}

function crearBarChart(container, titulo, data, valorKey){
  const canvas = document.createElement('canvas');

  // ancho y alto fijo
  canvas.width = 1000;  // ancho
  canvas.height = 300; // alto
  container.appendChild(canvas);

  const labels = data.map(d => d.Fecha.split('T')[0].split('-')[2]);
  const valores = data.map(d => Number(d[valorKey] || 0));

  const backgroundColors = valores.map((v,i)=>`hsl(${i*30 % 360}, 70%, 60%)`);
  const borderColors = valores.map((v,i)=>`hsl(${i*30 % 360}, 70%, 40%)`);

  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: titulo,
        data: valores,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: false, // respetar width/height del canvas
      plugins: {
        legend: { 
          display: true, 
          position: 'bottom', 
          labels: { 
            boxWidth: 15, 
            padding: 10,
            font: { size: 14 }  
          } 
        },
        tooltip: { enabled: true },
      },
      animation: { duration: 1000, easing: 'easeOutQuart' },
      scales: {
        x: { 
          grid: { display: false },
          ticks: { font: { size: 14 } } 
        },
        y: { 
          beginAtZero: true, 
          ticks: { stepSize: 1, precision: 0, font: { size: 14 } },
          grid: { color: 'rgba(0,0,0,0.05)' } 
        }
      }
    }
  });
}

// Mostrar comentarios filtrados por fecha (solo si hay)
function mostrarComentarios() {
  comentariosContainer.innerHTML = '';

  function crearSeccion(titulo, data, columnaComentario){
    const filtered = filtrarPorFecha(data).filter(d => d[columnaComentario]);
    if(filtered.length){
      const section = document.createElement('div');
      section.className = 'comentario-section';
      section.innerHTML = `<h3>${titulo}</h3>`;
      filtered.forEach(r=>{
        const card = document.createElement('div');
        card.className = 'comentario-card';
        card.innerHTML = `<strong>${r.Fecha.split('T')[0]}</strong><p>${r[columnaComentario]}</p>`;
        section.appendChild(card);
      });
      comentariosContainer.appendChild(section);
    }
  }

  crearSeccion('Paradas de Línea', allData.paradas, 'Comentarios Relevantes');
  crearSeccion('Por Materia Prima', allData.materiaPrima, 'Comentarios Relevantes');
  crearSeccion('Por Logística', allData.logistica, 'Comentarios Relevantes');
}

// Eventos filtros
filterBtn.addEventListener('click', ()=>{
  mostrarDatos();
  mostrarComentarios();
});
resetBtn.addEventListener('click', ()=>{
  daySelect.value = '';
  monthSelect.value = '';
  yearSelect.value = '';
  mostrarDatos();
  mostrarComentarios();
});

// Inicializar
cargarSelects();
cargarDatos();
