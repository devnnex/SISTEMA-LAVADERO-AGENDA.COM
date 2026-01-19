/* ===============================
   RECOGIDAS PROGRAMADAS
   =============================== */
const listaRecogidas = document.getElementById("listaRecogidas");
let recogidasData = [];


/* ===============================
   SERVICIOS
   =============================== */
let serviciosData = [];

/* ===============================
   TRABAJADORES
   =============================== */
let trabajadoresData = [];

/* ===============================
   LIQUIDACIONES (estado)
=============================== */
let liquidacionesData = {};


//Variables globales de los graficos de ganancias/ingresos
let chartIngresosMes = null;
let chartTopServicios = null;





/* ===============================
   LAVADOS ACTIVOS
   =============================== */

const lista = document.getElementById("lista");
const buscadorActivos = document.getElementById("buscadorActivos");



const trabNombre = document.getElementById("trabNombre");
const trabCorreo = document.getElementById("trabCorreo");

let activosData = [];

/* ---------- Cargar desde API (solo fetch) ---------- */
function cargarActivos() {
  fetch(`${API_URL}?action=activos`)
    .then(res => res.json())
    .then(data => {
      activosData = Array.isArray(data) ? data : [];
      renderActivos();
      cargarTrabajadores();// REFRESCA TABLA TRABAJADORES

    })
    .catch(err => {
      console.error("Error activos:", err);
      lista.innerHTML = "<p>Error cargando lavados</p>";
    });
}

/* ---------- Render + filtro (buscador) ---------- */
function renderActivos() {
  const q = buscadorActivos.value.toLowerCase().trim();
  const nuevosIds = new Set();

  activosData
    .filter(l => l.placa.toLowerCase().includes(q))
    .forEach(l => {
      nuevosIds.add(String(l.id));

      let item = lista.querySelector(`[data-id="${l.id}"]`);

      if (!item) {
        item = document.createElement("div");
        item.className = "item";
        item.dataset.id = l.id;
        lista.appendChild(item);
      }

      item.innerHTML = `
  <b>Placa:</b> ${l.placa}<br>
  <b>Servicio:</b> ${l.servicio}<br>
  <b>Trabajador:</b> ${l.trabajador}<br>
  <b>Precio:</b> $${l.precio}<br>
  <small>${new Date(l.hora).toLocaleTimeString()}</small>

  <div class="acciones">
    <button class="print">🧾 Recibo</button>
    <button class="confirm">Confirmar lavado</button>
  </div>
`;


      item.querySelector("button").onclick = () => confirmarLavado(l.id);
      item.querySelector(".print").onclick = () => imprimirRecibo(l);
      item.querySelector(".confirm").onclick = () => confirmarLavado(l.id);

    });

  // 🧹 Eliminar solo los que ya no existen
  [...lista.children].forEach(el => {
    if (!nuevosIds.has(el.dataset.id)) el.remove();
  });

  if (!lista.children.length) {
    lista.innerHTML = "<p>No hay lavados activos</p>";
  }
}

/* ---------- IMPRIMIR RECIBO A4 ---------- */
function imprimirRecibo(servicio) {
  const win = window.open("", "PRINT", "width=1600,height=1800");

  win.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>RECIBO</title>

<style>
  @page {
    size: A4;
    margin: 6mm;
  }

  @media print {
    * {
      box-sizing: border-box;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: "Courier New", monospace;
      font-size: 30px; /* +2px */
      font-weight: 800;
      color: #000;
      background: #fff;
    }

    .recibo {
      width: 100%;
      height: 100%;
      padding: 6mm;
    }

    .center {
      text-align: center;
    }

    /* LOGO */
    .logo {
      max-width: 320px;
      margin: 0 auto 16px;
      display: block;
    }

    /* TITULOS */
    .title {
      font-size: 52px; /* +2px */
      font-weight: 900;
      margin-bottom: 6px;
    }

    .subtitle {
      font-size: 30px; /* +2px */
      font-weight: 800;
      margin-bottom: 22px;
    }

    /* LINEA */
    .line {
      border-top: 4px dashed #000;
      margin: 22px 0;
    }

    /* FILAS */
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 14px 0;
      font-size: 32px; /* +2px */
      font-weight: 900;
    }

    .label {
      font-weight: 900;
    }

    .value {
      text-align: right;
      font-weight: 900;
    }

    /* TOTAL (NO SE TOCA) */
    .total-box {
      border: 4px dashed #000;
      padding: 24px;
      margin-top: 26px;
    }

    .total-box .label {
      font-size: 30px; /* IGUAL */
    }

    .total {
      font-size: 64px; /* IGUAL */
      font-weight: 900;
      text-align: center;
      margin-top: 10px;
    }

    /* FOOTER */
    .footer {
      font-size: 26px; /* +2px */
      font-weight: 800;
      text-align: center;
      margin-top: 26px;
    }
  }
</style>
</head>

<body>

<div class="recibo">

  <div class="center">
    <img src="images/logo.png" class="logo" alt="LOGO">
    <div class="title">LAVADERO</div>
    <div class="subtitle">RECIBO DE SERVICIO</div>
  </div>

  <div class="line"></div>

  <div class="row">
    <div class="label">PLACA</div>
    <div class="value">${servicio.placa}</div>
  </div>

  <div class="row">
    <div class="label">SERVICIO</div>
    <div class="value">${servicio.servicio}</div>
  </div>

  <div class="row">
    <div class="label">TRABAJADOR</div>
    <div class="value">${servicio.trabajador}</div>
  </div>

  <div class="row">
    <div class="label">FECHA</div>
    <div class="value">
      ${new Date(servicio.hora).toLocaleString("es-CO")}
    </div>
  </div>

  <div class="line"></div>

  <div class="total-box">
    <div class="center label">TOTAL A PAGAR</div>
    <div class="total">
      $${Number(servicio.precio).toLocaleString("es-CO")}
    </div>
  </div>

  <div class="footer">
    ¡GRACIAS POR SU VISITA!<br>
    CONSERVE ESTE RECIBO
  </div>

</div>

<script>
  window.onload = function () {
    window.print();
    window.onafterprint = () => window.close();
  };
</script>

</body>
</html>
  `);

  win.document.close();
}









/* ---------- Activación del buscador ---------- */
buscadorActivos.addEventListener("input", renderActivos);

/* ---------- Init ---------- */
cargarActivos();
setInterval(cargarActivos, 10000);



/* ===============================
    CARGAR SERVICIOS
   =============================== */
function cargarServicios() {
  fetch(`${API_URL}?action=servicios`)
    .then(res => res.json())
    .then(data => {
      serviciosData = Array.isArray(data) ? data : [];
      renderServicios();
    })
    .catch(err => console.error("Error servicios:", err));
}



/* ===============================
    RENDER SERVICIOS
   =============================== */

function renderServicios() {
  const grid = document.getElementById("gridServicios");
  const idsRenderizados = new Set();

  if (!serviciosData.length) {
    grid.innerHTML = "<p>No hay servicios</p>";
    return;
  }

  serviciosData.forEach(s => {
    idsRenderizados.add(String(s.id));

    let card = grid.querySelector(`[data-id="${s.id}"]`);

    // 🆕 Nuevo servicio
    if (!card) {
      card = document.createElement("div");
      card.className = "card-servicio";
      card.dataset.id = s.id;
      grid.appendChild(card);
    }

    // 🔄 Update / render
   card.innerHTML = `
  <h4>${s.nombre}</h4>
  <p>$${Number(s.precio).toLocaleString("es-CO")}</p>

  <div class="acciones">
    <button class="start">🧼 Iniciar</button>
    <button class="edit">✏️</button>
    <button class="delete">🗑️</button>
  </div>
`;

    card.querySelector(".edit").onclick = () => editarServicio(s);
    card.querySelector(".delete").onclick = () => eliminarServicio(s.id);
    card.querySelector(".start").onclick = () => abrirModalAgendarServicio(s);

  });

  // 🧹 Eliminar servicios que ya no existen
  [...grid.children].forEach(card => {
    if (!idsRenderizados.has(card.dataset.id)) {
      card.remove();
    }
  });
}


/* ===============================
     MODAL PARA AGENDAR SERVICIO
   =============================== */
function abrirModalAgendarServicio(servicio) {

  SwalPremium.fire({
    title: "Iniciar lavado",
    html: `
      <div style="text-align:center">
        <p style="font-weight:600">${servicio.nombre}</p>
        <p style="opacity:.7;margin-bottom:10px">
          Precio: $${Number(servicio.precio).toLocaleString("es-CO")}
        </p>

        <input
          id="placaLavado"
          class="swal2-input"
          placeholder="Placa del vehículo"
          style="text-transform:uppercase"
        />

        <select id="trabajadorLavado" class="swal2-input">
          <option value="">Asignar automáticamente</option>
          <option disabled>Cargando trabajadores...</option>
        </select>
      </div>
    `,
    confirmButtonText: "Iniciar lavado",
    cancelButtonText: "Cancelar",
    didOpen: () => {
      // 🔥 CUANDO EL MODAL YA ESTÁ ABIERTO → cargamos trabajadores
      fetch(`${API_URL}?action=trabajadores`)
        .then(res => res.json())
        .then(data => {
          const select = document.getElementById("trabajadorLavado");
          if (!select) return;

          // limpiar opciones
          select.innerHTML = `<option value="">Asignar automáticamente</option>`;

          data
            .filter(t => t.estado === "libre")
            .forEach(t => {
              const opt = document.createElement("option");
              opt.value = t.nombre;
              opt.textContent = t.nombre;
              select.appendChild(opt);
            });

          // si no hay libres
          if (select.options.length === 1) {
            const opt = document.createElement("option");
            opt.disabled = true;
            opt.textContent = "No hay trabajadores libres";
            select.appendChild(opt);
          }
        })
        .catch(() => {
          const select = document.getElementById("trabajadorLavado");
          if (select) {
            select.innerHTML = `
              <option value="">Asignar automáticamente</option>
              <option disabled>Error al cargar trabajadores</option>
            `;
          }
        });
    },
    preConfirm: () => {
      const placa = document
        .getElementById("placaLavado")
        .value.trim()
        .toUpperCase();

      const trabajador =
        document.getElementById("trabajadorLavado").value;

      if (!placa) {
        Swal.showValidationMessage("La placa es obligatoria");
        return false;
      }

      return { placa, trabajador };
    }
  }).then(result => {
    if (!result.isConfirmed) return;

    const { placa, trabajador } = result.value;

    let url =
      `${API_URL}?action=agendar` +
      `&placa=${encodeURIComponent(placa)}` +
      `&servicio=${encodeURIComponent(servicio.nombre)}`;

    // 🔥 solo enviar trabajador si fue seleccionado
    if (trabajador) {
      url += `&trabajador=${encodeURIComponent(trabajador)}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(r => {
        if (r.error) {
          SwalPremium.fire("Error", r.error, "error");
          return;
        }

        SwalPremium.fire({
          icon: "success",
          title: "Lavado iniciado",
          html: `
            <b>Placa:</b> ${placa}<br>
            <b>Servicio:</b> ${servicio.nombre}<br>
            <b>Trabajador:</b> ${r.trabajador}<br>
            <b>Precio:</b> $${Number(r.precio).toLocaleString("es-CO")}
          `
        });

        cargarActivos();
        cargarTrabajadores();
        cargarIngresos();
      })
      .catch(() => {
        SwalPremium.fire("Error", "Error de conexión", "error");
      });
  });
}






/* ===============================
    EDITAR  SERVICIO
   =============================== */

function editarServicio(servicio) {
  SwalPremium.fire({
    title: "Editar servicio",
    html: `
      <input id="srvNombreEdit" class="swal2-input" value="${servicio.nombre}">
      <input id="srvPrecioEdit" type="number" class="swal2-input" value="${servicio.precio}">
    `,
    confirmButtonText: "Guardar",
    showCancelButton: true,
    preConfirm: () => {
      const nombre = document.getElementById("srvNombreEdit").value.trim();
      const precio = document.getElementById("srvPrecioEdit").value;

      if (!nombre || !precio) {
        Swal.showValidationMessage("Datos incompletos");
        return false;
      }

      return { nombre, precio };
    }
  }).then(result => {
    if (!result.isConfirmed) return;

    const { nombre, precio } = result.value;

    fetch(`${API_URL}?action=editarServicio&id=${servicio.id}&nombre=${encodeURIComponent(nombre)}&precio=${precio}`)
      .then(res => res.json())
      .then(r => {
        if (r.ok) {
          SwalPremium.fire("Actualizado", "", "success");
          cargarServicios();
        }
      });
  });
}



/* ===============================
    ELIMINAR  SERVICIO
   =============================== */
function eliminarServicio(id) {
  SwalPremium.fire({
    title: "¿Eliminar servicio?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar"
  }).then(result => {
    if (!result.isConfirmed) return;

    fetch(`${API_URL}?action=eliminarServicio&id=${id}`)
      .then(res => res.json())
      .then(r => {
        if (r.ok) {
          SwalPremium.fire("Eliminado", "", "success");
          cargarServicios();
        }
      });
  });
}




/* ===============================
    CARGAR TRABAJADORES
   =============================== */
function cargarTrabajadores() {
  fetch(`${API_URL}?action=trabajadores`)
    .then(res => res.json())
    .then(data => {
      trabajadoresData = Array.isArray(data) ? data : [];

      // 🔥 construir mapa de liquidaciones usando id en lugar de nombre
      const nuevasLiquidaciones = {};

      trabajadoresData.forEach(t => {
        if (t.liquidacion && t.fecha_liquidacion) {
          nuevasLiquidaciones[t.id] = {
            valor: Number(t.liquidacion),
            fecha: new Date(t.fecha_liquidacion)
          };
        }
      });

      liquidacionesData = nuevasLiquidaciones;

      renderTrabajadores();        // tabla
      renderFiltroTrabajadores();  // select
   
    })
    .catch(err => console.error("Error trabajadores:", err));
}




/* ===============================
    RENDER TRABAJADORES
   =============================== */

function renderTrabajadores() {
  const tbody = document.getElementById("tablaTrabajadores");
  tbody.innerHTML = "";

  if (!trabajadoresData.length) {
    tbody.innerHTML = `<tr><td colspan="3">Sin trabajadores</td></tr>`;
    return;
  }

  trabajadoresData.forEach(t => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${t.nombre}</td>
      <td>${t.estado}</td>
      <td>${t.correo}</td>
      <td>
  <div class="acciones-trabajador">
    <button class="edit">✏️</button>
    <button class="delete">🗑️</button>
  </div>
</td>

    `;

    tr.querySelector(".edit").onclick = () => editarTrabajador(t);
    tr.querySelector(".delete").onclick = () => eliminarTrabajador(t);

   

    tbody.appendChild(tr);
  });
}



/* ===============================
    EDITAR TRABAJADOR
   =============================== */
function editarTrabajador(t) {
  SwalPremium.fire({
    title: "Editar trabajador",
    html: `
      <input 
        id="trabNombreEdit"
        class="swal2-input"
        placeholder="Nombre"
        value="${t.nombre}"
      >

      <input 
        id="trabCorreoEdit"
        type="email"
        class="swal2-input"
        placeholder="Correo"
        value="${t.correo || ""}"
      >

      <select id="trabEstadoEdit" class="swal2-select">
        <option value="libre" ${t.estado === "libre" ? "selected" : ""}>Libre</option>
        <option value="ocupado" ${t.estado === "ocupado" ? "selected" : ""}>Ocupado</option>
      </select>
    `,
    confirmButtonText: "Guardar",
    showCancelButton: true,
    preConfirm: () => {
      const nombre = document.getElementById("trabNombreEdit").value.trim();
      const correo = document.getElementById("trabCorreoEdit").value.trim();
      const estado = document.getElementById("trabEstadoEdit").value;

      if (!nombre) {
        Swal.showValidationMessage("Nombre requerido");
        return false;
      }

      if (correo && !correo.includes("@")) {
        Swal.showValidationMessage("Correo inválido");
        return false;
      }

      return { nombre, correo, estado };
    }
  }).then(result => {
    if (!result.isConfirmed) return;

    const { nombre, correo, estado } = result.value;

    fetch(
      `${API_URL}?action=editarTrabajador` +
      `&id=${t.id}` +
      `&nombre=${encodeURIComponent(nombre)}` +
      `&correo=${encodeURIComponent(correo)}` +
      `&estado=${estado}`
    )
      .then(res => res.json())
      .then(r => {
        if (r.ok) {
          SwalPremium.fire("Actualizado", "", "success");
          cargarTrabajadores();
          cargarIngresos();
          cargarActivos();
        }
      });
  });
}


/* ===============================
    ELIMINAR TRABAJADOR
   =============================== */
function eliminarTrabajador(trabajador) {
  if (trabajador.estado === "ocupado") {
    return SwalPremium.fire({
      icon: "warning",
      title: "No permitido",
      text: "El trabajador está asignado a un lavado activo"
    });
  }

  SwalPremium.fire({
    title: "¿Eliminar trabajador?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar"
  }).then(result => {
    if (!result.isConfirmed) return;

    fetch(`${API_URL}?action=eliminarTrabajador&id=${trabajador.id}`)
      .then(res => res.json())
      .then(r => {
        if (r.ok) {
          SwalPremium.fire("Eliminado", "", "success");
          cargarTrabajadores();
        }
      });
  });
}











function confirmarLavado(id) {
  const item = lista.querySelector(`[data-id="${id}"]`);
  if (!item) return;

SwalPremium.fire({
    title: "¿Confirmar lavado terminado?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Confirmar"
  }).then(r => {
    if (!r.isConfirmed) return;

    // ⚡ Optimistic UI
    item.style.opacity = ".4";

    fetch(`${API_URL}?action=confirmar&id=${id}`)
      .then(res => res.json())
      .then(r => {
        if (r.ok) {
          item.remove();
          // 🔥 REFRESCOS NECESARIOS
          cargarIngresos();
          cargarTrabajadores();

        } else {
          item.style.opacity = "1";
          SwalPremium.fire("Error", r.error || "No se pudo confirmar", "error");
        }
      })
      .catch(() => {
        item.style.opacity = "1";
        SwalPremium.fire("Error de red", "", "error");
      });
  });
}


/* ===============================
   CREAR SERVICIO
   =============================== */
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
      if (!r.ok) {
        alert("Error creando servicio");
        return;
      }

      // ✅ Limpiar inputs
      srvNombre.value = "";
      srvPrecio.value = "";

      // 🔁 REFRESCAR SERVICIOS
      cargarServicios();

      // (opcional UX)
      SwalPremium.fire({
        icon: "success",
        title: "Servicio creado",
        timer: 1200,
        showConfirmButton: false
      });
    });
};


/* ===============================
   CREAR TRABAJADOR
   =============================== */
/* ===============================
   CREAR TRABAJADOR
   =============================== */
document.getElementById("btnCrearTrabajador").onclick = () => {
  const nombre = trabNombre.value.trim();
  const correo = trabCorreo.value.trim(); // 🔥 nuevo

  if (!nombre) {
    SwalPremium.fire("Error", "Nombre requerido", "error");
    return;
  }

  fetch(
    `${API_URL}?action=crearTrabajador` +
    `&nombre=${encodeURIComponent(nombre)}` +
    `&correo=${encodeURIComponent(correo)}`
  )
    .then(res => res.json())
    .then(r => {
      if (!r.ok) {
        SwalPremium.fire("Error", r.error || "Error creando trabajador", "error");
        return;
      }

      // ✅ Limpiar inputs
      trabNombre.value = "";
      trabCorreo.value = "";

      // 🔁 REFRESCAR TRABAJADORES
      cargarTrabajadores();

      SwalPremium.fire({
        icon: "success",
        title: "Trabajador creado",
        timer: 1200,
        showConfirmButton: false
      });
    })
    .catch(() => {
      SwalPremium.fire("Error", "Error de conexión", "error");
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
   INGRESOS + KPIs - VERSIÓN ALIEN 👽
   =============================== */
const tabla = document.getElementById("tablaIngresos");
const kpiServicios = document.getElementById("kpiServicios");
const kpiHoy = document.getElementById("kpiHoy");
const kpiMes = document.getElementById("kpiMes");
const buscador = document.getElementById("buscador");

let ingresosDetalle = [];

/* ---------- UTILIDADES ---------- */
// Convierte cualquier cosa a número seguro
function parsePrecio(valor) {
  const n = Number(valor);
  return isNaN(n) ? 0 : n;
}

// Comprueba si dos fechas son el mismo día
function esMismoDia(fecha1, fecha2) {
  const f1 = new Date(fecha1);
  const f2 = new Date(fecha2);
  return f1.getFullYear() === f2.getFullYear() &&
         f1.getMonth() === f2.getMonth() &&
         f1.getDate() === f2.getDate();
}

/* ---------- CARGAR INGRESOS DESDE API ---------- */
function cargarIngresos() {
  fetch(`${API_URL}?action=ingresos`)
    .then(res => res.json())
    .then(data => {
      // Guardar detalle para filtros y tabla
      ingresosDetalle = Array.isArray(data.detalle) ? data.detalle : [];
      console.log("🛸 Datos ingresos cargados:", ingresosDetalle);

      // 🔹 Calcular KPIs
      const hoy = new Date();
      const mes = hoy.getMonth();
      const anio = hoy.getFullYear();

      let serviciosHoy = 0;
      let ingresosHoy = 0;
      let ingresosMes = 0;

      ingresosDetalle.forEach(i => {
        const precio = parsePrecio(i.precio);
        const fecha = new Date(i.fecha);

        if (!isNaN(fecha)) { // Solo fechas válidas
          // Servicios e ingresos de hoy
          if (esMismoDia(fecha, hoy)) {
            serviciosHoy += 1;
            ingresosHoy += precio;
          }

          // Ingresos del mes
          if (fecha.getFullYear() === anio && fecha.getMonth() === mes) {
            ingresosMes += precio;
          }
        }
      });

      // 🔹 Mostrar KPIs en formato COP
      kpiServicios.textContent = serviciosHoy;
      kpiHoy.textContent = ingresosHoy.toLocaleString("es-CO", { style: "currency", currency: "COP" });
      kpiMes.textContent = ingresosMes.toLocaleString("es-CO", { style: "currency", currency: "COP" });

      // Render tabla y tarjetas
      renderTablaIngresos();
      renderCardsTrabajador();
      renderLiquidaciones();
    })
    .catch(err => console.error("🛸 Error cargando ingresos:", err));
}

/* ---------- RENDER TABLA INGRESOS ---------- */
function renderTablaIngresos() {
  if (!tabla) return;

  const q = buscador?.value.toLowerCase() || "";
  tabla.innerHTML = "";

  const filtrados = ingresosDetalle.filter(i =>
    (i.placa || "").toLowerCase().includes(q) ||
    (i.trabajador || "").toLowerCase().includes(q)
  );

  if (!filtrados.length) {
    tabla.innerHTML = `<tr><td colspan="5" style="opacity:.6;text-align:center;">No hay registros</td></tr>`;
    return;
  }

  filtrados.forEach(i => {
    const fecha = i.fecha ? new Date(i.fecha).toLocaleDateString("es-CO") : "-";
    const precio = i.precio != null
      ? parsePrecio(i.precio).toLocaleString("es-CO", { style: "currency", currency: "COP" })
      : "-";

    tabla.innerHTML += `
      <tr>
        <td>${fecha}</td>
        <td>${i.placa || "-"}</td>
        <td>${i.servicio || "-"}</td>
        <td>${i.trabajador || "-"}</td>
        <td>${precio}</td>
      </tr>
    `;
  });
}

/* ---------- EVENTO FILTRO BUSCADOR ---------- */
if (buscador) buscador.oninput = renderTablaIngresos;

/* ---------- LLAMADA INICIAL ---------- */
document.addEventListener("DOMContentLoaded", () => {
  cargarIngresos();
  // Asegúrate de que estas funciones existan en tu código
  cargarActivos?.();
  cargarRecogidas?.();
  cargarServicios?.();
  cargarTrabajadores?.();
});



/* ===============================
   CARGAR RECOGIDAS
   =============================== */
function cargarRecogidas() {
  fetch(`${API_URL}?action=recogidas`)
    .then(res => res.json())
    .then(data => {
      recogidasData = Array.isArray(data) ? data : [];
      renderRecogidas();
    })
    .catch(err => {
      console.error("Error recogidas:", err);
      listaRecogidas.innerHTML = "<p>Error cargando recogidas</p>";
    });
}


function renderRecogidas() {
  listaRecogidas.innerHTML = "";

  if (!recogidasData.length) {
    listaRecogidas.innerHTML = "<p>No hay recogidas pendientes</p>";
    return;
  }

  recogidasData.forEach(r => {
    const card = document.createElement("div");
    card.className = "card-recogida";

    card.innerHTML = `
      <b>👤 ${r.nombre}</b>
      <small>📞 ${r.telefono}</small>

      <div style="margin-top:6px">
        <b>🏍️ Placa:</b> ${r.placa}<br>
        <b>📅 Fecha:</b> ${r.fecha}<br>
        <b>⏰ Hora:</b> ${r.hora}
      </div>

      <span style="color:#facc15;margin:8px 0;display:block">
        Estado: ${r.estado}
      </span>

      <button class="btn-start">Iniciar lavado</button>
    `;

    /* =====================================
       EVENTO BOTÓN – SWEETALERT PREMIUM
       ===================================== */
    card.querySelector(".btn-start").onclick = () => {

      // 🔒 Seguridad: servicios cargados
      if (!serviciosData.length) {
        SwalPremium.fire("Error", "No hay servicios disponibles", "error");
        return;
      }

      SwalPremium.fire({
        title: "Seleccionar servicio",
        text: "Este servicio será asignado a la recogida",
        input: "select",
        inputOptions: serviciosData.reduce((acc, s) => {
          acc[s.nombre] = `${s.nombre} — $${s.precio}`;
          return acc;
        }, {}),
        inputPlaceholder: "Selecciona un servicio",
        showCancelButton: true,
        confirmButtonText: "Iniciar lavado",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#22c55e"
      }).then(result => {
        if (!result.isConfirmed) return;

        fetch(
          `${API_URL}?action=iniciarRecogida&id=${r.id}&servicio=${encodeURIComponent(result.value)}`
        )
          .then(res => res.json())
          .then(resp => {
            if (resp.error) {
              SwalPremium.fire("Error", resp.error, "error");
            } else {
              SwalPremium.fire({
                icon: "success",
                title: "Lavado iniciado",
                html: `
                  <b>Servicio:</b> ${resp.servicio}<br>
                  <b>Trabajador:</b> ${resp.trabajador}<br>
                  <b>Precio:</b> $${resp.precio}
                `
              });

              // 🔄 REFRESCOS CLAVE
              cargarRecogidas();
              cargarActivos();
              cargarTrabajadores();
            }
          })
          .catch(() => {
            SwalPremium.fire("Error", "Error de conexión", "error");
          });
      });
    };

    listaRecogidas.appendChild(card);
  });
}


/* =========================================================
   CALCULAR TOTAL DE DINERO POR TRABAJADOR
   (en base a servicios realizados)
========================================================= */

const filtroTrabajador = document.getElementById("filtroTrabajador");
const cardsTrabajador = document.getElementById("cardsTrabajador");
const filtroFecha = document.getElementById("filtroFecha");


if (filtroTrabajador) {
  filtroTrabajador.onchange = renderCardsTrabajador;
}

if (filtroFecha) {
  filtroFecha.onchange = renderCardsTrabajador;
}



/* ===============================
   RENDER SELECT DE TRABAJADORES
=============================== */
function renderFiltroTrabajadores() {
  if (!filtroTrabajador) return;

  // 🧠 Guardar selección actual
  const seleccionado = filtroTrabajador.value;

  filtroTrabajador.innerHTML =
    `<option value="">Todos los trabajadores</option>`;

  trabajadoresData.forEach(t => {
    filtroTrabajador.innerHTML += `
      <option value="${t.nombre}">${t.nombre}</option>
    `;
  });

  // 🔁 Restaurar selección si aún existe
  if (
    seleccionado &&
    trabajadoresData.some(t => t.nombre === seleccionado)
  ) {
    filtroTrabajador.value = seleccionado;
  }
}



function filtrarPorFecha(detalle, dias) {
  if (!dias) return detalle;

  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() - Number(dias));

  return detalle.filter(i => {
    if (!i.fecha) return false;
    const fechaServicio = new Date(i.fecha);
    return fechaServicio >= limite;
  });
}

//FUNCION PARA ANALIZAR CON FILTRO POR FECHA SI LA LIQUIDACION FUE DENTRO DEL RANGO DEL SELECT
function liquidacionAplica(liquidacion, diasFiltro) {
  if (!liquidacion) return false;
  if (!diasFiltro) return true;

  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() - Number(diasFiltro));

  return liquidacion.fecha >= limite;
}


/* ===============================
   CÁLCULO DE INGRESOS
=============================== */
function calcularIngresosPorTrabajador(
  detalle,
  trabajadorFiltro = "",
  diasFiltro = null
) {
  if (!Array.isArray(detalle)) return {};

  let data = [...detalle];

  // 1️⃣ Filtro fecha
  if (diasFiltro) {
    data = filtrarPorFecha(data, diasFiltro);
  }

  // 2️⃣ Filtro trabajador
  if (trabajadorFiltro) {
    data = data.filter(i => i.trabajador === trabajadorFiltro);
  }

  // 3️⃣ Agrupación
  return data.reduce((acc, i) => {
    if (!acc[i.trabajador]) {
      acc[i.trabajador] = {
        trabajador: i.trabajador,
        total: 0,
        servicios: 0
      };
    }

    acc[i.trabajador].total += Number(i.precio) || 0;
    acc[i.trabajador].servicios++;

    return acc;
  }, {});
}


/* ===============================
   RENDER CARDS GLASS / NEON
=============================== */
function renderCardsTrabajador() {
  if (!cardsTrabajador) return;

  const trabajadorSeleccionado = filtroTrabajador.value;
  const diasSeleccionados = filtroFecha.value;

  // 1️⃣ Filtrar trabajadores según selección
  let trabajadoresAFiltrar = [...trabajadoresData];
  if (trabajadorSeleccionado) {
    trabajadoresAFiltrar = trabajadoresAFiltrar.filter(
      t => t.nombre === trabajadorSeleccionado
    );
  }

  cardsTrabajador.innerHTML = "";

  if (!trabajadoresAFiltrar.length) {
    cardsTrabajador.innerHTML =
      `<p style="opacity:.6">Sin datos para el rango seleccionado</p>`;
    return;
  }

  // 2️⃣ Renderizar trabajadores
  trabajadoresAFiltrar.forEach(trabajador => {
    const liquidacion = liquidacionesData[trabajador.id] || null;
    const fechaUltimaLiquidacion = liquidacion?.fecha || null;

    // 🔥 FILTRAR INGRESOS SOLO DESPUÉS DE LA LIQUIDACIÓN
    let ingresosFiltrados = ingresosDetalle.filter(i => {
      if (i.trabajador !== trabajador.nombre) return false;
      if (!i.fecha) return false;

      const fechaServicio = new Date(i.fecha);

      // ⛔ Ignorar ingresos ya liquidados
      if (fechaUltimaLiquidacion && fechaServicio <= fechaUltimaLiquidacion) {
        return false;
      }

      return true;
    });

    // 3️⃣ Aplicar filtro de días (si existe)
    if (diasSeleccionados) {
      ingresosFiltrados = filtrarPorFecha(ingresosFiltrados, diasSeleccionados);
    }

    // 4️⃣ Calcular totales
    const total = ingresosFiltrados.reduce(
      (acc, i) => acc + Number(i.precio || 0),
      0
    );

    const servicios = ingresosFiltrados.length;

    const card = document.createElement("div");
    card.className = "card-glass-neon clickable";

    // Info de liquidación
    let liquidacionHTML = "";
    if (liquidacion) {
      liquidacionHTML = `
        <hr style="opacity:.2;margin:8px 0">
        <small style="color:#22c55e">
          ✔ Última liquidación: $${liquidacion.valor.toLocaleString()}
          <br>
          <span style="opacity:.6;font-size:.75rem">
            ${formatoFechaBonita(liquidacion.fecha)}
            ${liquidacion.periodo ? `(Periodo ${liquidacion.periodo} días)` : ""}
          </span>
        </small>
      `;
    }

    card.innerHTML = `
      <h3>${trabajador.nombre}</h3>

      <p class="neon">
        $${total.toLocaleString()}
      </p>

      <small>
        ${servicios} servicios pendientes por liquidar
      </small>

      <div class="liquidacion-info">
        ${liquidacionHTML}
      </div>
    `;

    // 5️⃣ Click → liquidar SOLO lo nuevo
    card.onclick = () => {
      const hoy = new Date();

      if (liquidacion?.fecha && liquidacion?.periodo) {
        const diffDias = Math.floor(
          (hoy - new Date(liquidacion.fecha)) / (1000 * 60 * 60 * 24)
        );

        if (diffDias < liquidacion.periodo) {
          SwalPremium.fire(
            "No permitido",
            `Aún no ha pasado el periodo de alarma (${liquidacion.periodo} días).`,
            "warning"
          );
          return;
        }
      }

      abrirModalLiquidacion({
  trabajador: trabajador.nombre,
  correo: trabajador.correo,   // 🔥 IMPORTANTE
  total,
  servicios,
  id: trabajador.id
});

    };

    cardsTrabajador.appendChild(card);
  });
}





function buildEmailNominaData({ trabajador, total, servicios, liquidacion }) {
  return {
    // 🔥 EmailJS usa esto para enviar
    email: trabajador.correo,

    trabajador_nombre: trabajador.nombre,
    total: total.toLocaleString("es-CO"),
    servicios,
    anio: new Date().getFullYear(),

    ultima_liquidacion: liquidacion
      ? {
          valor: liquidacion.valor.toLocaleString("es-CO"),
          fecha: formatoFechaBonita(liquidacion.fecha),
          periodo: liquidacion.periodo
            ? `(Periodo ${liquidacion.periodo} días)`
            : ""
        }
      : null
  };
}





/* ===============================
   EVENTO FILTRO
=============================== */
if (filtroTrabajador) {
  filtroTrabajador.onchange = renderCardsTrabajador;
}


/* ===============================
  ABRIR EL MODAL DE LIQUIDACION
=============================== */
function abrirModalLiquidacion(resumenTrabajador) {

  if (!liquidacionesData[resumenTrabajador.id]) {
    liquidacionesData[resumenTrabajador.id] = {};
  }

  let liquidacion = { ...liquidacionesData[resumenTrabajador.id] };

  const frecuenciaTexto = (periodo) => {
    if (periodo === 7) return "semanal";
    if (periodo === 15) return "quincenal";
    if (periodo === 30) return "mensual";
    return "personalizada";
  };

  SwalPremium.fire({
    title: `Liquidar a ${resumenTrabajador.trabajador}`,
    html: `
      <div style="text-align:center;color:#fff;">
        <p style="font-weight:600;">Total generado en el periodo:</p>
        <p style="font-size:1.6rem;font-weight:700;color:#22c55e;">
          $${resumenTrabajador.total.toLocaleString()}
        </p>

        ${
          liquidacion.fecha
            ? `<p style="opacity:.8;font-size:.9rem;">
                Última liquidación:
                <b>${formatoFechaBonita(liquidacion.fecha)}</b>
              </p>`
            : `<p style="opacity:.8;font-size:.9rem;">
                Este trabajador aún no ha sido liquidado
              </p>`
        }

        <input
          id="porcentajeLiquidacion"
          type="number"
          class="swal2-input"
          placeholder="Porcentaje (%)"
          min="1"
          max="100"
          value="${liquidacion.porcentaje || ""}"
          style="width:80%;max-width:250px;"
        />
      </div>
    `,
    confirmButtonText: "Liquidar",
    cancelButtonText: "Cancelar",
    showCancelButton: true,
    confirmButtonColor: "#22c55e",
    cancelButtonColor: "#f87171",
    focusConfirm: false,

    preConfirm: () => {
      const porcentaje = Number(
        document.getElementById("porcentajeLiquidacion").value
      );
      if (!porcentaje || porcentaje <= 0 || porcentaje > 100) {
        Swal.showValidationMessage("Porcentaje inválido");
        return false;
      }
      return { porcentaje };
    }

  }).then(result => {
    if (!result.isConfirmed) return;

    try {
      const { porcentaje } = result.value;
      const hoy = new Date();

      const ultimaFecha = liquidacion.fecha || null;
      const diasAlarma = liquidacion.periodo || 7;

      if (ultimaFecha) {
        const diffDias = Math.floor(
          (hoy - new Date(ultimaFecha)) / (1000 * 60 * 60 * 24)
        );
        if (diffDias < diasAlarma) {
          SwalPremium.fire(
            "No permitido",
            `Aún no ha pasado el periodo mínimo (${diasAlarma} días).`,
            "warning"
          );
          return;
        }
      }

      const valorLiquidado = Math.round(
        (resumenTrabajador.total * porcentaje) / 100
      );

      guardarLiquidacion(resumenTrabajador.trabajador, valorLiquidado);

      // 📧 EMAILJS (PLANO)
      if (resumenTrabajador.correo) {

        const ultimaDetalle = liquidacion.fecha
          ? `Anterior: $${liquidacion.valor.toLocaleString("es-CO")} · ${formatoFechaBonita(liquidacion.fecha)}`
          : "Primera liquidación registrada";

const hoy = new Date();

const emailData = {
  email: resumenTrabajador.correo,

  trabajador_nombre: resumenTrabajador.trabajador,

  // 💰 Lo que realmente se le pagó
  total: valorLiquidado.toLocaleString("es-CO"),

  // 🔢 Servicios liquidados en este periodo
  servicios: resumenTrabajador.servicios,

  // ✔ Título
  ultima_liquidacion_titulo: "✔ Liquidación realizada",

  // 💰 Valor
  ultima_liquidacion_valor:
    "$" + valorLiquidado.toLocaleString("es-CO"),

  // 📅 Fecha bonita
  ultima_liquidacion_fecha: formatoFechaBonita(hoy),

  // ⏱ Periodo (15 días, mensual, etc.)
  ultima_liquidacion_periodo: frecuenciaTexto(diasAlarma),

  anio: hoy.getFullYear()
};



        emailjs.send(
          "service_v2h7x1n",
          "template_lqgfiaq",
          emailData
        );
      }

      liquidacionesData[resumenTrabajador.id] = {
        valor: valorLiquidado,
        fecha: hoy,
        porcentaje,
        periodo: diasAlarma
      };

      renderCardsTrabajador();

      SwalPremium.fire(
        "Liquidado",
        `Liquidación ${frecuenciaTexto(diasAlarma)} registrada correctamente.`,
        "success"
      );

    } catch (err) {
      console.error(err);
      SwalPremium.fire("Error", "No se pudo registrar la liquidación.", "error");
    }
  });
}














/* ===============================
  GUARDAR LA LIQUIDACIÓN
=============================== */
function guardarLiquidacion(trabajador, valor) {
  return fetch(
    `${API_URL}?action=liquidarTrabajador` +
    `&trabajador=${encodeURIComponent(trabajador)}` +
    `&valor=${valor}`
  ).then(res => res.json());
}



/* ===============================
 TABLA DE LIQUIDACIONES Y ULTIMA FECHA EN LA QUE SE LIQUIDARON
=============================== */
const filtroLiquidacionesTrabajador = document.getElementById("filtroLiquidacionesTrabajador");
const filtroLiquidacionesFecha = document.getElementById("filtroLiquidacionesFecha");
const tablaLiquidaciones = document.getElementById("tablaLiquidaciones");

/* ===============================
 FUNCIONES DE PARSEO Y FORMATO DE FECHA
=============================== */
// Convierte cualquier fecha de Sheets a Date segura
function parseFechaSegura(fecha) {
  if (!fecha) return null;

  // Si ya es Date
  if (fecha instanceof Date && !isNaN(fecha)) return fecha;

  // Si es string con formato DD/MM/YYYY
  if (typeof fecha === "string" && fecha.includes("/")) {
    const [dia, mes, anio] = fecha.split("/").map(Number);
    return new Date(anio, mes - 1, dia);
  }

  // Intentar parsear cualquier otro string válido (ej: YYYY-MM-DD)
  const d = new Date(fecha);
  return isNaN(d) ? null : d;
}

// Convierte Date a texto bonito: Lun 12 ene 2026
function formatoFechaBonita(fecha) {
  if (!(fecha instanceof Date) || isNaN(fecha)) return "-";
  return fecha.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

/* ===============================
 RENDERIZADO DE LAS LIQUIDACIONES
=============================== */
function renderLiquidaciones() {
  if (!tablaLiquidaciones || !trabajadoresData.length) return;

  const trabajadorFiltro = filtroLiquidacionesTrabajador.value;
  const diasFiltro = filtroLiquidacionesFecha.value || 30;

  let trabajadoresFiltrados = [...trabajadoresData];
  if (trabajadorFiltro) {
    trabajadoresFiltrados = trabajadoresFiltrados.filter(t => t.nombre === trabajadorFiltro);
  }

  tablaLiquidaciones.innerHTML = "";

  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() - Number(diasFiltro));

  trabajadoresFiltrados.forEach(t => {
    const liquidacion = liquidacionesData[t.id] || null;

    // Aplicar filtro de fecha
    if (liquidacion && liquidacion.fecha && liquidacion.fecha < limite) return;

    // Calcular total generado desde ingresosDetalle
    const ingresosTrabajador = ingresosDetalle
      .filter(i => i.trabajador === t.nombre && new Date(i.fecha) >= limite)
      .reduce((acc, i) => acc + Number(i.precio), 0);

    // Valor liquidado en COP
    const valorFormateado = liquidacion && liquidacion.valor != null ? `$${liquidacion.valor.toLocaleString('es-CO')}` : "-";

    // Fecha bonita
    const fechaFormateada = liquidacion && liquidacion.fecha ? formatoFechaBonita(liquidacion.fecha) : "-";

    // Calcular porcentaje real pagado sobre total generado
    let porcentajeReal = "-";
    if (ingresosTrabajador > 0 && liquidacion && liquidacion.valor != null) {
      porcentajeReal = ((liquidacion.valor / ingresosTrabajador) * 100).toFixed(2);
    }

    tablaLiquidaciones.innerHTML += `
      <tr>
        <td>${t.nombre}</td>
        <td>${t.estado}</td>
        <td>$${ingresosTrabajador.toLocaleString('es-CO')}</td>
        <td>${valorFormateado} (${porcentajeReal !== "-" ? porcentajeReal + "%" : "-"})</td>
        <td>${fechaFormateada}</td>
      </tr>
    `;
  });

  if (!tablaLiquidaciones.innerHTML) {
    tablaLiquidaciones.innerHTML = `<tr><td colspan="5">No hay liquidaciones para este filtro</td></tr>`;
  }
}

/* ===============================
 RENDERIZADO DEL SELECT DE TRABAJADORES
=============================== */
function renderFiltroLiquidaciones() {
  if (!filtroLiquidacionesTrabajador) return;

  const seleccionado = filtroLiquidacionesTrabajador.value;

  filtroLiquidacionesTrabajador.innerHTML = `<option value="">Todos los trabajadores</option>`;
  trabajadoresData.forEach(t => {
    filtroLiquidacionesTrabajador.innerHTML += `<option value="${t.nombre}">${t.nombre}</option>`;
  });

  if (seleccionado && trabajadoresData.some(t => t.nombre === seleccionado)) {
    filtroLiquidacionesTrabajador.value = seleccionado;
  }
}

/* ===============================
 EVENTOS DE FILTROS
=============================== */
if (filtroLiquidacionesTrabajador) filtroLiquidacionesTrabajador.onchange = renderLiquidaciones;
if (filtroLiquidacionesFecha) filtroLiquidacionesFecha.onchange = renderLiquidaciones;

/* ===============================
 CARGA DE DATOS
=============================== */
function cargarTrabajadores() {
  fetch(`${API_URL}?action=trabajadores`)
    .then(res => res.json())
    .then(data => {
      trabajadoresData = Array.isArray(data) ? data : [];

      // Construir liquidaciones correctamente
      liquidacionesData = {};
      trabajadoresData.forEach(t => {
        if (t.liquidacion != null && t.fecha_liquidacion) {
          liquidacionesData[t.id] = {
            valor: Number(t.liquidacion),
            fecha: parseFechaSegura(t.fecha_liquidacion),
            porcentaje: t.porcentaje || null
          };
        }
      });

      renderTrabajadores();
      renderFiltroTrabajadores();
      renderFiltroLiquidaciones();
      renderLiquidaciones();
    })
    .catch(console.error);
}

function cargarIngresos() {
  fetch(`${API_URL}?action=ingresos`)
    .then(res => res.json())
    .then(data => {
      ingresosDetalle = data.detalle || [];
      renderTablaIngresos();
      renderCardsTrabajador();
      renderLiquidaciones();
    });
}



///CONFIGURACION DE ESTILOS GLOBALES PARA EL SWEETALERT
// 🔹 Configuración global para todos los Swal
const SwalPremium = Swal.mixin({
  customClass: {
    popup: 'swal-glass-popup'
  },
  buttonsStyling: false, // usar nuestro CSS en los botones
  backdrop: 'rgba(0,0,0,0.4)',
  showCloseButton: true,
  showCancelButton: true,
  confirmButtonColor: '#22c55e',
  cancelButtonColor: '#f87171',
  focusConfirm: false
});

 



// ===============================
// SECCION DE GANANCIAS
// ===============================

const filtroGananciasFecha = document.getElementById("filtroGananciasFecha");
const tableroBurbujas = document.getElementById("tableroBurbujas");

const kpiTotalLavados = document.getElementById("kpiTotalLavados");
const kpiIngresosRango = document.getElementById("kpiIngresosRango");
const kpiPeriodoAnterior = document.getElementById("kpiPeriodoAnterior");



 function toTimestamp(fecha) {
  if (!fecha) return null;

  // ya es timestamp
  if (typeof fecha === "number") return fecha;

  // string o Date
  const t = new Date(fecha).getTime();
  return isNaN(t) ? null : t;
}


// ===============================
// FILTRO POR RANGO (TIMESTAMP)
// ===============================
function filtrarPorRango(detalle, dias) {
  if (!dias) return detalle;

  const ahora = Date.now();
  const limite = ahora - dias * 24 * 60 * 60 * 1000;

  return detalle.filter(i => {
    const ts = toTimestamp(i.fecha);
    return ts && ts >= limite;
  });
}


// ===============================
// RENDER GANANCIAS
// ===============================
function renderGanancias() {
  if (!Array.isArray(ingresosDetalle)) return;

  const dias = Number(filtroGananciasFecha?.value || 15);

  const actuales = filtrarPorRango(ingresosDetalle, dias);

  const anteriores = ingresosDetalle.filter(i => {
    if (typeof i.fecha !== "number") return false;

    const ahora = Date.now();
    const inicioActual = ahora - dias * 24 * 60 * 60 * 1000;
    const inicioAnterior = ahora - dias * 2 * 24 * 60 * 60 * 1000;

    return i.fecha >= inicioAnterior && i.fecha < inicioActual;
  });

  // ===============================
  // KPIs
  // ===============================
  kpiTotalLavados.textContent = actuales.length;

  const totalIngresos = actuales.reduce(
    (acc, i) => acc + Number(i.precio || 0),
    0
  );

  kpiIngresosRango.textContent = totalIngresos.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP"
  });

  kpiPeriodoAnterior.textContent = anteriores.length;

  // ===============================
  // AGRUPAR POR TRABAJADOR
  // ===============================
  const resumen = actuales.reduce((acc, i) => {
    const nombre = i.trabajador || "Sin asignar";

    if (!acc[nombre]) {
      acc[nombre] = {
        trabajador: nombre,
        total: 0,
        servicios: 0,
        detalle: []
      };
    }

    acc[nombre].total += Number(i.precio || 0);
    acc[nombre].servicios++;
    acc[nombre].detalle.push(i);

    return acc;
  }, {});

  renderBurbujas(resumen);
  generarChartIngresosMes(actuales);
  generarChartTopServicios(actuales);
}

// ===============================
// RENDER BURBUJAS
// ===============================
function renderBurbujas(resumen) {
  tableroBurbujas.innerHTML = "";

  const trabajadores = Object.values(resumen);

  if (!trabajadores.length) {
    tableroBurbujas.innerHTML =
      `<p style="opacity:.6">No hay datos para este período</p>`;
    return;
  }

  trabajadores.forEach(t => {
    const bubble = document.createElement("div");
    bubble.className = "bubble";

    bubble.innerHTML = `
      <h4>${t.trabajador}</h4>
      <p class="neon">$${t.total.toLocaleString()}</p>
      <small>${t.servicios} servicios</small>
    `;

    bubble.addEventListener("click", () =>
      abrirModalGananciasTrabajador(t)
    );

    tableroBurbujas.appendChild(bubble);
  });
}

// ===============================
// MODAL DETALLE TRABAJADOR
// ===============================
function abrirModalGananciasTrabajador(t) {
  SwalPremium.fire({
    title: `📊 ${t.trabajador}`,
    html: `
      <p><b>Servicios:</b> ${t.servicios}</p>
      <p><b>Total:</b> $${t.total.toLocaleString()}</p>
      <hr>
      ${t.detalle.map(d => `
        <div style="text-align:left;margin-bottom:8px">
          🧼 ${d.servicio || "Servicio"}
          — $${Number(d.precio || 0).toLocaleString()}
          <br>
          <small>${new Date(d.fecha).toLocaleDateString()}</small>
        </div>
      `).join("")}
    `,
    confirmButtonText: "Cerrar"
  });
}

// ===============================
// EVENTO FILTRO
// ===============================
if (filtroGananciasFecha) {
  filtroGananciasFecha.addEventListener("change", renderGanancias);
}

// ===============================
// GRAFICO INGRESOS POR MES
// ===============================
function generarChartIngresosMes(detalle) {

  const agrupado = {};

  detalle.forEach(i => {
    const d = new Date(i.fecha);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!agrupado[key]) agrupado[key] = 0;
    agrupado[key] += Number(i.precio || 0);
  });

  const labels = Object.keys(agrupado).sort();
  const data = labels.map(l => agrupado[l]);

  const ctx = document.getElementById("chartIngresosMes");

  if (chartIngresosMes) chartIngresosMes.destroy();

  chartIngresosMes = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data,
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        borderColor: "#38bdf8",
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
          g.addColorStop(0, "rgba(56,189,248,.4)");
          g.addColorStop(1, "rgba(56,189,248,0)");
          return g;
        }
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: {
            callback: v => `$${v.toLocaleString()}`
          }
        }
      }
    }
  });
}

// ===============================
// GRAFICO TOP 10 SERVICIOS
// ===============================
function generarChartTopServicios(detalle) {

  const conteo = {};

  detalle.forEach(i => {
    const nombre = i.servicio || "Servicio";
    conteo[nombre] = (conteo[nombre] || 0) + 1;
  });

  const top = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = top.map(i => i[0]);
  const data = top.map(i => i[1]);

  const ctx = document.getElementById("chartTopServicios");

  if (chartTopServicios) chartTopServicios.destroy();

  chartTopServicios = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        borderRadius: 10,
        backgroundColor: "rgba(34,197,94,.75)"
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}


 


/* ===============================
   INIT
   =============================== */
cargarActivos();
cargarIngresos();
renderCardsTrabajador();
cargarServicios();
cargarTrabajadores();
cargarRecogidas();
setInterval(cargarActivos, 10000);
setInterval(cargarRecogidas, 10000);




