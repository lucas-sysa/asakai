const SHEET_URL = "https://script.google.com/macros/s/AKfycbz-P14Q1aq_ZQcyHHrzF2_WwoJvX9OSlqx0ryV7p9adSB2zYf3SLxT9g9DoGwmtB1A7/exec"; 

// Contenedores
const tbody = document.querySelector("#dataTable tbody");
const dashboardContainer = document.getElementById("dashboard-container");
const chartsContainer = document.getElementById("charts-container");
const tableContainer = document.querySelector(".table-container"); // Para mostrar la tabla

// Filtros de fecha
let daySelect, monthSelect, yearSelect;

// Almacenamiento de datos
let allData = [];

// Inicializar filtros
function crearFiltros() {
  const filterDiv = document.createElement("div");
  filterDiv.className = "filters";

  // Día
  daySelect = document.createElement("select");
  const defaultDay = document.createElement("option");
  defaultDay.value = "";
  defaultDay.textContent = "Día";
  daySelect.appendChild(defaultDay);
  for(let d=1; d<=31; d++){
    const opt = document.createElement("option");
    opt.value = d.toString().padStart(2,'0');
    opt.textContent = d;
    daySelect.appendChild(opt);
  }
  filterDiv.appendChild(daySelect);

  // Mes
  monthSelect = document.createElement("select");
  const defaultMonth = document.createElement("option");
  defaultMonth.value = "";
  defaultMonth.textContent = "Mes";
  monthSelect.appendChild(defaultMonth);
  for(let m=1; m<=12; m++){
    const opt = document.createElement("option");
    opt.value = m.toString().padStart(2,'0');
    opt.textContent = m;
    monthSelect.appendChild(opt);
  }
  filterDiv.appendChild(monthSelect);

  // Año
  yearSelect = document.createElement("select");
  const defaultYear = document.createElement("option");
  defaultYear.value = "";
  defaultYear.textContent = "Año";
  yearSelect.appendChild(defaultYear);
  const currentYear = new Date().getFullYear();
  for(let y=currentYear-5; y<=currentYear+5; y++){
    const opt = document.createElement("option");
    opt.value = y.toString();
    opt.textContent = y.toString();
    yearSelect.appendChild(opt);
  }
  filterDiv.appendChild(yearSelect);

  // Botón reset
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Restablecer";
  resetBtn.addEventListener("click", ()=> {
    daySelect.value = "";
    monthSelect.value = "";
    yearSelect.value = "";
    actualizarVista();
  });
  filterDiv.appendChild(resetBtn);

  // Actualizar automáticamente al cambiar un filtro
  daySelect.addEventListener("change", actualizarVista);
  monthSelect.addEventListener("change", actualizarVista);
  yearSelect.addEventListener("change", actualizarVista);

  // Insertar filtros antes del dashboard
  document.body.insertBefore(filterDiv, dashboardContainer);
}

// Filtrar datos por fecha
function filtrarDatos(data){
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;

  return data.filter(row=>{
    if(!row.FECHA) return false;
    const [fYear, fMonth, fDay] = row.FECHA.split("T")[0].split("-");
    return (!day || fDay===day) && (!month || fMonth===month) && (!year || fYear===year);
  });
}

// Cargar datos desde Google Sheet
async function cargarDatos() {
  try {
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    allData = data;
    tableContainer.style.display = "block"; // Mostrar la tabla
    crearFiltros();
    actualizarVista();
  } catch(err){
    console.error("Error al cargar los datos:", err);
  }
}

// Actualizar tabla, dashboard y gráficos
function actualizarVista() {
  const datosFiltrados = filtrarDatos(allData);
  mostrarTabla(datosFiltrados);
  actualizarDashboard(datosFiltrados);
  crearGraficos(datosFiltrados);
}

// Mostrar datos en la tabla
function mostrarTabla(data){
  tbody.innerHTML = "";
  data.forEach(row => {
    const fecha = row.FECHA ? row.FECHA.split("T")[0] : "";
    const plazo = row.PLAZO ? row.PLAZO.split("T")[0] : "";
    const fechaInicial = row["FECHA INICIAL"] ? row["FECHA INICIAL"].split("T")[0] : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.NUMERO || ""}</td>
      <td>${fecha}</td>
      <td>${row["PUNTO DE CAMBIO"] || ""}</td>
      <td>${row.MS || ""}</td>
      <td>${row.ACCIÓN || ""}</td>
      <td>${row.RESPONSABLE || ""}</td>
      <td>${plazo}</td>
      <td>${row.STATUS || ""}</td>
      <td>${fechaInicial}</td>
      <td>${row["Comentarios Generales"] || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Dashboard dinámico
function actualizarDashboard(data){
  dashboardContainer.innerHTML = "";

  const totalCambios = data.length;
  const ultimaFecha = data.length ? data[data.length-1].FECHA.split("T")[0] : "N/A";

  const statusCounts = data.reduce((acc,row)=>{
    const status = row.STATUS || "Sin Status";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  },{});

  dashboardContainer.appendChild(crearItemDashboard("Total Cambios", totalCambios));
  dashboardContainer.appendChild(crearItemDashboard("Última Fecha de Cambio", ultimaFecha));
  for(let status in statusCounts){
    dashboardContainer.appendChild(crearItemDashboard(`Status: ${status}`, statusCounts[status]));
  }
}

function crearItemDashboard(titulo, valor){
  const div = document.createElement("div");
  div.className = "dashboard-item";
  div.innerHTML = `<h3>${titulo}</h3><p>${valor}</p>`;
  return div;
}

// Crear gráfico de barras por STATUS
let chartInstance;
function crearGraficos(data){
  chartsContainer.innerHTML = "";
  if(chartInstance) chartInstance.destroy();

  const statusCounts = data.reduce((acc,row)=>{
    const status = row.STATUS || "Sin Status";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  },{});

  const canvas = document.createElement("canvas");
  chartsContainer.appendChild(canvas);

  chartInstance = new Chart(canvas.getContext("2d"),{
    type: "bar",
    data: {
      labels: Object.keys(statusCounts),
      datasets: [{
        label: "Cantidad por Status",
        data: Object.values(statusCounts),
        backgroundColor: Object.keys(statusCounts).map((_,i)=>`hsl(${i*60},70%,60%)`),
        borderColor: Object.keys(statusCounts).map((_,i)=>`hsl(${i*60},70%,40%)`),
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: false,
      scales: {
        y: { beginAtZero: true, stepSize: 1 }
      }
    }
  });
}

// Inicializar
cargarDatos();


