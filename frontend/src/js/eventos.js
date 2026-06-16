// ===== UTILIDADES =====
function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById('mensaje');
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = `mensaje activo mensaje-${tipo}`;
  setTimeout(() => {
    mensaje.className = 'mensaje';
  }, 3000);
}

function abrirModal(titulo) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-overlay').classList.add('activo');
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.remove('activo');
}

// ===== DETECTAR QUÉ PÁGINA ES =====
const pagina = window.location.pathname;

// ===== HABITACIONES =====
if (pagina.includes('habitaciones')) {

  async function renderHabitaciones() {
    const container = document.getElementById('habitaciones-container');
    try {
      const habitaciones = await habitacionesAPI.getAll();
      if (habitaciones.length === 0) {
        container.innerHTML = '<p class="loading">No hay habitaciones.</p>';
        return;
      }
      container.innerHTML = habitaciones.map(hab => `
        <div class="card">
          ${hab.imagen 
            ? `<img src="${hab.imagen}" class="card__imagen" alt="${hab.tipo || hab.nombre}" onerror="this.style.display='none'" />` 
            : `<div class="card__imagen" style="background:var(--color-acento); display:flex; align-items:center; justify-content:center; font-size:3rem;">🛏️</div>`
          }
          <div class="card__contenido">
            <h3 class="card__titulo">${hab.nombre || hab.tipo || 'Habitación'}</h3>
            <p class="card__precio">$${hab.precio || '0'} / noche</p>
            <p class="card__descripcion">${hab.descripcion || 'Habitación confortable y elegante.'}</p>
            <div class="card__acciones">
              <button class="btn btn-primario" onclick="editarHabitacion('${hab.IDHabitacion}', '${hab.tipo || hab.nombre}', ${hab.precio}, '${hab.descripcion || ''}', '${hab.imagen || ''}')">Editar</button>
              <button class="btn btn-peligro" onclick="eliminarHabitacion('${hab.IDHabitacion}')">Eliminar</button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<p class="loading">Error cargando habitaciones.</p>';
    }
  }

  function editarHabitacion(id, tipo, precio, descripcion, imagen) {
    document.getElementById('habitacion-id').value = id;
    document.getElementById('habitacion-nombre').value = tipo;
    document.getElementById('habitacion-precio').value = precio;
    document.getElementById('habitacion-descripcion').value = descripcion;
    document.getElementById('habitacion-imagen').value = imagen;
    abrirModal('Editar Habitación');
  }

  async function eliminarHabitacion(id) {
    if (!confirm('¿Seguro que quieres eliminar esta habitación?')) return;
    try {
      await habitacionesAPI.delete(id);
      mostrarMensaje('Habitación eliminada correctamente', 'exito');
      renderHabitaciones();
    } catch (error) {
      mostrarMensaje('Error al eliminar', 'error');
    }
  }

  document.getElementById('btn-agregar').addEventListener('click', () => {
    document.getElementById('form-habitacion').reset();
    document.getElementById('habitacion-id').value = '';
    abrirModal('Nueva Habitación');
  });

  document.getElementById('btn-cancelar').addEventListener('click', cerrarModal);

  document.getElementById('form-habitacion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('habitacion-id').value;
    const data = {
      tipo: document.getElementById('habitacion-nombre').value,
      precio: document.getElementById('habitacion-precio').value,
      descripcion: document.getElementById('habitacion-descripcion').value,
      imagen: document.getElementById('habitacion-imagen').value
    };
    try {
      if (id) {
        await habitacionesAPI.update(id, data);
        mostrarMensaje('Habitación actualizada correctamente', 'exito');
      } else {
        await habitacionesAPI.create(data);
        mostrarMensaje('Habitación creada correctamente', 'exito');
      }
      cerrarModal();
      renderHabitaciones();
    } catch (error) {
      mostrarMensaje('Error al guardar', 'error');
    }
  });

  renderHabitaciones();
}

// ===== SERVICIOS =====
if (pagina.includes('servicios')) {

  async function renderServicios() {
    const container = document.getElementById('servicios-container');
    try {
      const servicios = await serviciosAPI.getAll();
      if (servicios.length === 0) {
        container.innerHTML = '<p class="loading">No hay servicios.</p>';
        return;
      }
      container.innerHTML = servicios.map(ser => `
        <div class="card">
          ${ser.imagen 
            ? `<img src="${ser.imagen}" class="card__imagen" alt="${ser.nombre}" onerror="this.style.display='none'" />` 
            : `<div class="card__imagen" style="background:var(--color-secundario); display:flex; align-items:center; justify-content:center; font-size:3rem;">⭐</div>`
          }
          <div class="card__contenido">
            <h3 class="card__titulo">${ser.nombre || 'Servicio'}</h3>
            <p class="card__precio">$${ser.precio || '0'}</p>
            <p class="card__descripcion">${ser.Descripcion || ser.descripcion || 'Servicio de calidad.'}</p>
            <div class="card__acciones">
              <button class="btn btn-primario" onclick="editarServicio('${ser.IDServicio}', '${ser.nombre}', ${ser.precio}, '${ser.Descripcion || ''}', '${ser.imagen || ''}')">Editar</button>
              <button class="btn btn-peligro" onclick="eliminarServicio('${ser.IDServicio}')">Eliminar</button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<p class="loading">Error cargando servicios.</p>';
    }
  }

  function editarServicio(id, nombre, precio, descripcion, imagen) {
    document.getElementById('servicio-id').value = id;
    document.getElementById('servicio-nombre').value = nombre;
    document.getElementById('servicio-precio').value = precio;
    document.getElementById('servicio-descripcion').value = descripcion;
    document.getElementById('servicio-imagen').value = imagen;
    abrirModal('Editar Servicio');
  }

  async function eliminarServicio(id) {
    if (!confirm('¿Seguro que quieres eliminar este servicio?')) return;
    try {
      await serviciosAPI.delete(id);
      mostrarMensaje('Servicio eliminado correctamente', 'exito');
      renderServicios();
    } catch (error) {
      mostrarMensaje('Error al eliminar', 'error');
    }
  }

  document.getElementById('btn-agregar').addEventListener('click', () => {
    document.getElementById('form-servicio').reset();
    document.getElementById('servicio-id').value = '';
    abrirModal('Nuevo Servicio');
  });

  document.getElementById('btn-cancelar').addEventListener('click', cerrarModal);

  document.getElementById('form-servicio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('servicio-id').value;
    const data = {
      nombre: document.getElementById('servicio-nombre').value,
      precio: document.getElementById('servicio-precio').value,
      Descripcion: document.getElementById('servicio-descripcion').value,
      Estado: 'activo',
      imagen: document.getElementById('servicio-imagen').value
    };
    try {
      if (id) {
        await serviciosAPI.update(id, data);
        mostrarMensaje('Servicio actualizado correctamente', 'exito');
      } else {
        await serviciosAPI.create(data);
        mostrarMensaje('Servicio creado correctamente', 'exito');
      }
      cerrarModal();
      renderServicios();
    } catch (error) {
      mostrarMensaje('Error al guardar', 'error');
    }
  });

  renderServicios();
}

// ===== PAQUETES =====
if (pagina.includes('paquetes')) {

  async function renderPaquetes() {
    const container = document.getElementById('paquetes-container');
    try {
      const paquetes = await paquetesAPI.getAll();
      if (paquetes.length === 0) {
        container.innerHTML = '<p class="loading">No hay paquetes.</p>';
        return;
      }
      container.innerHTML = paquetes.map(paq => `
        <div class="card">
          <div class="card__imagen" style="background:var(--color-primario); display:flex; align-items:center; justify-content:center; font-size:3rem;">
            ✈️
          </div>
          <div class="card__contenido">
            <h3 class="card__titulo">${paq.nombre || 'Paquete'}</h3>
            <p class="card__precio">$${paq.precio || '0'}</p>
            <p class="card__descripcion">${paq.descripcion || 'Paquete especial.'}</p>
            <div class="card__acciones">
              <button class="btn btn-primario" onclick="editarPaquete('${paq._id}', '${paq.nombre}', ${paq.precio}, '${paq.descripcion || ''}')">Editar</button>
              <button class="btn btn-peligro" onclick="eliminarPaquete('${paq._id}')">Eliminar</button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = '<p class="loading">Error cargando paquetes.</p>';
    }
  }

  function editarPaquete(id, nombre, precio, descripcion) {
    document.getElementById('paquete-id').value = id;
    document.getElementById('paquete-nombre').value = nombre;
    document.getElementById('paquete-precio').value = precio;
    document.getElementById('paquete-descripcion').value = descripcion;
    abrirModal('Editar Paquete');
  }

  async function eliminarPaquete(id) {
    if (!confirm('¿Seguro que quieres eliminar este paquete?')) return;
    try {
      await paquetesAPI.delete(id);
      mostrarMensaje('Paquete eliminado correctamente', 'exito');
      renderPaquetes();
    } catch (error) {
      mostrarMensaje('Error al eliminar', 'error');
    }
  }

  document.getElementById('btn-agregar').addEventListener('click', () => {
    document.getElementById('form-paquete').reset();
    document.getElementById('paquete-id').value = '';
    abrirModal('Nuevo Paquete');
  });

  document.getElementById('btn-cancelar').addEventListener('click', cerrarModal);

  document.getElementById('form-paquete').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('paquete-id').value;
    const data = {
      nombre: document.getElementById('paquete-nombre').value,
      precio: document.getElementById('paquete-precio').value,
      descripcion: document.getElementById('paquete-descripcion').value
    };
    try {
      if (id) {
        await paquetesAPI.update(id, data);
        mostrarMensaje('Paquete actualizado correctamente', 'exito');
      } else {
        await paquetesAPI.create(data);
        mostrarMensaje('Paquete creado correctamente', 'exito');
      }
      cerrarModal();
      renderPaquetes();
    } catch (error) {
      mostrarMensaje('Error al guardar', 'error');
    }
  });

  renderPaquetes();
}