document.addEventListener('DOMContentLoaded', () => {

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycby9hYEsl_Q_roWtaxuePLH_fN4tMmlwt5pRkGiWQ83457mBsfbUVrLKfuW3fWIQT6t_HQ/exec';

  const comentariosTbody = document.querySelector('#comentariosTable tbody');
  const daySelect = document.getElementById('daySelect');
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');
  const filterBtn = document.getElementById('filterBtn');
  const resetBtn = document.getElementById('resetBtn');

  let allData = [];
  let chart;
  let bajaChart;

  // ---------------------------------------
  // Cargar datos desde Google Sheet
  // ---------------------------------------
  async function cargarDatos() {
    try {
      const response = await fetch(SHEET_URL);
      const data = await response.json();

      // Normalizar fechas a ISO
      allData = data.map(row => ({
        ...row,
        Fecha: new Date(row.Fecha).toISOString()
      }));

      mostrarDatos(allData);
    } catch (error) {
      console.error('Error cargando datos desde Google Sheet:', error);
    }
  }

  // ---------------------------------------
  // Mostrar datos en la tabla de comentarios y actualizar dashboard
  // ---------------------------------------
  function mostrarDatos(data) {
    comentariosTbody.innerHTML = '';

    data.forEach((row, index) => {
      if (row['Comentarios 1'] || row['Comentarios 2']) {
        const fechaStr = new Date(row.Fecha).toISOString().split('T')[0];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${row['Comentarios 1'] || ''}</td>
          <td>${row['Comentarios 2'] || ''}</td>
          <td>${fechaStr}</td>
          <td>${row.Accidentes}</td>
          <td>${row.Incidentes}</td>
        `;
        comentariosTbody.appendChild(tr);
      }
    });

    actualizarDashboard(data);
  }

  // ---------------------------------------
  // Dashboard y gráfico de torta con porcentaje
  // ---------------------------------------
  function actualizarDashboard(data) {
    const sinAccidentes = data.filter(d => Number(d.Accidentes) === 0).length;
    const totalAccidentes = data.reduce((sum,d)=>sum+Number(d.Accidentes),0);
    const totalIncidentes = data.reduce((sum,d)=>sum+Number(d.Incidentes),0);

    document.getElementById('sinAccidentes').textContent = sinAccidentes;
    document.getElementById('totalAccidentes').textContent = totalAccidentes;
    document.getElementById('totalIncidentes').textContent = totalIncidentes;

    // Gráfico de torta por tipo de accidente
    const tipoCounts = {};
    data.forEach(d=>{
      const tipo = d['TIPO DE ACCIDENTE'];
      if(tipo) tipoCounts[tipo] = (tipoCounts[tipo]||0) + Number(d.Accidentes);
    });

    const labels = Object.keys(tipoCounts);
    const values = Object.values(tipoCounts);

    // Total para calcular porcentaje
    const total = values.reduce((a,b)=>a+b, 0);

    if (bajaChart) bajaChart.destroy();
    const ctx = document.getElementById('bajaChart').getContext('2d');
    bajaChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: labels.map(() => `hsl(${Math.random()*360},70%,60%)`)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const porcentaje = total ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${value} (${porcentaje}%)`;
              }
            }
          }
        }
      }
    });

    crearGrafico(data);
  }

  // ---------------------------------------
  // Gráfico de barras histórico
  // ---------------------------------------
  function crearGrafico(data) {
    const labels = data.map(d=>new Date(d.Fecha).toISOString().split('T')[0]);
    const accidentes = data.map(d=>Number(d.Accidentes));
    const incidentes = data.map(d=>Number(d.Incidentes));

    if (chart) chart.destroy();
    const ctx = document.getElementById('historialChart').getContext('2d');
    chart = new Chart(ctx,{
      type:'bar',
      data:{
        labels,
        datasets:[
          { label:'Accidentes', data:accidentes, backgroundColor:'rgba(255,99,132,0.6)' },
          { label:'Incidentes', data:incidentes, backgroundColor:'rgba(54,162,235,0.6)' }
        ]
      },
      options:{ responsive:true, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1, precision:0 }}}}
    });
  }

  // ---------------------------------------
  // Cargar selects de día, mes y año
  // ---------------------------------------
  function cargarSelects() {
    for(let d=1; d<=31; d++){
      const o = document.createElement('option'); o.value=d.toString().padStart(2,'0'); o.textContent=d; daySelect.appendChild(o);
    }
    for(let m=1; m<=12; m++){
      const o = document.createElement('option'); o.value=m.toString().padStart(2,'0'); o.textContent=m; monthSelect.appendChild(o);
    }
    for(let y=2000; y<=2030; y++){
      const o = document.createElement('option'); o.value=y; o.textContent=y; yearSelect.appendChild(o);
    }
  }

  // ---------------------------------------
  // Filtrar por fecha
  // ---------------------------------------
  function filtrarPorFecha(data) {
    const day=daySelect.value, month=monthSelect.value, year=yearSelect.value;
    return data.filter(row=>{
      const [fYear,fMonth,fDay]=new Date(row.Fecha).toISOString().split('T')[0].split('-');
      return (!day||fDay===day)&&(!month||fMonth===month)&&(!year||fYear===year);
    });
  }

  // ---------------------------------------
  // Eventos de filtros
  // ---------------------------------------
  filterBtn.addEventListener('click', ()=>{
    const filtered = filtrarPorFecha(allData);
    mostrarDatos(filtered);
  });

  resetBtn.addEventListener('click', ()=>{
    daySelect.value=''; monthSelect.value=''; yearSelect.value='';
    mostrarDatos(allData);
  });

  // ---------------------------------------
  // Inicializar
  // ---------------------------------------
  cargarSelects();
  cargarDatos();

});
