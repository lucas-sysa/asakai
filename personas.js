const SHEET_URL = "https://script.google.com/macros/s/AKfycbw-5GbTGt-2jWy28_CdKhBCDTtl2ylKks7j-4UkcdRdRgu5s7uikvDA9IyFXuTjna2K/exec";

// Tabla oculta
const ausentismoTable = document.querySelector("#ausentismoTable tbody");

// Dashboard y comentarios
const dashboardContainer = document.getElementById("dashboard-container");
const comentariosContainer = document.getElementById("comentarios-container");

// Gráfico
let ausentismoChart;

// Filtros
const daySelect = document.getElementById("daySelect");
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");
const filterBtn = document.getElementById("filterBtn");
const resetBtn = document.getElementById("resetBtn");

let allData = [];

// Cargar selects de fecha
function cargarSelects() {
  for (let d = 1; d <= 31; d++) {
    const option = document.createElement("option");
    option.value = d.toString().padStart(2, "0");
    option.textContent = d;
    daySelect.appendChild(option);
  }
  for (let m = 1; m <= 12; m++) {
    const option = document.createElement("option");
    option.value = m.toString().padStart(2, "0");
    option.textContent = m;
    monthSelect.appendChild(option);
  }
  for (let y = 2000; y <= 2030; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}

// Cargar datos desde Sheet
async function cargarDatos() {
  try {
    const res = await fetch(SHEET_URL);
    allData = await res.json();
    mostrarDatos();
    actualizarDashboard();
    crearGraficos();
    mostrarComentarios();
  } catch (err) {
    console.error("Error cargando datos:", err);
  }
}

// Filtrar por fecha
function filtrarPorFecha(data) {
  const day = daySelect.value;
  const month = monthSelect.value;
  const year = yearSelect.value;
  return data.filter((row) => {
    const [fYear, fMonth, fDay] = row.FECHA.split("T")[0].split("-");
    return (!day || fDay === day) && (!month || fMonth === month) && (!year || fYear === year);
  });
}

// Mostrar datos en tabla oculta
function mostrarDatos() {
  llenarTabla(ausentismoTable, filtrarPorFecha(allData), ["FECHA", "TOTAL", "GESTIONABLE"]);
}

// Llenar tabla
function llenarTabla(tbody, data, columnas) {
  tbody.innerHTML = "";
  data.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${i + 1}</td>` +
      columnas.map((c) => `<td>${c === "FECHA" ? row[c].split("T")[0] : row[c] || 0}</td>`).join("");
    tbody.appendChild(tr);
  });
}

// Actualizar dashboard
function actualizarDashboard() {
  dashboardContainer.innerHTML = "";

  const filteredData = filtrarPorFecha(allData);

  const totalPersonas = filteredData.reduce((sum, d) => sum + Number(d.TOTAL || 0), 0);
  const totalGestionable = filteredData.reduce((sum, d) => sum + Number(d.GESTIONABLE || 0), 0);
  const ultimaFecha = filteredData.length > 0 ? filteredData[filteredData.length - 1].FECHA.split("T")[0] : "N/A";

  // Calcular porcentaje
  const porcentajeGestionable = totalPersonas ? ((totalGestionable / totalPersonas) * 100).toFixed(2) : 0;

  dashboardContainer.appendChild(crearItemDashboard("Total Personas", totalPersonas));
  dashboardContainer.appendChild(crearItemDashboard("Total Gestionables (%)", porcentajeGestionable + "%"));
  dashboardContainer.appendChild(crearItemDashboard("Última Fecha Registrada", ultimaFecha));
}

function crearItemDashboard(titulo, valor) {
  const div = document.createElement("div");
  div.className = "dashboard-item";
  div.innerHTML = `<h3>${titulo}</h3><p>${valor}</p>`;
  return div;
}

// Crear gráfico
function crearGraficos() {
  const chartsContainer = document.getElementById("charts-container");
  chartsContainer.innerHTML = "";

  const dataFiltrada = filtrarPorFecha(allData);
  const labels = dataFiltrada.map((d) => d.FECHA.split("T")[0]);
  const total = dataFiltrada.map((d) => Number(d.TOTAL || 0));
  const gestionable = dataFiltrada.map((d) => Number(d.GESTIONABLE || 0));

  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 300;
  chartsContainer.appendChild(canvas);

  ausentismoChart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Total",
          data: total,
          borderColor: "red",
          backgroundColor: "rgba(255,0,0,0.2)",
          fill: true,
        },
        {
          label: "Gestionable",
          data: gestionable,
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.2)",
          fill: true,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: "bottom" },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

// Mostrar comentarios
function mostrarComentarios() {
  comentariosContainer.innerHTML = "";

  const filtered = filtrarPorFecha(allData).filter((d) => d.COMENTARIOS);
  if (filtered.length) {
    const section = document.createElement("div");
    section.className = "comentario-section";
    section.innerHTML = `<h3>Comentarios</h3>`;
    filtered.forEach((r) => {
      const card = document.createElement("div");
      card.className = "comentario-card";
      card.innerHTML = `<strong>${r.FECHA.split("T")[0]}</strong><p>${r.COMENTARIOS}</p>`;
      section.appendChild(card);
    });
    comentariosContainer.appendChild(section);
  }
}

// Eventos filtros
filterBtn.addEventListener("click", () => {
  mostrarDatos();
  actualizarDashboard();
  crearGraficos();
  mostrarComentarios();
});

resetBtn.addEventListener("click", () => {
  daySelect.value = "";
  monthSelect.value = "";
  yearSelect.value = "";
  mostrarDatos();
  actualizarDashboard();
  crearGraficos();
  mostrarComentarios();
});

// Inicializar
cargarSelects();
cargarDatos();



