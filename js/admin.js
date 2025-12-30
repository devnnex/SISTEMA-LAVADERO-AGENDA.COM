const lista = document.getElementById("lista");



/* ===============================
   LAVADOS ACTIVOS
   =============================== */
function cargarActivos() {
  fetch(`${API_URL}?action=activos`)
    .then(res => res.json())
    .then(data => {
      lista.innerHTML = "";

      if (!Array.isArray(data) || !data.length) {
        lista.innerHTML = "<p>No hay lavados activos</p>";
        return;
      }

      data.forEach(l => {
        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
          <b>Placa:</b> ${l.placa}<br>
          <b>Servicio:</b> ${l.servicio}<br>
          <b>Trabajador:</b> ${l.trabajador}<br>
          <b>Precio:</b> $${l.precio}<br>
          <small>${new Date(l.hora).toLocaleTimeString()}</small>
          <button class="confirm">Confirmar lavado</button>
        `;

        div.querySelector("button").onclick = () => confirmarLavado(l.id);
        lista.appendChild(div);
      });
    })
    .catch(err => {
      console.error("Error activos:", err);
      lista.innerHTML = "<p>Error cargando lavados</p>";
    });
}

function confirmarLavado(id) {
  if (!confirm("¿Confirmar lavado terminado?")) return;

  fetch(`${API_URL}?action=confirmar&id=${id}`)
    .then(() => {
      cargarActivos();
      cargarIngresos();
    });
}

/* ===============================
   CREAR SERVICIO
   =============================== */
document.getElementById("btnCrearServicio").onclick = () => {
  const nombre = srvNombre.value.trim();
  const precio = srvPrecio.value;

  if (!nombre || !precio) return alert("Completa los datos");

  fetch(`${API_URL}?action=crearServicio&nombre=${encodeURIComponent(nombre)}&precio=${precio}`)
    .then(res => res.json())
    .then(r => {
      if (r.ok) {
        alert("Servicio creado");
        srvNombre.value = "";
        srvPrecio.value = "";
      }
    });
};

/* ===============================
   CREAR TRABAJADOR
   =============================== */
document.getElementById("btnCrearTrabajador").onclick = () => {
  const nombre = trabNombre.value.trim();
  if (!nombre) return alert("Nombre requerido");

  fetch(`${API_URL}?action=crearTrabajador&nombre=${encodeURIComponent(nombre)}`)
    .then(res => res.json())
    .then(r => {
      if (r.ok) {
        alert("Trabajador creado");
        trabNombre.value = "";
      }
    });
};

/* ===============================
   NAVEGACIÓN SPA
   =============================== */
document.querySelectorAll(".sidebar button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".section").forEach(s =>
      s.classList.remove("active")
    );
    document.getElementById(btn.dataset.section).classList.add("active");
  };
});

/* ===============================
   INGRESOS + KPIs
   =============================== */
const tabla = document.getElementById("tablaIngresos");
const kpiServicios = document.getElementById("kpiServicios");
const kpiHoy = document.getElementById("kpiHoy");
const kpiMes = document.getElementById("kpiMes");
const buscador = document.getElementById("buscador");

let ingresosDetalle = [];

function cargarIngresos() {
  fetch(`${API_URL}?action=ingresos`)
    .then(res => res.json())
    .then(data => {

      kpiServicios.textContent = data.hoy.servicios;
      kpiHoy.textContent = `$${data.hoy.total}`;
      kpiMes.textContent = `$${data.mes.total}`;

      ingresosDetalle = data.detalle;
      renderTablaIngresos();
    })
    .catch(err => console.error("Error ingresos:", err));
}

function renderTablaIngresos() {
  const q = buscador.value.toLowerCase();
  tabla.innerHTML = "";

  ingresosDetalle
    .filter(i =>
      i.placa.toLowerCase().includes(q) ||
      i.trabajador.toLowerCase().includes(q)
    )
    .forEach(i => {
      tabla.innerHTML += `
        <tr>
          <td>${new Date(i.fecha).toLocaleDateString()}</td>
          <td>${i.placa}</td>
          <td>${i.servicio}</td>
          <td>${i.trabajador}</td>
          <td>$${i.precio}</td>
        </tr>
      `;
    });
}

buscador.oninput = renderTablaIngresos;

/* ===============================
   INIT
   =============================== */
cargarActivos();
cargarIngresos();
setInterval(cargarActivos, 10000);
