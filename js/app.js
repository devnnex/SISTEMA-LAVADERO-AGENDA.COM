const placaInput = document.getElementById("placa");
const servicioSelect = document.getElementById("servicio");
const btnAgendar = document.getElementById("agendar");

// ===== CARGAR SERVICIOS =====
fetch(`${API_URL}?action=servicios`)
  .then(res => res.json())
  .then(servicios => {
    servicioSelect.innerHTML = '<option value="">Selecciona un servicio</option>';

    servicios.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.nombre;
      opt.textContent = `${s.nombre} — $${s.precio}`;
      servicioSelect.appendChild(opt);
    });
  })
  .catch(() => {
    servicioSelect.innerHTML = '<option>Error cargando servicios</option>';
  });

// ===== AGENDAR LAVADO =====
btnAgendar.addEventListener("click", () => {
  const placa = placaInput.value.trim().toUpperCase();
  const servicio = servicioSelect.value;

  if (!placa || !servicio) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Debes ingresar la placa y seleccionar un servicio"
    });
    return;
  }

  btnAgendar.disabled = true;

  fetch(`${API_URL}?action=agendar&placa=${placa}&servicio=${encodeURIComponent(servicio)}`)
    .then(res => res.json())
    .then(r => {
      if (r.error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: r.error
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Servicio agendado",
          html: `
            <b>Placa:</b> ${placa}<br>
            <b>Servicio:</b> ${r.servicio}<br>
            <b>Trabajador:</b> ${r.trabajador}<br>
            <b>Precio:</b> $${r.precio}
          `
        });

        placaInput.value = "";
        servicioSelect.value = "";
      }
    })
    .finally(() => {
      btnAgendar.disabled = false;
    });
});
