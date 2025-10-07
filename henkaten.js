const SHEET_URL = "https://script.google.com/macros/s/AKfycbzQqw4aL_YmNHNrXGjaviba3jSKCLAEt89ZLybHnwgfij89sT38jUnjwLphu3J3TOR7/exec"; // Reemplaza con tu URL de Google Apps Script

async function cargarDatos() {
  try {
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    data.forEach(row => {
      // Formatear fechas a YYYY-MM-DD
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

  } catch (err) {
    console.error("Error al cargar los datos:", err);
  }
}

cargarDatos();
