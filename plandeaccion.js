const SHEET_URL = "https://script.google.com/macros/s/AKfycbxUNV63Bir5kGr94UK1hiYF9nY7vQ73enmHOgVCRnugEpub7jXcUmEln7PVggVc1CSqJw/exec";

async function cargarDatos() {
  try {
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    data.forEach(row => {
      // Convertimos las fechas a solo YYYY-MM-DD
      const fechaSolo = row.FECHA ? row.FECHA.split("T")[0] : "";
      const nuevaFechaSolo = row["NUEVA FECHA"] ? row["NUEVA FECHA"].split("T")[0] : "";
      const plazoSolo = row.PLAZO ? row.PLAZO.split("T")[0] : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.NUMERO || ""}</td>
        <td>${fechaSolo}</td>
        <td>${row["PROBLEMA IDENTIFICADO"] || ""}</td>
        <td>${row.ACCION || ""}</td>
        <td>${row.RESPONSABLE || ""}</td>
        <td>${plazoSolo}</td>
        <td>${row.STATUS || ""}</td>
        <td>${nuevaFechaSolo}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error al cargar los datos:", err);
  }
}

cargarDatos();

cargarDatos();


