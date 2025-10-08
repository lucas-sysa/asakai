const SHEET_URL = 'https://script.google.com/macros/s/AKfycby9hYEsl_Q_roWtaxuePLH_fN4tMmlwt5pRkGiWQ83457mBsfbUVrLKfuW3fWIQT6t_HQ/exec';

const tableBody = document.querySelector('#historialTable tbody');
const daySelect = document.getElementById('daySelect');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const filterBtn = document.getElementById('filterBtn');
const resetBtn = document.getElementById('resetBtn');

let allData = [];
let chart;
let bajaChart;

// Cargar datos desde Google Sheet
async function cargarDatos() {
  try {
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    allData = data;
    mostrarDatos(allData);
    crearGrafico(allData);
    actualizarComentariosTabla(allData);
  } catch (error) {
    console.error('Error cargando datos desde Google Sheet:', error);
  }
}

// Mostrar datos en la tabla y actualizar dashboard
function mostrarDatos(data) {
  tableBody.innerHTML = '';
  data.forEach(row => {
    const fecha = row.Fecha.split('T')[0]; // YYYY-MM-DD
    const tr = document.createElement('tr');
    tr.innerHTML = 
      <td>${fecha}</td>
      <td>${row.Accidentes}</td>
      <td>${row.Incidentes}</td>
      <td>${row['TIPO DE ACCIDENTE']}</td>
      <td>${row['Dias Sin Accidentes']}</td>
      <td>${row.Record}</td>
      <td>${row['Comentarios 1']}</td>
      <td>${row['Comentarios 2']}</td>
    ;
    tableBody.appendChild(tr);
  });

  actualizarDashboard(data);
  actualizarComentariosTabla(data);
}

// Crear gráfico de barras
function crearGrafico(data) {
  const labels = data.map(d => d.Fecha.split('T')[0]);
  const accidentes = data.map(d => Number(d.Accidentes));
  const incidentes = data.map(d => Number(d.Incidentes));

  if (chart) chart.destroy();

  const ctx = document.getElementById('historialChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Accidentes',
          data: accidentes,
          backgroundColor: 'rgba(255, 99, 132, 0.6)'
        },
        {
          label: 'Incidentes',
          data: incidentes,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,   // Fuerza números enteros
            precision: 0   // Evita decimales
          }
        }
      }
    }
  });
}

// Actualizar dashboard y gráfico de torta por TIPO DE ACCIDENTE
function actualizarDashboard(data) {
  const sinAccidentes = data.filter(d => Number(d.Accidentes) === 0).length;
  const totalAccidentes = data.reduce((sum, d) => sum + Number(d.Accidentes), 0);
  const totalIncidentes = data.reduce((sum, d) => sum + Number(d.Incidentes), 0);

  document.getElementById('sinAccidentes').textContent = sinAccidentes;
  document.getElementById('totalAccidentes').textContent = totalAccidentes;
  document.getElementById('totalIncidentes').textContent = totalIncidentes;

  // Gráfico de torta por TIPO DE ACCIDENTE, sin "Desconocido"
  const tipoCounts = {};
  data.forEach(d => {
    const tipo = d['TIPO DE ACCIDENTE'];
    if(tipo) { // solo si tiene valor
      tipoCounts[tipo] = (tipoCounts[tipo] || 0) + Number(d.Accidentes);
    }
  });

  const labels = Object.keys(tipoCounts);
  const values = Object.values(tipoCounts);

  if (bajaChart) bajaChart.destroy();

  const ctx = document.getElementById('bajaChart').getContext('2d');
  bajaChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map(() => hsl(${Math.random()*360}, 70%, 60%))
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Tabla de comentarios junto al gráfico de torta
function actualizarComentariosTabla(data) {
  const tbody = document.querySelector('#comentariosTable tbody');
  tbody.innerHTML = '';

  data.forEach((row, index) => {
    if(row['Comentarios 1'] || row['Comentarios 2']){
      const tr = document.createElement('tr');
      tr.innerHTML = 
        <td>${index + 1}</td>
        <td>${row['Comentarios 1'] || ''}</td>
        <td>${row['Comentarios 2'] || ''}</td>
        <td>${row.Fecha.split('T')[0]}</td>
        <td>${row.Accidentes}</td>
        <td>${row.Incidentes}</td>
      ;
      tbody.appendChild(tr);
    }
  });
}

// Cargar opciones en los selects
function cargarSelects() {
  for (let d = 1; d <= 31; d++) {
    const option = document.createElement('option');
    option.value = d.toString().padStart(2, '0');
    option.textContent = d;
    daySelect.appendChild(option);
  }

  for (let m = 1; m <= 12; m++) {
    const option = document.createElement('option');
    option.value = m.toString().padStart(2, '0');
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

// Filtrar por fecha
function filtrarPorFecha(data) {
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;

  return data.filter(row => {
    const [fYear, fMonth, fDay] = row.Fecha.split('T')[0].split('-');
    return (!day || fDay === day) &&
           (!month || fMonth === month) &&
           (!year || fYear === year);
  });
}

// Eventos
filterBtn.addEventListener('click', () => {
  const filtered = filtrarPorFecha(allData);
  mostrarDatos(filtered);
  crearGrafico(filtered);
  actualizarComentariosTabla(filtered);
});

resetBtn.addEventListener('click', () => {
  daySelect.value = '';
  monthSelect.value = '';
  yearSelect.value = '';
  mostrarDatos(allData);
  crearGrafico(allData);
  actualizarComentariosTabla(allData);
});

// Inicializar
cargarSelects();
cargarDatos();

