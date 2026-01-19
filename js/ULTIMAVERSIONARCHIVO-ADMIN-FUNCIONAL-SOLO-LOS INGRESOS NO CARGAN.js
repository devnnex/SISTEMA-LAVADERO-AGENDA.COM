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




/* ===============================
   LAVADOS ACTIVOS
   =============================== */

const lista = document.getElementById("lista");
const buscadorActivos = document.getElementById("buscadorActivos");

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
        <button class="confirm">Confirmar lavado</button>
      `;

      item.querySelector("button").onclick = () => confirmarLavado(l.id);
    });

  // 🧹 Eliminar solo los que ya no existen
  [...lista.children].forEach(el => {
    if (!nuevosIds.has(el.dataset.id)) el.remove();
  });

  if (!lista.children.length) {
    lista.innerHTML = "<p>No hay lavados activos</p>";
  }
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
      <p>$${s.precio}</p>

      <div class="acciones">
        <button class="edit">✏️</button>
        <button class="delete">🗑️</button>
      </div>
    `;

    card.querySelector(".edit").onclick = () => editarServicio(s);
    card.querySelector(".delete").onclick = () => eliminarServicio(s.id);
  });

  // 🧹 Eliminar servicios que ya no existen
  [...grid.children].forEach(card => {
    if (!idsRenderizados.has(card.dataset.id)) {
      card.remove();
    }
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
      <td>
        <button class="edit">✏️</button>
        <button class="delete">🗑️</button>
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
      <input id="trabNombreEdit" class="swal2-input" value="${t.nombre}">
      <select id="trabEstadoEdit" class="swal2-select">
        <option value="libre" ${t.estado === "libre" ? "selected" : ""}>Libre</option>
        <option value="ocupado" ${t.estado === "ocupado" ? "selected" : ""}>Ocupado</option>
      </select>
    `,
    confirmButtonText: "Guardar",
    showCancelButton: true,
    preConfirm: () => {
      const nombre = document.getElementById("trabNombreEdit").value.trim();
      const estado = document.getElementById("trabEstadoEdit").value;

      if (!nombre) {
        Swal.showValidationMessage("Nombre requerido");
        return false;
      }

      return { nombre, estado };
    }
  }).then(result => {
    if (!result.isConfirmed) return;

    const { nombre, estado } = result.value;

    fetch(`${API_URL}?action=editarTrabajador&id=${t.id}&nombre=${encodeURIComponent(nombre)}&estado=${estado}`)
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
  if (!nombre) return alert("Nombre requerido");

  fetch(`${API_URL}?action=crearTrabajador&nombre=${encodeURIComponent(nombre)}`)
    .then(res => res.json())
    .then(r => {
      if (!r.ok) {
        alert("Error creando trabajador");
        return;
      }

      // ✅ Limpiar input
      trabNombre.value = "";

      // 🔁 REFRESCAR TRABAJADORES
      cargarTrabajadores();

      // (opcional UX)
      SwalPremium.fire({
        icon: "success",
        title: "Trabajador creado",
        timer: 1200,
        showConfirmButton: false
      });
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

  // 2️⃣ Calcular ingresos filtrados
  const resumen = calcularIngresosPorTrabajador(
    ingresosDetalle,
    trabajadorSeleccionado,
    diasSeleccionados
  );

  cardsTrabajador.innerHTML = "";

  if (!trabajadoresAFiltrar.length) {
    cardsTrabajador.innerHTML =
      `<p style="opacity:.6">Sin datos para el rango seleccionado</p>`;
    return;
  }

  // 3️⃣ Renderizar trabajadores
  trabajadoresAFiltrar.forEach(trabajador => {
    const ingresos =
      resumen[trabajador.nombre] || { trabajador: trabajador.nombre, total: 0, servicios: 0 };
    const liquidacion = liquidacionesData[trabajador.id];

    const card = document.createElement("div");
    card.className = "card-glass-neon clickable";

    // Fecha y periodo de liquidación
    let liquidacionHTML = "";
    if (liquidacion) {
      liquidacionHTML = `
        <hr style="opacity:.2;margin:8px 0">
        <small style="color:#22c55e">
          ✔ Liquidado: $${liquidacion.valor.toLocaleString()}
          <br>
          <span style="opacity:.6;font-size:.75rem">
            Última liquidación: ${formatoFechaBonita(liquidacion.fecha)}
            ${liquidacion.periodo ? `(Periodo alarma: ${liquidacion.periodo} días)` : ""}
          </span>
        </small>
      `;
    }

    card.innerHTML = `
      <h3>${trabajador.nombre}</h3>

      <p class="neon">
        $${ingresos.total.toLocaleString()}
      </p>

      <small>
        ${ingresos.servicios} servicios realizados
      </small>

      <div class="liquidacion-info" data-worker="${trabajador.id}">
        ${liquidacionHTML}
      </div>
    `;

    card.onclick = () => {
      const hoy = new Date();
      if (liquidacion && liquidacion.fecha && liquidacion.periodo) {
        const diffDias = Math.floor((hoy - liquidacion.fecha) / (1000 * 60 * 60 * 24));
        if (diffDias < liquidacion.periodo) {
          SwalPremium.fire(
            "No permitido",
            `Aún no ha pasado el periodo de alarma (${liquidacion.periodo} días).\nÚltima liquidación: ${formatoFechaBonita(liquidacion.fecha)}`,
            "warning"
          );
          return;
        }
      }

      // Abrir modal con el trabajador
      abrirModalLiquidacion({
        trabajador: trabajador.nombre,
        total: ingresos.total,
        servicios: ingresos.servicios,
        id: trabajador.id
      });
    };

    cardsTrabajador.appendChild(card);
  });
}









/* ===============================
   EVENTO FILTRO
=============================== */
if (filtroTrabajador) {
  filtroTrabajador.onchange = renderCardsTrabajador;
}


/* ===============================
  ABRIR EL MODAL DE LIQUIDACION CUANDO SE CLICKEA UNA CARD
=============================== */
function abrirModalLiquidacion(resumenTrabajador) {
  // 🔹 Obtener info actual del trabajador
  if (!liquidacionesData[resumenTrabajador.id]) liquidacionesData[resumenTrabajador.id] = {};
  let liquidacion = { ...liquidacionesData[resumenTrabajador.id] };

  // Determinar frecuencia usual en texto
  const frecuenciaTexto = (periodo) => {
    if (periodo === 7) return "semanal";
    if (periodo === 15) return "quincenal";
    if (periodo === 30) return "mensual";
    return "personalizada";
  };

  SwalPremium.fire({
    title: `Liquidar a ${resumenTrabajador.trabajador}`,
    html: `
      <div style="
        text-align:center;
        font-family:-apple-system, BlinkMacSystemFont, sans-serif;
        color:#fff;
      ">
        <p style="font-weight:600; margin-bottom:8px;">Total generado en el periodo:</p>
        <p style="font-size:1.5rem; font-weight:700; color:#22c55e; margin-bottom:15px;">
          $${resumenTrabajador.total.toLocaleString()}
        </p>

        ${liquidacion.fecha 
          ? `<p style="margin-bottom:12px; font-weight:500; font-size:0.95rem;">
              Última liquidación: <b>${formatoFechaBonita(liquidacion.fecha)}</b><br>
              Por lo general, se liquida cada 7 o 15 dias </b>
            </p>` 
          : `<p style="margin-bottom:12px; font-weight:500; font-size:0.95rem;">
              Este trabajador aún no ha sido liquidado
            </p>`}

        <p style="margin-bottom:15px; font-weight:500; color:#fff;">
          ¿Estás seguro de volver a liquidar?
        </p>

        <input 
          id="porcentajeLiquidacion"
          type="number"
          class="swal2-input"
          placeholder="Porcentaje (%)"
          min="1"
          max="100"
          value="${liquidacion.porcentaje || ''}"
          style="
            width:80%;
            max-width:250px;
            padding:8px;
            border-radius:10px;
            border:none;
            background: rgba(255,255,255,0.12);
            color:#fff;
            font-weight:500;
            font-size:0.95rem;
            text-align:center;
            margin:auto;
            display:block;
          "
        />
      </div>
    `,
    confirmButtonText: "Liquidar",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    focusConfirm: false,
    confirmButtonColor: "#22c55e",
    cancelButtonColor: "#f87171",
    backdrop: "rgba(0,0,0,0.4)",
    customClass: { popup: 'swal-glass-popup' },

    preConfirm: () => {
      const porcentaje = Number(document.getElementById("porcentajeLiquidacion").value);
      if (!porcentaje || porcentaje <= 0 || porcentaje > 100) {
        Swal.showValidationMessage("Porcentaje inválido");
        return false;
      }
      return { porcentaje };
    }

  }).then(result => {
    if (!result.isConfirmed) return; // Cancelar o cerrar

    try {
      const { porcentaje } = result.value;
      const ultimaFecha = liquidacion.fecha || null;
      const hoy = new Date();

      // Validación de alarma: si existe fecha previa
      const diasAlarma = liquidacion.periodo || 7; // por defecto semanal
      if (ultimaFecha) {
        const diffDias = Math.floor((hoy - new Date(ultimaFecha)) / (1000 * 60 * 60 * 24));
        if (diffDias < diasAlarma) {
          SwalPremium.fire(
            "No permitido",
            `Aún no ha pasado el periodo de alarma (${diasAlarma} días desde la última liquidación: ${formatoFechaBonita(ultimaFecha)}).`,
            "warning"
          );
          return;
        }
      }

      // Calcular y guardar liquidación
      const valorLiquidado = Math.round((resumenTrabajador.total * porcentaje) / 100);
      guardarLiquidacion(resumenTrabajador.trabajador, valorLiquidado);

      // 🔹 Guardar en estado local
      liquidacionesData[resumenTrabajador.id] = {
        valor: valorLiquidado,
        fecha: hoy,
        porcentaje,
        periodo: diasAlarma
      };

      // Actualizar referencia local
      liquidacion = { ...liquidacionesData[resumenTrabajador.id] };

      renderCardsTrabajador();

      SwalPremium.fire(
        "Liquidado",
        `La liquidación del ${frecuenciaTexto(diasAlarma)} fue registrada correctamente.`,
        "success"
      );

    } catch (err) {
      console.error("Error liquidando trabajador:", err);
      SwalPremium.fire("Error", "No se pudo registrar la liquidación.", "error");
    }
  });
}












/* ===============================
  GUARDAR LA LIQUIDACIÓN
=============================== */
function guardarLiquidacion(trabajador, valor) {
  fetch(
    `${API_URL}?action=liquidarTrabajador` +
    `&trabajador=${encodeURIComponent(trabajador)}` +
    `&valor=${valor}`
  )
    .then(res => res.json())
    .then(r => {
      if (!r.ok) {
        SwalPremium.fire("Error", r.error || "No se pudo liquidar", "error");
      }
    });
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

// 🔹 Ejemplo de uso
SwalPremium.fire({
  title: 'Confirmación de prueba',
  text: 'Este modal ya tiene el estilo glass Apple automáticamente.',
  confirmButtonText: 'Aceptar',
  cancelButtonText: 'Cancelar'
});




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








/// VERSION QUE SI LE FUNCIONA INGRESOS PERO NO ESTA COMPLETO COMO LA NUEVA VERSION 

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
   LAVADOS ACTIVOS
   =============================== */

const lista = document.getElementById("lista");
const buscadorActivos = document.getElementById("buscadorActivos");

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
        <button class="confirm">Confirmar lavado</button>
      `;

      item.querySelector("button").onclick = () => confirmarLavado(l.id);
    });

  // 🧹 Eliminar solo los que ya no existen
  [...lista.children].forEach(el => {
    if (!nuevosIds.has(el.dataset.id)) el.remove();
  });

  if (!lista.children.length) {
    lista.innerHTML = "<p>No hay lavados activos</p>";
  }
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
      <p>$${s.precio}</p>

      <div class="acciones">
        <button class="edit">✏️</button>
        <button class="delete">🗑️</button>
      </div>
    `;

    card.querySelector(".edit").onclick = () => editarServicio(s);
    card.querySelector(".delete").onclick = () => eliminarServicio(s.id);
  });

  // 🧹 Eliminar servicios que ya no existen
  [...grid.children].forEach(card => {
    if (!idsRenderizados.has(card.dataset.id)) {
      card.remove();
    }
  });
}



/* ===============================
    EDITAR  SERVICIO
   =============================== */

function editarServicio(servicio) {
  Swal.fire({
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
          Swal.fire("Actualizado", "", "success");
          cargarServicios();
        }
      });
  });
}



/* ===============================
    ELIMINAR  SERVICIO
   =============================== */
function eliminarServicio(id) {
  Swal.fire({
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
          Swal.fire("Eliminado", "", "success");
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
      renderTrabajadores();
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
      <td>
        <button class="edit">✏️</button>
        <button class="delete">🗑️</button>
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
  Swal.fire({
    title: "Editar trabajador",
    html: `
      <input id="trabNombreEdit" class="swal2-input" value="${t.nombre}">
      <select id="trabEstadoEdit" class="swal2-select">
        <option value="libre" ${t.estado === "libre" ? "selected" : ""}>Libre</option>
        <option value="ocupado" ${t.estado === "ocupado" ? "selected" : ""}>Ocupado</option>
      </select>
    `,
    confirmButtonText: "Guardar",
    showCancelButton: true,
    preConfirm: () => {
      const nombre = document.getElementById("trabNombreEdit").value.trim();
      const estado = document.getElementById("trabEstadoEdit").value;

      if (!nombre) {
        Swal.showValidationMessage("Nombre requerido");
        return false;
      }

      return { nombre, estado };
    }
  }).then(result => {
    if (!result.isConfirmed) return;

    const { nombre, estado } = result.value;

    fetch(`${API_URL}?action=editarTrabajador&id=${t.id}&nombre=${encodeURIComponent(nombre)}&estado=${estado}`)
      .then(res => res.json())
      .then(r => {
        if (r.ok) {
          Swal.fire("Actualizado", "", "success");
          cargarTrabajadores();
        }
      });
  });
}

/* ===============================
    ELIMINAR TRABAJADOR
   =============================== */
function eliminarTrabajador(trabajador) {
  if (trabajador.estado === "ocupado") {
    return Swal.fire({
      icon: "warning",
      title: "No permitido",
      text: "El trabajador está asignado a un lavado activo"
    });
  }

  Swal.fire({
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
          Swal.fire("Eliminado", "", "success");
          cargarTrabajadores();
        }
      });
  });
}











function confirmarLavado(id) {
  const item = lista.querySelector(`[data-id="${id}"]`);
  if (!item) return;

  Swal.fire({
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
          Swal.fire("Error", r.error || "No se pudo confirmar", "error");
        }
      })
      .catch(() => {
        item.style.opacity = "1";
        Swal.fire("Error de red", "", "error");
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
      Swal.fire({
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
  if (!nombre) return alert("Nombre requerido");

  fetch(`${API_URL}?action=crearTrabajador&nombre=${encodeURIComponent(nombre)}`)
    .then(res => res.json())
    .then(r => {
      if (!r.ok) {
        alert("Error creando trabajador");
        return;
      }

      // ✅ Limpiar input
      trabNombre.value = "";

      // 🔁 REFRESCAR TRABAJADORES
      cargarTrabajadores();

      // (opcional UX)
      Swal.fire({
        icon: "success",
        title: "Trabajador creado",
        timer: 1200,
        showConfirmButton: false
      });
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
        Swal.fire("Error", "No hay servicios disponibles", "error");
        return;
      }

      Swal.fire({
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
              Swal.fire("Error", resp.error, "error");
            } else {
              Swal.fire({
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
            Swal.fire("Error", "Error de conexión", "error");
          });
      });
    };

    listaRecogidas.appendChild(card);
  });
}



/* ===============================
   INIT
   =============================== */
cargarActivos();
cargarIngresos();
cargarServicios();
cargarTrabajadores();
cargarRecogidas();
setInterval(cargarActivos, 10000);
setInterval(cargarRecogidas, 10000);
