// ===== VARIABLES GLOBALES PARA PAGINACIÓN =====
let paginaActual = 1;
const itemsPorPagina = 10;
let datosOriginales = []; 
let datosFiltrados = [];   
let tipoModuloActual = ''; 
let totalItemsServidor = 0; 

// ===== CARGAR HEADER Y FOOTER =====
async function cargarComponentes() {
  try {
    const base = window.location.pathname.includes('/pages/') ? '../' : 'src/';
    const query = new URLSearchParams(window.location.search);
    const isAdminEmbed = query.get('admin') === '1';
    const isClientPage = !isAdminEmbed && (window.location.pathname.includes('reservas.html') || window.location.pathname.includes('nueva-reserva.html'));
    const isPublicPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html') || window.location.pathname.includes('forgot-password') || window.location.pathname.includes('reset-password');
    let headerFile = 'header.html';
    if (isClientPage) headerFile = 'client-header.html';
    else if (isPublicPage) headerFile = 'public-header.html';
    
    const headerContainer = document.getElementById('header-container');
    if (headerContainer && !isAdminEmbed) {
      const headerRes = await fetch(`${base}components/${headerFile}?v=` + Date.now());
      const headerHTML = await headerRes.text();
      headerContainer.innerHTML = headerHTML;

      // Mostrar nombre del usuario en el sidebar del cliente
      if (isClientPage) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const userNameEl = document.getElementById('userName');
          if (userNameEl && storedUser.NombreUsuario) {
            userNameEl.textContent = `Bienvenido, ${storedUser.NombreUsuario}`;
          }
        } catch (_) {}
      }

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('user');
          sessionStorage.clear();
          window.location.href = '/src/pages/login.html';
        });
      }
    }

    if (window.lucide) lucide.createIcons();

    if (!isAdminEmbed) {
      inicializarSidebar();
      marcarNavActivo();
    } else {
      const sidebarToggle = document.getElementById('sidebarToggle');
      const overlay = document.getElementById('sidebarOverlay');
      const headerContainerEl = document.getElementById('header-container');
      if (sidebarToggle) sidebarToggle.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
      if (headerContainerEl) headerContainerEl.style.display = 'none';
    }

    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
      const footerRes = await fetch(`${base}components/footer.html?v=` + Date.now());
      const footerHTML = await footerRes.text();
      footerContainer.innerHTML = footerHTML;
    }

  } catch (error) {
    console.error('Error cargando componentes:', error);
  }
}

// ===== SIDEBAR =====
function inicializarSidebar() {
  const sidebar     = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const btnCol      = document.getElementById('sidebarColapsar');
  const btnToggle   = document.getElementById('sidebarToggle');
  const overlay     = document.getElementById('sidebarOverlay');
  const COLLAPSED_KEY = 'sidebar_collapsed';

  function applyCollapsed(collapsed) {
    if (!sidebar || !btnCol) return;
    if (collapsed) {
      sidebar.classList.add('sidebar--colapsado');
      if (mainContent) mainContent.classList.add('main-content--expandido');
      btnCol.innerHTML = '<i data-lucide="chevron-right"></i>';
    } else {
      sidebar.classList.remove('sidebar--colapsado');
      if (mainContent) mainContent.classList.remove('main-content--expandido');
      btnCol.innerHTML = '<i data-lucide="chevron-left"></i>';
    }
    if (window.lucide) lucide.createIcons();
  }

  applyCollapsed(localStorage.getItem(COLLAPSED_KEY) === 'true');

  if (btnCol) {
    btnCol.addEventListener('click', () => {
      const nowCollapsed = !sidebar.classList.contains('sidebar--colapsado');
      localStorage.setItem(COLLAPSED_KEY, nowCollapsed);
      applyCollapsed(nowCollapsed);
    });
  }

  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar--abierto');
      if (overlay) overlay.classList.toggle('activo');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('sidebar--abierto');
      overlay.classList.remove('activo');
    });
  }
}

// ===== MARCAR ENLACE ACTIVO EN NAV =====
function marcarNavActivo() {
  const links = document.querySelectorAll('.nav-link');
  const pathActual = window.location.pathname;
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (pathActual.includes(href) && href !== "/" && href !== "") {
      link.classList.add('activo');
    }
  });
}

// ===== PAGINACIÓN =====
async function renderizarPagina() {
  const containerId = tipoModuloActual === 'clientes'
    ? 'lista'
    : tipoModuloActual === 'cabanas'
      ? 'lista-cabanas'
      : `${tipoModuloActual}-container`;
  const container = document.getElementById(containerId);
  if (!container) return;

  let itemsAMostrar = [];
  let totalParaPaginacion = 0;

  if (tipoModuloActual === 'clientes') {
    const search = document.getElementById('buscador-clientes')?.value || '';
    const res = await clientesAPI.getAll(paginaActual, itemsPorPagina, search);
    itemsAMostrar = res.data || [];
    totalItemsServidor = res.total || 0;
    totalParaPaginacion = totalItemsServidor;
  } else {
    const totalPaginas = Math.max(Math.ceil(datosFiltrados.length / itemsPorPagina), 1);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    itemsAMostrar = datosFiltrados.slice(inicio, fin);
    totalParaPaginacion = datosFiltrados.length;
  }

  if (itemsAMostrar.length === 0) {
    container.innerHTML = `<p class="loading">No se encontraron ${tipoModuloActual}.</p>`;
    renderPaginacion(0);
    return;
  }

  if (tipoModuloActual === 'clientes') {
    container.innerHTML = renderTablaClientes(itemsAMostrar);
  } else if (tipoModuloActual === 'cabanas') {
    container.innerHTML = renderTablaCabanas(itemsAMostrar);
  } else {
    container.innerHTML = itemsAMostrar.map(item => {
      if (tipoModuloActual === 'habitaciones') return templateHabitacion(item);
      if (tipoModuloActual === 'paquetes')     return templatePaquete(item);
      if (tipoModuloActual === 'servicios')    return templateServicio(item);
      if (tipoModuloActual === 'clientes')     return templateCliente(item);
      if (tipoModuloActual === 'cabanas')      return templateCabana(item);
    }).join('');
  }

  renderPaginacion(totalParaPaginacion);

  if (window.lucide) {
    lucide.createIcons({ parent: container });
  }
}

function templateFilaCliente(cliente) {
  const itemJson = JSON.stringify(cliente).replace(/"/g, '&quot;');
  const id = escapeJSString(cliente.IDCliente || '');
  const documento = escapeJSString(cliente.NroDocumento || '');
  const nombre = escapeJSString(cliente.Nombre || '');
  const apellido = escapeJSString(cliente.Apellido || '');
  const direccion = escapeJSString(cliente.Direccion || '');
  const correo = escapeJSString(cliente.Correo || cliente.Email || '');
  const telefono = escapeJSString(cliente.Telefono || '');
  const estado = cliente.Estado ?? 1;
  const estadoTexto = obtenerTextoEstadoCliente(estado);
  const estadoIcono = obtenerIconoEstadoCliente(estado);

  return `
    <tr>
      <td>${nombre} ${apellido}</td>
      <td>${documento}</td>
      <td>${correo}</td>
      <td>${telefono}</td>
      <td>
        <span class="badge ${estado === 1 ? 'badge--activo' : 'badge--inactivo'}">${estadoTexto}</span>
      </td>
      <td class="acciones-col">
        <button class="btn icon-btn ${estado === 1 ? 'btn-verde' : 'btn-peligro'}" aria-label="${estadoTexto}" title="${estadoTexto}" onclick="toggleEstadoCliente('${id}', ${estado})">
          <i data-lucide="${estadoIcono}"></i>
        </button>
        <button class="btn btn-secundario icon-btn" aria-label="Ver cliente" title="Ver cliente" onclick="mostrarDetalles(${itemJson}, 'Cliente')">
          <i data-lucide="eye"></i>
        </button>
        <button class="btn btn-primario icon-btn" aria-label="Editar cliente" title="Editar cliente" onclick="editarCliente('${id}', '${documento}', '${nombre}', '${apellido}', '${direccion}', '${correo}', '${telefono}', ${estado})">
          <i data-lucide="edit-2"></i>
        </button>
        <button class="btn btn-peligro icon-btn" aria-label="Borrar cliente" title="Borrar cliente" onclick="eliminarCliente('${id}')">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>`;
}

function renderTablaClientes(clientes) {
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Documento</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${clientes.map(templateFilaCliente).join('')}
        </tbody>
      </table>
    </div>`;
}

function templateFilaCabana(cabana) {
  const id = escapeJSString(cabana.IDCabana || '');
  const nombre = escapeJSString(cabana.NombreCabana || '');
  const descripcion = escapeJSString(cabana.Descripcion || '');
  const capacidad = escapeJSString(cabana.CapacidadPersonas || '0');
  const precio = escapeJSString(cabana.PrecioNoche || '0');
  const estado = [1, 2, 3, 4, 5].includes(Number(cabana.Estado)) ? Number(cabana.Estado) : 1;
  const estadoTexto = obtenerTextoEstadoCabana(estado);
  const estadoIcono = obtenerIconoEstadoCabana(estado);
  const itemJson = JSON.stringify(cabana).replace(/"/g, '&quot;');

  return `
    <tr>
      <td>${nombre}</td>
      <td>${descripcion}</td>
      <td>${capacidad}</td>
      <td>$${Number(cabana.PrecioNoche || 0).toLocaleString('es-CO')}</td>
      <td class="acciones-col">
        <button class="btn icon-btn ${estado === 1 ? 'btn-secundario' : estado === 2 ? 'btn-morado' : estado === 3 ? 'btn-azul' : estado === 4 ? 'btn-peligro' : 'btn-verde'}" aria-label="${estadoTexto}" title="${estadoTexto}" onclick="toggleEstadoCabana('${id}', ${estado})">
          <i data-lucide="${estadoIcono}"></i>
        </button>
        <button class="btn btn-secundario icon-btn" aria-label="Ver cabaña" title="Ver cabaña" onclick="mostrarDetalleCabana(${itemJson})">
          <i data-lucide="eye"></i>
        </button>
        <button class="btn btn-primario icon-btn" aria-label="Editar cabaña" title="Editar cabaña" onclick="editarCabana('${id}', '${nombre}', '${descripcion}', '${capacidad}', '${precio}', ${estado}, '${escapeJSString(cabana.ImagenCabana || '')}')">
          <i data-lucide="edit-2"></i>
        </button>
        <button class="btn btn-peligro icon-btn" aria-label="Borrar cabaña" title="Borrar cabaña" onclick="eliminarCabana('${id}')">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>`;
}

function renderTablaCabanas(cabanas) {
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Cabaña</th>
            <th>Descripción</th>
            <th>Capacidad</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${cabanas.map(templateFilaCabana).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderPaginacion(totalItems) {
  const paginationId = tipoModuloActual === 'clientes'
    ? 'paginacion-clientes'
    : tipoModuloActual === 'cabanas'
      ? 'paginacion-cabanas'
      : 'paginacion';
  const infoId = tipoModuloActual === 'clientes'
    ? 'paginacion-info-clientes'
    : tipoModuloActual === 'cabanas'
      ? 'paginacion-info-cabanas'
      : 'paginacion-info';

  const navPaginacion = document.getElementById(paginationId);
  const infoPaginacion = document.getElementById(infoId);

  const nombreModulo = tipoModuloActual === 'clientes'
    ? 'clientes'
    : tipoModuloActual === 'cabanas'
      ? 'cabañas'
      : tipoModuloActual;

  const totalPaginas = Math.max(Math.ceil(totalItems / itemsPorPagina), 1);
  if (infoPaginacion) {
    infoPaginacion.textContent = totalItems > 0
      ? `Página ${paginaActual} de ${totalPaginas} · Total ${totalItems} ${nombreModulo}`
      : `No hay ${nombreModulo} disponibles`;
  }

  if (!navPaginacion) return;
  navPaginacion.innerHTML = '';

  if (totalItems === 0) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const boton = document.createElement('button');
    boton.innerText = i;
    if (i === paginaActual) boton.classList.add('active');
    boton.onclick = () => {
      paginaActual = i;
      renderizarPagina();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    navPaginacion.appendChild(boton);
  }
}

function escapeJSString(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ===== TEMPLATES PÁGINAS INTERNAS (con botones editar/borrar) =====
function templateHabitacion(hab) {
  const itemJson = JSON.stringify(hab).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${hab.imagen 
        ? `<img src="${hab.imagen}" class="card__imagen" alt="${hab.NombreHabitacion || hab.tipo || 'Habitación'}" onerror="this.src='../assets/placeholder.jpg'" />` 
        : `<div class="card__imagen" style="background:linear-gradient(135deg, #1a3c5e 0%, #c9a84c 100%); display:flex; align-items:center; justify-content:center; font-size:3rem;">🛏️</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${hab.NombreHabitacion || hab.tipo || 'Habitación'}</h3>
        <p class="card__precio">$${Number(hab.precio || hab.Precio || 0).toLocaleString('es-CO')} / noche</p>
        <p class="card__descripcion">${hab.descripcion || hab.Descripcion || 'Habitación confortable.'}</p>
        <div class="card__acciones">
          <button class="btn icon-btn btn-secundario" title="Ver detalle" onclick="mostrarDetalles(${itemJson}, 'Habitación')">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn btn-primario" onclick="editarHabitacion('${hab.IDHabitacion}', '${hab.NombreHabitacion || hab.tipo || ''}', ${hab.precio || hab.Precio || 0}, '${hab.descripcion || hab.Descripcion || ''}', '${hab.imagen || ''}', ${hab.CapacidadPersonas || 1})">Editar</button>
          <button class="btn btn-peligro" onclick="eliminarHabitacion('${hab.IDHabitacion}')">Borrar</button>
        </div>
      </div>
    </div>`;
}

function templatePaquete(paq) {
  const itemJson = JSON.stringify(paq).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${paq.imagen 
        ? `<img src="${paq.imagen}" class="card__imagen" alt="${paq.nombre || paq.NombrePaquete || 'Paquete'}" onerror="this.src='../assets/placeholder.jpg'" />` 
        : `<div class="card__imagen" style="background:linear-gradient(135deg, #1a3c5e 0%, #c9a84c 100%); display:flex; align-items:center; justify-content:center; font-size:3rem;">✈️</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${paq.nombre || paq.NombrePaquete || 'Paquete'}</h3>
        <p class="card__precio">$${Number(paq.Precio || paq.precio || 0).toLocaleString('es-CO')}</p>
        ${paq.NumeroPersonas ? `<p class="card__descripcion" style="font-size:0.8rem; color:rgba(255,255,255,0.6);">👥 ${paq.NumeroPersonas} persona(s)</p>` : ''}
        <p class="card__descripcion">${paq.Descripcion || paq.descripcion || 'Paquete especial.'}</p>
        <div class="card__acciones">
          <button class="btn icon-btn btn-secundario" title="Ver detalle" onclick="mostrarDetalles(${itemJson}, 'Paquete')">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn btn-primario" onclick="editarPaquete('${paq.IDPaquete}', '${paq.nombre || paq.NombrePaquete || ''}', ${paq.Precio || paq.precio || 0}, '${paq.Descripcion || paq.descripcion || ''}', '${paq.imagen || ''}', ${paq.NumeroPersonas || ''})">Editar</button>
          <button class="btn btn-peligro" onclick="eliminarPaquete('${paq.IDPaquete}')">Borrar</button>
        </div>
      </div>
    </div>`;
}

function templateServicio(ser) {
  const itemJson = JSON.stringify(ser).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${ser.imagen 
        ? `<img src="${ser.imagen}" class="card__imagen" alt="${ser.nombre || ser.NombreServicio || 'Servicio'}" onerror="this.src='../assets/placeholder.jpg'" />` 
        : `<div class="card__imagen" style="background:linear-gradient(135deg, #1a3c5e 0%, #c9a84c 100%); display:flex; align-items:center; justify-content:center; font-size:3rem;">⭐</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${ser.nombre || ser.NombreServicio || 'Servicio'}</h3>
        <p class="card__precio">$${Number(ser.precio || ser.Precio || ser.Costo || 0).toLocaleString('es-CO')}</p>
        <p class="card__descripcion">${ser.Descripcion || ser.descripcion || 'Servicio de calidad.'}</p>
        <div class="card__acciones">
          <button class="btn icon-btn btn-secundario" title="Ver detalle" onclick="mostrarDetalles(${itemJson}, 'Servicio')">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn btn-primario" onclick="editarServicio('${ser.IDServicio}', '${ser.nombre || ser.NombreServicio || ''}', ${ser.precio || ser.Precio || ser.Costo || 0}, '${ser.Descripcion || ser.descripcion || ''}', '${ser.imagen || ''}')">Editar</button>
          <button class="btn btn-peligro" onclick="eliminarServicio('${ser.IDServicio}')">Borrar</button>
        </div>
      </div>
    </div>`;
}

function obtenerTextoEstadoCliente(estado) {
  return estado === 1 || estado === '1' || estado === true
    ? 'Activo'
    : 'Inactivo';
}

function obtenerEtiquetaBotonEstadoCliente(estado) {
  return estado === 1 || estado === '1' || estado === true
    ? 'Desactivar'
    : 'Activar';
}

function obtenerIconoEstadoCliente(estado) {
  return estado === 1 || estado === '1' || estado === true
    ? 'check-circle'
    : 'x-circle';
}

function templateCliente(cliente) {
  const estado = cliente.Estado ?? 1;
  const estadoTexto = obtenerTextoEstadoCliente(estado);
  const estadoIcono = obtenerIconoEstadoCliente(estado);

  return `
    <div class="card">
      <div class="card__contenido">
        <h3 class="card__titulo">${cliente.Nombre} ${cliente.Apellido}</h3>
        <p class="card__descripcion">Documento: ${cliente.NroDocumento}</p>
        <p class="card__descripcion">Dirección: ${cliente.Direccion || 'Sin dirección'}</p>
        <p class="card__descripcion">Correo: ${cliente.Correo || cliente.Email || 'Sin correo'}</p>
        <p class="card__descripcion">Teléfono: ${cliente.Telefono || 'Sin teléfono'}</p>
        <p class="card__descripcion">Rol: ${cliente.IDRol === 2 ? 'VIP' : 'Estándar'}</p>
        <p class="card__descripcion">Estado: ${estadoTexto}</p>
        <div class="card__acciones">
          <button class="estado-icono ${estado === 1 ? 'activo' : 'inactivo'}" aria-label="${estadoTexto}" title="${estadoTexto}" onclick="toggleEstadoCliente('${cliente.IDCliente}', ${estado})">
            <i data-lucide="${estadoIcono}"></i>
          </button>
          <button class="btn btn-primario" onclick="editarCliente('${cliente.IDCliente}', '${cliente.NroDocumento}', '${cliente.Nombre}', '${cliente.Apellido}', '${cliente.Direccion || ''}', '${cliente.Correo || cliente.Email || ''}', '${cliente.Telefono || ''}', ${estado}, ${cliente.IDRol || 1})">Editar</button>
          <button class="btn btn-peligro" onclick="eliminarCliente('${cliente.IDCliente}')">Borrar</button>
        </div>
      </div>
    </div>`;
}

function templateCabana(cabana) {
  const estadoTexto = cabana.Estado === 1 || cabana.Estado === '1' || cabana.Estado === true
    ? '✅ Disponible'
    : '❌ No disponible';
  const itemJson = JSON.stringify(cabana).replace(/"/g, '&quot;');

  return `
    <div class="card">
      ${cabana.ImagenCabana
        ? `<img src="${cabana.ImagenCabana}" class="card__imagen" alt="${cabana.NombreCabana || 'Cabaña'}" onerror="this.src='../assets/placeholder.jpg'" />`
        : `<div class="card__imagen" style="background:var(--color-acento); display:flex; align-items:center; justify-content:center; font-size:3rem;">🏕️</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${cabana.NombreCabana || 'Cabaña'}</h3>
        <p class="card__descripcion">${cabana.Descripcion || 'Sin descripción'}</p>
        <p class="card__descripcion">Capacidad: ${cabana.CapacidadPersonas || 'N/A'}</p>
        <p class="card__descripcion">Precio: $${cabana.PrecioNoche || 0}</p>
        <p class="card__descripcion">Estado: ${estadoTexto}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalleCabana(${itemJson})">Ver Detalles</button>
          <button class="btn btn-primario" onclick="editarCabana('${cabana.IDCabana}', '${cabana.NombreCabana}', '${cabana.Descripcion || ''}', '${cabana.CapacidadPersonas || ''}', '${cabana.PrecioNoche || ''}', '${cabana.Estado ?? 1}', '${cabana.ImagenCabana || ''}')">Editar</button>
          <button class="btn btn-peligro" onclick="eliminarCabana('${cabana.IDCabana}')">Borrar</button>
        </div>
      </div>
    </div>`;
}

function obtenerTextoEstadoCabana(estado) {
  switch (Number(estado)) {
    case 1: return 'En mantenimiento';
    case 2: return 'Reservado';
    case 3: return 'En limpieza';
    case 4: return 'Inactivo temporal';
    case 5: return 'Disponible';
    default: return 'Estado desconocido';
  }
}

function obtenerIconoEstadoCabana(estado) {
  switch (Number(estado)) {
    case 1: return 'wrench';
    case 2: return 'calendar-check';
    case 3: return 'sparkles';
    case 4: return 'x-circle';
    case 5: return 'check-circle';
    default: return 'help-circle';
  }
}

function siguienteEstadoCabana(estadoActual) {
  const estado = Number(estadoActual);
  if (estado === 1) return 2;
  if (estado === 2) return 3;
  if (estado === 3) return 4;
  if (estado === 4) return 5;
  return 1;
}

window.mostrarDetalleCabana = (cabana) => {
  const overlay = document.getElementById('modal-ver-cabana');
  if (!overlay) return;

  document.getElementById('ver-cabana-titulo').textContent = cabana.NombreCabana || 'Cabaña';
  const imagenEl = document.getElementById('ver-cabana-imagen');
  imagenEl.src = cabana.ImagenCabana || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000';
  imagenEl.alt = cabana.NombreCabana || 'Imagen de la cabaña';
  document.getElementById('ver-cabana-descripcion').textContent = cabana.Descripcion || 'Sin descripción disponible.';
  document.getElementById('ver-cabana-capacidad').textContent = `Capacidad: ${cabana.CapacidadPersonas || 'N/A'} personas`;
  document.getElementById('ver-cabana-precio').textContent = `Precio x noche: $${Number(cabana.PrecioNoche || 0).toLocaleString('es-CO')}`;
  document.getElementById('ver-cabana-estado').textContent = `Estado: ${obtenerTextoEstadoCabana(cabana.Estado)}`;

  overlay.classList.add('activo');
};

// ===== TEMPLATES INICIO (solo vista, sin botones admin) =====
function templateHabitacionInicio(hab) {
  const itemJson = JSON.stringify(hab).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${hab.imagen 
        ? `<img src="${hab.imagen}" class="card__imagen" alt="${hab.NombreHabitacion || hab.tipo || 'Habitación'}" onerror="this.style.display='none'" />` 
        : `<div class="card__imagen" style="background:linear-gradient(135deg, #1a3c5e 0%, #c9a84c 100%); display:flex; align-items:center; justify-content:center; font-size:3rem;">🛏️</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${hab.NombreHabitacion || hab.tipo || 'Habitación'}</h3>
        <p class="card__precio">$${Number(hab.precio || hab.Precio || 0).toLocaleString('es-CO')} / noche</p>
        <p class="card__descripcion">${hab.descripcion || hab.Descripcion || 'Habitación confortable.'}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalles(${itemJson}, 'Habitación')" style="width:100%">Ver Detalle</button>
        </div>
      </div>
    </div>`;
}

function templatePaqueteInicio(paq) {
  const itemJson = JSON.stringify(paq).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${paq.imagen 
        ? `<img src="${paq.imagen}" class="card__imagen" alt="${paq.nombre || paq.NombrePaquete || 'Paquete'}" onerror="this.style.display='none'" />` 
        : `<div class="card__imagen" style="background:linear-gradient(135deg, #1a3c5e 0%, #c9a84c 100%); display:flex; align-items:center; justify-content:center; font-size:3rem;">✈️</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${paq.nombre || paq.NombrePaquete || 'Paquete'}</h3>
        <p class="card__precio">$${Number(paq.Precio || paq.precio || 0).toLocaleString('es-CO')}</p>
        <p class="card__descripcion">${paq.Descripcion || paq.descripcion || 'Paquete especial.'}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalles(${itemJson}, 'Paquete')" style="width:100%">Ver Detalle</button>
        </div>
      </div>
    </div>`;
}

function templateServicioInicio(ser) {
  const itemJson = JSON.stringify(ser).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${ser.imagen 
        ? `<img src="${ser.imagen}" class="card__imagen" alt="${ser.nombre || ser.NombreServicio || 'Servicio'}" onerror="this.style.display='none'" />` 
        : `<div class="card__imagen" style="background:linear-gradient(135deg, #1a3c5e 0%, #c9a84c 100%); display:flex; align-items:center; justify-content:center; font-size:3rem;">⭐</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${ser.nombre || ser.NombreServicio || 'Servicio'}</h3>
        <p class="card__precio">$${Number(ser.precio || ser.Precio || ser.Costo || 0).toLocaleString('es-CO')}</p>
        <p class="card__descripcion">${ser.Descripcion || ser.descripcion || 'Servicio de calidad.'}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalles(${itemJson}, 'Servicio')" style="width:100%">Ver Detalle</button>
        </div>
      </div>
    </div>`;
}

// ===== CARGAR DATOS INICIO =====
async function iniciarInicio() {
  try {
    const [habitaciones, paquetes, servicios] = await Promise.all([
      habitacionesAPI.getAll(),
      paquetesAPI.getAll(),
      serviciosAPI.getAll()
    ]);

    const contHab = document.getElementById('habitaciones-container');
    if (contHab) {
      contHab.innerHTML = habitaciones.length
        ? habitaciones.slice(0, 6).map(templateHabitacionInicio).join('')
        : '<p class="loading">No hay habitaciones disponibles.</p>';
    }

    const contPaq = document.getElementById('paquetes-container');
    if (contPaq) {
      contPaq.innerHTML = paquetes.length
        ? paquetes.slice(0, 6).map(templatePaqueteInicio).join('')
        : '<p class="loading">No hay paquetes disponibles.</p>';
    }

    const contSer = document.getElementById('servicios-container');
    if (contSer) {
      contSer.innerHTML = servicios.length
        ? servicios.slice(0, 6).map(templateServicioInicio).join('')
        : '<p class="loading">No hay servicios disponibles.</p>';
    }

  } catch (error) {
    console.error('Error cargando datos del inicio:', error);
  }
}

// ===== MODAL DE DETALLES =====
window.mostrarDetalles = (item, tipo) => {
  const modal = document.getElementById('detalle-modal-overlay');
  if (!modal) return;

  document.getElementById('detalle-nombre').textContent = item.nombre || item.NombreHabitacion || item.tipo || 'Sin nombre';
  document.getElementById('detalle-descripcion').textContent = item.descripcion || item.Descripcion || 'Sin descripción disponible.';
  document.getElementById('detalle-precio').textContent = `$${Number(item.precio || item.Precio || item.Costo || 0).toLocaleString('es-CO')}`;
  document.getElementById('detalle-categoria').textContent = tipo;

  const imgElement = document.getElementById('detalle-img');
  if (imgElement) {
    imgElement.src = item.imagen || item.ImagenCabana ||
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000';
  }

  const estadoEl = document.getElementById('detalle-estado');
  if (estadoEl) {
    const estadoVal = item.Estado ?? item.estado ?? 1;
    const esActivo = estadoVal === 1 || estadoVal === '1' || estadoVal === true || String(estadoVal).toLowerCase() === 'activo';
    estadoEl.textContent = esActivo ? 'Activo' : 'Inactivo';
    estadoEl.style.background = esActivo ? '#10b981' : '#ef4444';
    estadoEl.style.color = '#ffffff';
    estadoEl.style.padding = '2px 10px';
    estadoEl.style.borderRadius = '20px';
    estadoEl.style.fontSize = '0.75rem';
    estadoEl.style.fontWeight = '800';
    estadoEl.style.marginLeft = '10px';
    estadoEl.style.textTransform = 'uppercase';
    estadoEl.style.display = 'inline-block';
  }

  const capacidadEl = document.getElementById('detalle-capacidad');
  const capacidadVal = item.CapacidadPersonas || item.capacidad;
  if (capacidadEl) {
    capacidadEl.textContent = capacidadVal ? `${capacidadVal} Pers.` : '—';
  }

  const extraDiv = document.getElementById('detalle-extra');
  if (extraDiv && !capacidadEl) {
    if (tipo === 'Habitación' && capacidadVal) {
      extraDiv.innerHTML = `
        <span style="display: block; color: #6b7280; font-size: 0.7rem; font-weight: bold; text-transform: uppercase;">Capacidad</span>
        <span style="color: #111827; font-size: 1.4rem; font-weight: 800;">${capacidadVal} Pers.</span>`;
    } else {
      extraDiv.innerHTML = '';
    }
  }

  modal.style.display = 'flex';
};

document.addEventListener('click', (e) => {
  if (e.target.id === 'btn-cerrar-detalle' || e.target.id === 'btn-entendido') {
    const modal = document.getElementById('detalle-modal-overlay');
    if (modal) modal.style.display = 'none';
  }
});

// ===== UTILIDADES =====
function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById('mensaje');
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = `mensaje activo mensaje-${tipo}`;
  setTimeout(() => { mensaje.className = 'mensaje'; }, 3000);
}

function abrirModal(titulo) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-overlay').classList.add('activo');
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.remove('activo');
}

// ===== VALIDACIÓN HELPER =====
function mostrarError(campoId, errorId, mensaje) {
  const campo = document.getElementById(campoId);
  const error = document.getElementById(errorId);
  if (!campo || !error) return;
  campo.classList.add('input-error');
  campo.classList.remove('input-ok');
  error.textContent = mensaje;
  error.classList.add('visible');
}

function limpiarError(campoId, errorId) {
  const campo = document.getElementById(campoId);
  const error = document.getElementById(errorId);
  if (!campo || !error) return;
  campo.classList.remove('input-error');
  campo.classList.add('input-ok');
  error.classList.remove('visible');
}

function limpiarTodosLosErrores(campos) {
  campos.forEach(({ campoId, errorId }) => {
    const campo = document.getElementById(campoId);
    const error = document.getElementById(errorId);
    if (campo) campo.classList.remove('input-error', 'input-ok');
    if (error) error.classList.remove('visible');
  });
}

function validarHabitacion() {
  let valido = true;
  const nombre = document.getElementById('habitacion-nombre').value.trim();
  const precio = document.getElementById('habitacion-precio').value;
  const descripcion = document.getElementById('habitacion-descripcion').value.trim();
  const capacidad = document.getElementById('habitacion-capacidad')?.value;

  if (!nombre) {
    mostrarError('habitacion-nombre', 'error-habitacion-nombre', 'El nombre es obligatorio.');
    valido = false;
  } else { limpiarError('habitacion-nombre', 'error-habitacion-nombre'); }

  if (!precio || Number(precio) <= 0) {
    mostrarError('habitacion-precio', 'error-habitacion-precio', 'Ingresa un precio válido mayor a 0.');
    valido = false;
  } else { limpiarError('habitacion-precio', 'error-habitacion-precio'); }

  if (!capacidad || Number(capacidad) <= 0) {
    mostrarError('habitacion-capacidad', 'error-habitacion-capacidad', 'Ingresa una capacidad válida mayor a 0.');
    valido = false;
  } else { limpiarError('habitacion-capacidad', 'error-habitacion-capacidad'); }

  if (!descripcion) {
    mostrarError('habitacion-descripcion', 'error-habitacion-descripcion', 'La descripción es obligatoria.');
    valido = false;
  } else { limpiarError('habitacion-descripcion', 'error-habitacion-descripcion'); }

  return valido;
}

function validarPaquete() {
  let valido = true;
  const nombre = document.getElementById('paquete-nombre').value.trim();
  const precio = document.getElementById('paquete-precio').value;
  const descripcion = document.getElementById('paquete-descripcion').value.trim();
  const personas = document.getElementById('paquete-personas')?.value;

  if (!nombre) {
    mostrarError('paquete-nombre', 'error-paquete-nombre', 'El nombre es obligatorio.');
    valido = false;
  } else { limpiarError('paquete-nombre', 'error-paquete-nombre'); }

  if (!precio || Number(precio) <= 0) {
    mostrarError('paquete-precio', 'error-paquete-precio', 'Ingresa un precio válido mayor a 0.');
    valido = false;
  } else { limpiarError('paquete-precio', 'error-paquete-precio'); }

  if (!personas || Number(personas) <= 0) {
    mostrarError('paquete-personas', 'error-paquete-personas', 'Ingresa el número de personas.');
    valido = false;
  } else { limpiarError('paquete-personas', 'error-paquete-personas'); }

  if (!descripcion) {
    mostrarError('paquete-descripcion', 'error-paquete-descripcion', 'La descripción es obligatoria.');
    valido = false;
  } else { limpiarError('paquete-descripcion', 'error-paquete-descripcion'); }

  return valido;
}

function validarServicio() {
  let valido = true;
  const nombre = document.getElementById('servicio-nombre').value.trim();
  const precio = document.getElementById('servicio-precio').value;
  const descripcion = document.getElementById('servicio-descripcion').value.trim();

  if (!nombre) {
    mostrarError('servicio-nombre', 'error-servicio-nombre', 'El nombre es obligatorio.');
    valido = false;
  } else { limpiarError('servicio-nombre', 'error-servicio-nombre'); }

  if (!precio || Number(precio) <= 0) {
    mostrarError('servicio-precio', 'error-servicio-precio', 'Ingresa un precio válido mayor a 0.');
    valido = false;
  } else { limpiarError('servicio-precio', 'error-servicio-precio'); }

  if (!descripcion) {
    mostrarError('servicio-descripcion', 'error-servicio-descripcion', 'La descripción es obligatoria.');
    valido = false;
  } else { limpiarError('servicio-descripcion', 'error-servicio-descripcion'); }

  return valido;
}

// ===== INICIAR PÁGINA =====
async function iniciarPagina() {
  const path = window.location.pathname;

  if (path.includes('habitaciones')) {
    tipoModuloActual = 'habitaciones';
    configurarEventosHabitaciones();
    await cargarDatos(habitacionesAPI);
  } else if (path.includes('paquetes')) {
    tipoModuloActual = 'paquetes';
    configurarEventosPaquetes();
    await cargarDatos(paquetesAPI);
  } else if (path.includes('servicios')) {
    tipoModuloActual = 'servicios';
    configurarEventosServicios();
    await cargarDatos(serviciosAPI);
  } else if (path.includes('clientes')) {
    tipoModuloActual = 'clientes';
    configurarEventosClientes();
    await cargarDatos(clientesAPI);
  } else if (path.includes('cabanas')) {
    tipoModuloActual = 'cabanas';
    configurarEventosCabanas();
    await cargarDatos(cabanasAPI);
  } else {
    await iniciarInicio();
  }
}

async function cargarDatos(api) {
  try {
    paginaActual = 1;
    if (tipoModuloActual === 'clientes') {
      const search = document.getElementById('buscador-clientes')?.value || '';
      const res = await api.getAll(paginaActual, itemsPorPagina, search);
      datosOriginales = res.data || [];
      totalItemsServidor = res.total || 0;
      datosFiltrados = [...datosOriginales];
    } else {
      datosOriginales = await api.getAll();
      datosFiltrados = [...datosOriginales];
    }
    renderizarPagina();
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

// ===== HABITACIONES =====
function configurarEventosHabitaciones() {
  const camposHab = [
    { campoId: 'habitacion-nombre',      errorId: 'error-habitacion-nombre' },
    { campoId: 'habitacion-precio',      errorId: 'error-habitacion-precio' },
    { campoId: 'habitacion-capacidad',   errorId: 'error-habitacion-capacidad' },
    { campoId: 'habitacion-descripcion', errorId: 'error-habitacion-descripcion' },
  ];

  const btnAdd = document.getElementById('btn-agregar');
  if (btnAdd) btnAdd.addEventListener('click', () => {
    document.getElementById('form-habitacion').reset();
    document.getElementById('habitacion-id').value = '';
    limpiarTodosLosErrores(camposHab);
    abrirModal('Nueva Habitación');
  });

  const formHab = document.getElementById('form-habitacion');
  if (formHab) formHab.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarHabitacion()) return;

    const id = document.getElementById('habitacion-id').value;
    const nombreInput = document.getElementById('habitacion-nombre').value.trim();

    if (!id) {
      const existe = datosOriginales.some(h => (h.NombreHabitacion || h.tipo || '').toLowerCase() === nombreInput.toLowerCase());
      if (existe) {
        mostrarError('habitacion-nombre', 'error-habitacion-nombre', 'Ya existe una habitación con ese nombre.');
        return;
      }
    }

    const data = {
      tipo: nombreInput,
      precio: document.getElementById('habitacion-precio').value,
      CapacidadPersonas: document.getElementById('habitacion-capacidad')?.value || 1,
      descripcion: document.getElementById('habitacion-descripcion').value.trim(),
      imagen: document.getElementById('habitacion-imagen').value || '',
      Estado: 1
    };
    try {
      if (id) await habitacionesAPI.update(id, data);
      else await habitacionesAPI.create(data);
      cerrarModal();
      mostrarMensaje('Operación exitosa', 'exito');
      cargarDatos(habitacionesAPI);
    } catch (e) { mostrarMensaje('Error al guardar', 'error'); }
  });

  const busq = document.getElementById('buscador-input');
  if (busq) busq.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    datosFiltrados = datosOriginales.filter(h =>
      (h.NombreHabitacion || h.tipo || '').toLowerCase().includes(texto) ||
      (h.descripcion || '').toLowerCase().includes(texto)
    );
    paginaActual = 1;
    renderizarPagina();
  });
}

window.editarHabitacion = (id, nombre, precio, descripcion, imagen, capacidad) => {
  document.getElementById('habitacion-id').value = id;
  document.getElementById('habitacion-nombre').value = nombre;
  document.getElementById('habitacion-precio').value = precio;
  document.getElementById('habitacion-descripcion').value = descripcion;
  document.getElementById('habitacion-imagen').value = imagen;
  const capEl = document.getElementById('habitacion-capacidad');
  if (capEl) capEl.value = capacidad || '';
  limpiarTodosLosErrores([
    { campoId: 'habitacion-nombre',      errorId: 'error-habitacion-nombre' },
    { campoId: 'habitacion-precio',      errorId: 'error-habitacion-precio' },
    { campoId: 'habitacion-capacidad',   errorId: 'error-habitacion-capacidad' },
    { campoId: 'habitacion-descripcion', errorId: 'error-habitacion-descripcion' },
  ]);
  abrirModal('Editar Habitación');
};

window.eliminarHabitacion = async (id) => {
  if (confirm('¿Eliminar esta habitación?')) {
    await habitacionesAPI.delete(id);
    cargarDatos(habitacionesAPI);
  }
};

// ===== PAQUETES =====
function configurarEventosPaquetes() {
  const camposPaq = [
    { campoId: 'paquete-nombre',      errorId: 'error-paquete-nombre' },
    { campoId: 'paquete-precio',      errorId: 'error-paquete-precio' },
    { campoId: 'paquete-descripcion', errorId: 'error-paquete-descripcion' },
  ];

  const btnAdd = document.getElementById('btn-agregar');
  if (btnAdd) btnAdd.addEventListener('click', () => {
    document.getElementById('form-paquete').reset();
    document.getElementById('paquete-id').value = '';
    limpiarTodosLosErrores(camposPaq);
    abrirModal('Nuevo Paquete');
  });

  const formPaq = document.getElementById('form-paquete');
  if (formPaq) formPaq.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarPaquete()) return;

    const id = document.getElementById('paquete-id').value;
    const nombreInput = document.getElementById('paquete-nombre').value.trim();

    if (!id) {
      const existe = datosOriginales.some(p => (p.nombre || p.NombrePaquete || '').toLowerCase() === nombreInput.toLowerCase());
      if (existe) {
        mostrarError('paquete-nombre', 'error-paquete-nombre', 'Ya existe un paquete con ese nombre.');
        return;
      }
    }

    const data = {
      nombre: nombreInput,
      Precio: document.getElementById('paquete-precio').value,
      NumeroPersonas: document.getElementById('paquete-personas')?.value || null,
      Descripcion: document.getElementById('paquete-descripcion').value.trim(),
      imagen: document.getElementById('paquete-imagen').value || '',
      Estado: 1
    };
    if (id) await paquetesAPI.update(id, data);
    else await paquetesAPI.create(data);
    cerrarModal();
    mostrarMensaje('Operación exitosa', 'exito');
    cargarDatos(paquetesAPI);
  });

  const busq = document.getElementById('buscador-input');
  if (busq) busq.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    datosFiltrados = datosOriginales.filter(p => (p.nombre || p.NombrePaquete || '').toLowerCase().includes(texto));
    paginaActual = 1;
    renderizarPagina();
  });
}

window.editarPaquete = (id, nombre, precio, descripcion, imagen, personas) => {
  document.getElementById('paquete-id').value = id;
  document.getElementById('paquete-nombre').value = nombre;
  document.getElementById('paquete-precio').value = precio;
  document.getElementById('paquete-descripcion').value = descripcion;
  document.getElementById('paquete-imagen').value = imagen;
  const paqPersonasEl = document.getElementById('paquete-personas');
  if (paqPersonasEl) paqPersonasEl.value = personas || '';
  limpiarTodosLosErrores([
    { campoId: 'paquete-nombre',      errorId: 'error-paquete-nombre' },
    { campoId: 'paquete-precio',      errorId: 'error-paquete-precio' },
    { campoId: 'paquete-personas',    errorId: 'error-paquete-personas' },
    { campoId: 'paquete-descripcion', errorId: 'error-paquete-descripcion' },
  ]);
  abrirModal('Editar Paquete');
};

window.eliminarPaquete = async (id) => {
  if (confirm('¿Eliminar este paquete?')) {
    await paquetesAPI.delete(id);
    cargarDatos(paquetesAPI);
  }
};

// ===== SERVICIOS =====
function configurarEventosServicios() {
  const camposSer = [
    { campoId: 'servicio-nombre',      errorId: 'error-servicio-nombre' },
    { campoId: 'servicio-precio',      errorId: 'error-servicio-precio' },
    { campoId: 'servicio-descripcion', errorId: 'error-servicio-descripcion' },
  ];

  const btnAdd = document.getElementById('btn-agregar');
  if (btnAdd) btnAdd.addEventListener('click', () => {
    document.getElementById('form-servicio').reset();
    document.getElementById('servicio-id').value = '';
    limpiarTodosLosErrores(camposSer);
    abrirModal('Nuevo Servicio');
  });

  const formSer = document.getElementById('form-servicio');
  if (formSer) formSer.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarServicio()) return;

    const id = document.getElementById('servicio-id').value;
    const nombreInput = document.getElementById('servicio-nombre').value.trim();

    if (!id) {
      const existe = datosOriginales.some(s => (s.nombre || s.NombreServicio || '').toLowerCase() === nombreInput.toLowerCase());
      if (existe) {
        mostrarError('servicio-nombre', 'error-servicio-nombre', 'Ya existe un servicio con ese nombre.');
        return;
      }
    }

    const data = {
      nombre: nombreInput,
      precio: document.getElementById('servicio-precio').value,
      Descripcion: document.getElementById('servicio-descripcion').value.trim(),
      imagen: document.getElementById('servicio-imagen').value || '',
      Estado: 1
    };
    if (id) await serviciosAPI.update(id, data);
    else await serviciosAPI.create(data);
    cerrarModal();
    mostrarMensaje('Operación exitosa', 'exito');
    cargarDatos(serviciosAPI);
  });

  const busq = document.getElementById('buscador-input');
  if (busq) busq.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    datosFiltrados = datosOriginales.filter(s => (s.nombre || s.NombreServicio || '').toLowerCase().includes(texto));
    paginaActual = 1;
    renderizarPagina();
  });
}

window.editarServicio = (id, nombre, precio, descripcion, imagen) => {
  document.getElementById('servicio-id').value = id;
  document.getElementById('servicio-nombre').value = nombre;
  document.getElementById('servicio-precio').value = precio;
  document.getElementById('servicio-descripcion').value = descripcion;
  document.getElementById('servicio-imagen').value = imagen;
  limpiarTodosLosErrores([
    { campoId: 'servicio-nombre',      errorId: 'error-servicio-nombre' },
    { campoId: 'servicio-precio',      errorId: 'error-servicio-precio' },
    { campoId: 'servicio-descripcion', errorId: 'error-servicio-descripcion' },
  ]);
  abrirModal('Editar Servicio');
};

window.eliminarServicio = async (id) => {
  if (confirm('¿Eliminar este servicio?')) {
    await serviciosAPI.delete(id);
    cargarDatos(serviciosAPI);
  }
};

// ===== CLIENTES =====
function configurarEventosClientes() {
  const camposCli = [
    { campoId: 'nroDocumento', errorId: 'error-nroDocumento' },
    { campoId: 'nombre', errorId: 'error-nombre' },
    { campoId: 'apellido', errorId: 'error-apellido' },
    { campoId: 'correo', errorId: 'error-correo' },
    { campoId: 'telefono', errorId: 'error-telefono' }
  ];

  const btnNuevo = document.getElementById('btnNuevoCliente');
  if (btnNuevo) btnNuevo.addEventListener('click', () => {
    document.getElementById('form-clientes').reset();
    document.getElementById('id').value = '';
    document.getElementById('estadoCliente').value = 1;
    limpiarTodosLosErrores(camposCli);
    document.getElementById('clientes-form-title').textContent = '➕ Nuevo Cliente';
    document.getElementById('modal-clientes').classList.add('activo');
  });

  const btnCerrar = document.getElementById('btnCerrarModalCliente');
  if (btnCerrar) btnCerrar.addEventListener('click', () => {
    document.getElementById('modal-clientes').classList.remove('activo');
  });

  const btnLimpiar = document.getElementById('btnLimpiarCliente');
  if (btnLimpiar) btnLimpiar.addEventListener('click', () => {
    document.getElementById('form-clientes').reset();
    document.getElementById('id').value = '';
    document.getElementById('estadoCliente').value = 1;
    limpiarTodosLosErrores(camposCli);
    document.getElementById('modal-clientes').classList.remove('activo');
  });

  const busq = document.getElementById('buscador-clientes');
  if (busq) busq.addEventListener('input', () => {
    paginaActual = 1;
    renderizarPagina();
  });

  const formCli = document.getElementById('form-clientes');
  if (formCli) formCli.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('id').value;
    const data = {
      NroDocumento: document.getElementById('nroDocumento').value.trim(),
      Nombre: document.getElementById('nombre').value.trim(),
      Apellido: document.getElementById('apellido').value.trim(),
      Direccion: document.getElementById('direccion').value.trim(),
      Correo: document.getElementById('correo').value.trim(),
      Email: document.getElementById('correo').value.trim(),
      Telefono: document.getElementById('telefono').value.trim(),
      Estado: Number(document.getElementById('estadoCliente').value || 1),
      IDRol: Number(document.getElementById('idRol') ? document.getElementById('idRol').value : 1)
    };

    try {
      if (id) {
        await clientesAPI.update(id, data);
      } else {
        await clientesAPI.create(data);
      }
      document.getElementById('modal-clientes').classList.remove('activo');
      cargarDatos(clientesAPI);
    } catch (error) {
      console.error('Error guardando cliente:', error);
    }
  });
}

window.editarCliente = (id, documento, nombre, apellido, direccion, correo, telefono, estado = 1, idRol = 1) => {
  document.getElementById('id').value = id;
  document.getElementById('nroDocumento').value = documento;
  document.getElementById('nombre').value = nombre;
  document.getElementById('apellido').value = apellido;
  document.getElementById('direccion').value = direccion;
  document.getElementById('correo').value = correo;
  document.getElementById('telefono').value = telefono;
  document.getElementById('estadoCliente').value = Number(estado);
  const idRolEl = document.getElementById('idRol');
  if (idRolEl) idRolEl.value = Number(idRol);
  document.getElementById('clientes-form-title').textContent = '✏️ Editar Cliente';
  document.getElementById('modal-clientes').classList.add('activo');
};

window.eliminarCliente = async (id) => {
  if (!confirm('¿Eliminar este cliente?')) return;
  await clientesAPI.delete(id);
  cargarDatos(clientesAPI);
};

window.toggleEstadoCliente = async (id, estadoActual) => {
  const nuevoEstado = estadoActual === 1 || estadoActual === '1' || estadoActual === true ? 0 : 1;
  try {
    await clientesAPI.updateEstado(id, { Estado: nuevoEstado });
    cargarDatos(clientesAPI);
  } catch (error) {
    console.error('Error actualizando estado de cliente:', error);
  }
};

// ===== CABAÑAS =====
window.toggleEstadoCabana = async (id, estadoActual) => {
  const nuevoEstado = siguienteEstadoCabana(estadoActual);
  try {
    await cabanasAPI.updateEstado(id, { Estado: nuevoEstado });
    cargarDatos(cabanasAPI);
  } catch (error) {
    console.error('Error actualizando estado de cabaña:', error);
  }
};

function configurarEventosCabanas() {
  const camposCab = [
    { campoId: 'nombreCabana', errorId: 'error-nombreCabana' },
    { campoId: 'precioNoche', errorId: 'error-precioNoche' }
  ];

  const btnNueva = document.getElementById('btnNuevaCabana');
  if (btnNueva) btnNueva.addEventListener('click', () => {
    document.getElementById('form-cabanas').reset();
    document.getElementById('cabana-id').value = '';
    document.getElementById('estadoCabana').value = 1;
    limpiarTodosLosErrores(camposCab);
    document.getElementById('cabanas-form-title').textContent = '➕ Nueva Cabaña';
    document.getElementById('modal-cabanas').classList.add('activo');
  });

  const btnCerrar = document.getElementById('btnCerrarModalCabana');
  if (btnCerrar) btnCerrar.addEventListener('click', () => {
    document.getElementById('modal-cabanas').classList.remove('activo');
  });

  const btnLimpiar = document.getElementById('btnLimpiarCabana');
  if (btnLimpiar) btnLimpiar.addEventListener('click', () => {
    document.getElementById('form-cabanas').reset();
    document.getElementById('cabana-id').value = '';
    limpiarTodosLosErrores(camposCab);
    document.getElementById('modal-cabanas').classList.remove('activo');
  });

  const busq = document.getElementById('buscador-cabanas');
  if (busq) busq.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    datosFiltrados = datosOriginales.filter(cabana =>
      (cabana.NombreCabana || '').toLowerCase().includes(texto) ||
      (cabana.Descripcion || '').toLowerCase().includes(texto)
    );
    paginaActual = 1;
    renderizarPagina();
  });

  const formCab = document.getElementById('form-cabanas');
  if (formCab) formCab.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('cabana-id').value;
    const data = {
      NombreCabana: document.getElementById('nombreCabana').value.trim(),
      Descripcion: document.getElementById('descripcionCabana').value.trim(),
      CapacidadPersonas: document.getElementById('capacidadPersonas').value,
      PrecioNoche: document.getElementById('precioNoche').value,
      Estado: Number(document.getElementById('estadoCabana').value || 1),
      ImagenCabana: document.getElementById('imagenCabana').value.trim()
    };

    try {
      if (id) {
        await cabanasAPI.update(id, data);
      } else {
        await cabanasAPI.create(data);
      }
      document.getElementById('modal-cabanas').classList.remove('activo');
      cargarDatos(cabanasAPI);
    } catch (error) {
      console.error('Error guardando cabaña:', error);
    }
  });
}

window.editarCabana = (id, nombre, descripcion, capacidad, precio, estado, imagen) => {
  document.getElementById('cabana-id').value = id;
  document.getElementById('nombreCabana').value = nombre;
  document.getElementById('descripcionCabana').value = descripcion;
  document.getElementById('capacidadPersonas').value = capacidad;
  document.getElementById('precioNoche').value = precio;
  document.getElementById('estadoCabana').value = estado;
  document.getElementById('imagenCabana').value = imagen;
  document.getElementById('cabanas-form-title').textContent = '✏️ Editar Cabaña';
  document.getElementById('modal-cabanas').classList.add('activo');
};

window.eliminarCabana = async (id) => {
  if (!confirm('¿Eliminar esta cabaña?')) return;
  await cabanasAPI.delete(id);
  cargarDatos(cabanasAPI);
};

const btnCerrarVerCabana = document.getElementById('btnCerrarVerCabana');
if (btnCerrarVerCabana) btnCerrarVerCabana.addEventListener('click', () => {
  const overlay = document.getElementById('modal-ver-cabana');
  if (overlay) overlay.classList.remove('activo');
});

const btnCancel = document.getElementById('btn-cancelar');
if (btnCancel) btnCancel.addEventListener('click', cerrarModal);

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', async () => {
  await cargarComponentes();
  await iniciarPagina();
});