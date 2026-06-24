// Orden lógico del flujo de una reserva: Pendiente → Confirmada → En Proceso → Cancelada → Completada
const ORDEN_ESTADOS = [1, 2, 5, 3, 4];
function ordenarEstados(lista) {
    return [...lista].sort((a, b) => {
        const ia = ORDEN_ESTADOS.indexOf(a.IdEstadoReserva);
        const ib = ORDEN_ESTADOS.indexOf(b.IdEstadoReserva);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

// Verificar sesión y rol
const userData = localStorage.getItem('user');
if (!userData) window.location.href = '/src/pages/login.html';
const user = JSON.parse(userData);
if (user.IDRol !== 2) window.location.href = '/src/pages/reservas.html';

const adminName = document.getElementById('adminName');
const newItemBtn = document.getElementById('newItemBtn');
const searchInput = document.getElementById('searchInput');
let currentSection = 'dashboard';
let paginaActualClientes = 1;
const itemsPorPaginaClientes = 9;

let paginaActualHabitaciones = 1;
const itemsPorPaginaHabitaciones = 9;

let paginaActualPaquetes = 1;
const itemsPorPaginaPaquetes = 9;

let paginaActualServicios = 1;
const itemsPorPaginaServicios = 9;

let paginaActualCabanas = 1;
const itemsPorPaginaCabanas = 9;

if (adminName) {
    adminName.textContent = `Bienvenido, ${user.NombreUsuario}`;
}

// Búsqueda en tiempo real
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        if (currentSection === 'clientes') {
            paginaActualClientes = 1;
            cargarClientes();
        } else if (currentSection === 'habitaciones') {
            paginaActualHabitaciones = 1;
            cargarHabitaciones();
        } else if (currentSection === 'paquetes') {
            paginaActualPaquetes = 1;
            cargarPaquetes();
        } else if (currentSection === 'servicios') {
            paginaActualServicios = 1;
            cargarServicios();
        } else if (currentSection === 'cabanas') {
            paginaActualCabanas = 1;
            cargarCabanas();
        }
    });
}

// Cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '/src/pages/login.html';
    });
}

// Toggle sidebar hamburguesa
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const adminSidebar = document.querySelector('.admin-sidebar');
const adminMain = document.querySelector('.admin-main');

if (sidebarToggleBtn && adminSidebar && adminMain) {
    const STORAGE_KEY = 'aura_sidebar_collapsed';
    const iconEl = sidebarToggleBtn.querySelector('i');

    function applySidebarState(collapsed) {
        adminSidebar.classList.toggle('sidebar-collapsed', collapsed);
        adminMain.classList.toggle('sidebar-collapsed', collapsed);
        if (iconEl) {
            iconEl.setAttribute('data-lucide', collapsed ? 'panel-left-open' : 'menu');
            lucide.createIcons();
        }
    }

    // Restaurar estado guardado
    const savedCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
    applySidebarState(savedCollapsed);

    sidebarToggleBtn.addEventListener('click', () => {
        const isCollapsed = adminSidebar.classList.contains('sidebar-collapsed');
        const newState = !isCollapsed;
        localStorage.setItem(STORAGE_KEY, newState);
        applySidebarState(newState);
    });
}

// Botón Nuevo Item
if (newItemBtn) {
    newItemBtn.addEventListener('click', () => {
        if (currentSection === 'reservas') {
            window.location.href = '/src/pages/admin-nueva-reserva.html';
        } else {
            abrirModalCrear();
        }
    });
}

// Navegación — ahora usa .admin-nav-item y .stat-card (dashboard cards)
const navItems = document.querySelectorAll('.admin-nav-item');
const sections = document.querySelectorAll('.admin-section');
const titles = {
    dashboard:    'Panel de Control',
    reservas:     'Gestión de Reservas',
    habitaciones: 'Gestión de Habitaciones',
    usuarios:     'Gestión de Usuarios',
    clientes:     'Gestión de Clientes',
    cabanas:      'Gestión de Cabañas',
    paquetes:     'Gestión de Paquetes',
    servicios:    'Gestión de Servicios'
};

function switchSection(sectionId) {
    // Actualizar items de navegación del sidebar
    navItems.forEach(n => {
        n.classList.toggle('active', n.dataset.section === sectionId);
    });

    // Actualizar secciones
    sections.forEach(s => s.classList.remove('active'));
    
    currentSection = sectionId;
    const targetSection = document.getElementById(`section-${currentSection}`);
    if (targetSection) targetSection.classList.add('active');
    
    const titleEl = document.getElementById('sectionTitle');
    if (titleEl) titleEl.textContent = titles[currentSection];
    
    updateHeader(currentSection);
    cargarSeccion(currentSection);

    // Si navegamos fuera de dashboard, el scroll debería ir arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach(item => {
    item.addEventListener('click', () => switchSection(item.dataset.section));
});

// Hacer que las tarjetas del dashboard funcionen como acceso rápido (Delegación de eventos)
function initStatCards() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    statsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.stat-card');
        if (card) {
            const section = card.dataset.section;
            if (section) switchSection(section);
        }
    });
}
document.addEventListener('DOMContentLoaded', initStatCards);
// Si ya cargó el script, intentamos inicializar de una vez
initStatCards();

function cargarSeccion(section) {
    switch(section) {
        case 'dashboard':    cargarDashboard();    break;
        case 'reservas':     cargarReservas();     break;
        case 'habitaciones': cargarHabitaciones(); break;
        case 'usuarios':     cargarUsuarios();     break;
        case 'clientes':     cargarClientes();     break;
        case 'cabanas':      cargarCabanas();      break;
        case 'paquetes':     cargarPaquetes();     break;
        case 'servicios':    cargarServicios();    break;
    }
}

function updateHeader(section) {
    if (!newItemBtn) return;
    newItemBtn.style.display = 'inline-flex';
    
    const searchContainer = document.querySelector('.admin-search');
    if (searchContainer) {
        searchContainer.style.display = (section === 'dashboard') ? 'none' : 'flex';
    }
    
    switch(section) {
        case 'reservas':     newItemBtn.textContent = '+ Nueva reserva';     break;
        case 'habitaciones': newItemBtn.textContent = '+ Nueva habitación'; break;
        case 'clientes':     newItemBtn.textContent = '+ Nuevo cliente';     break;
        case 'cabanas':      newItemBtn.textContent = '+ Nueva cabaña';      break;
        case 'usuarios':     newItemBtn.textContent = '+ Nuevo usuario';     break;
        case 'paquetes':     newItemBtn.textContent = '+ Nuevo paquete';     break;
        case 'servicios':    newItemBtn.textContent = '+ Nuevo servicio';    break;
        default:             newItemBtn.style.display = 'none';
    }
}

// ===== RESERVAS =====
let reservasData = [];
let reservasEstados = [];
let reservasCurrentPage = 1;
let reservasTotal = 0;
const reservasLimit = 6;

async function cargarReservas(page = 1) {
    reservasCurrentPage = page;
    const list = document.getElementById('reservasList');
    if (!list.innerHTML.trim()) {
        list.innerHTML = '<p style="color:rgba(26,43,74,0.5); padding:2rem;">Cargando reservas...</p>';
    }

    try {
        const [resReservas, resEstados] = await Promise.all([
            fetch(`/api/reservas?page=${reservasCurrentPage}&limit=${reservasLimit}`),
            fetch('/api/estadosreserva')
        ]);

        if (!resReservas.ok) throw new Error(`Error reservaciones: ${resReservas.status}`);
        if (!resEstados.ok)  throw new Error(`Error estados: ${resEstados.status}`);

        const responseData = await resReservas.json();
        reservasEstados    = ordenarEstados(await resEstados.json());

        // Manejar respuesta paginada
        reservasData  = responseData.data || [];
        reservasTotal = responseData.total || 0;
        
        const kpis = {
            total: responseData.total || 0,
            pendientes: responseData.pendientes || 0,
            confirmadas: responseData.confirmadas || 0,
            montoTotal: responseData.montoTotal || 0
        };

        if (!Array.isArray(reservasData) || reservasData.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; padding:4rem 2rem; color:rgba(26,43,74,0.45);">
                    <div style="font-size:3rem; margin-bottom:1rem;">📭</div>
                    <p style="font-size:1.1rem;">No hay reservas registradas en el sistema.</p>
                </div>`;
            return;
        }

        renderReservas(reservasData, kpis);

    } catch (error) {
        list.innerHTML = `
            <div style="text-align:center; padding:3rem; color:#ef4444;">
                <div style="font-size:2.5rem; margin-bottom:1rem;">⚠️</div>
                <p>Error al cargar las reservas. Intenta de nuevo.</p>
            </div>`;
        console.error('Error cargando reservas:', error);
    }
}

function renderReservas(reservas, kpis) {
    const list = document.getElementById('reservasList');
    const totalPages = Math.ceil(reservasTotal / reservasLimit);

    const estadoConfig = {
        pendiente:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: 'clock' },
        confirmada:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  icon: 'check-circle-2' },
        cancelada:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   icon: 'x-circle' },
        completada:   { color: '#2B6CB0', bg: 'rgba(49,130,206,0.12)',  border: 'rgba(49,130,206,0.3)',  icon: 'check-circle' },
        'en proceso': { color: '#0D9488', bg: 'rgba(13,148,136,0.12)',  border: 'rgba(13,148,136,0.3)',  icon: 'door-open' },
    };

    function getEstado(nombre) {
        const key = (nombre || '').toLowerCase();
        return estadoConfig[key] || { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', icon: 'help-circle' };
    }

    function formatFecha(f) {
        if (!f) return '—';
        return new Date(f).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
    }

    function diasRestantes(fin) {
        if (!fin) return null;
        const hoy  = new Date();
        const date = new Date(fin);
        const diff = Math.ceil((date - hoy) / (1000 * 60 * 60 * 24));
        return diff;
    }

    list.innerHTML = `
        <!-- KPI BAR -->
        <div class="reservas-kpi-bar">
            <div class="reservas-kpi">
                <span class="reservas-kpi__num">${kpis.total}</span>
                <span class="reservas-kpi__label">Total</span>
            </div>
            <div class="reservas-kpi reservas-kpi--pendiente">
                <span class="reservas-kpi__num">${kpis.pendientes}</span>
                <span class="reservas-kpi__label">Pendientes</span>
            </div>
            <div class="reservas-kpi reservas-kpi--confirmada">
                <span class="reservas-kpi__num">${kpis.confirmadas}</span>
                <span class="reservas-kpi__label">Confirmadas</span>
            </div>
            <div class="reservas-kpi reservas-kpi--monto">
                <span class="reservas-kpi__num">$${kpis.montoTotal.toLocaleString('es-CO')}</span>
                <span class="reservas-kpi__label">Ingresos totales</span>
            </div>
        </div>

        <!-- FILTROS RÁPIDOS -->
        <div class="reservas-filtros">
            <button class="reservas-filtro active" onclick="filtrarReservas('todas', this)">Todas</button>
            ${reservasEstados.map(e => `
                <button class="reservas-filtro" onclick="filtrarReservas('${e.NombreEstadoReserva?.toLowerCase()}', this)">
                    ${e.NombreEstadoReserva}
                </button>
            `).join('')}
        </div>

        <!-- CARDS DE RESERVAS -->
        <div class="reservas-grid" id="reservasGrid">
            ${reservas.map(r => {
                const cfg        = getEstado(r.NombreEstadoReserva);
                const esCompletada = (r.NombreEstadoReserva || '').toLowerCase() === 'completada';
                const dias  = diasRestantes(r.FechaFinalizacion);
                const diasTxt = dias !== null
                    ? dias > 0
                        ? `<span style="color:#10b981; font-size:0.75rem;">⏳ ${dias} días restantes</span>`
                        : dias === 0
                            ? `<span style="color:#f59e0b; font-size:0.75rem;">⚡ Finaliza hoy</span>`
                            : `<span style="color:#ef4444; font-size:0.75rem;">✓ Finalizada hace ${Math.abs(dias)} días</span>`
                    : '';

                return `
                <div class="reserva-card${esCompletada ? ' reserva-card--completada' : ''}" data-estado="${r.NombreEstadoReserva?.toLowerCase()}">
                    <div class="reserva-card__header" style="border-left: 4px solid ${cfg.color};">
                        <div class="reserva-card__id-wrap">
                            <span class="reserva-card__id">#${r.IdReserva}</span>
                            <span class="reserva-card__badge" style="color:${cfg.color}; background:${cfg.bg}; border:1px solid ${cfg.border};">
                                <i data-lucide="${cfg.icon}" style="width:12px; height:12px;"></i>
                                ${r.NombreEstadoReserva}
                            </span>
                            ${esCompletada ? '<span class="reserva-card__historial-tag">🔒 Historial</span>' : ''}
                        </div>
                        <div class="reserva-card__select-wrap">
                            <select class="reserva-estado-select" ${esCompletada ? 'disabled title="Las reservas completadas son de solo lectura"' : `onchange="cambiarEstado(${r.IdReserva}, this.value)"`}
                                style="border-color: ${cfg.border}; color: ${cfg.color}; ${esCompletada ? 'opacity:0.5; cursor:not-allowed;' : ''}">
                                ${reservasEstados.map(e => `
                                    <option value="${e.IdEstadoReserva}"
                                        ${e.IdEstadoReserva === r.IdEstadoReserva ? 'selected' : ''}>
                                        ${e.NombreEstadoReserva}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="reserva-card__body">
                        <div class="reserva-card__cliente">
                            <div class="reserva-card__avatar" style="background: linear-gradient(135deg, ${cfg.color}33, ${cfg.color}11);">
                                <span style="color:${cfg.color}; font-weight:700; font-size:1rem;">
                                    ${(r.NombreUsuario || '?')[0].toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p class="reserva-card__nombre">${r.NombreUsuario || '—'}</p>
                                <p class="reserva-card__doc">Doc: ${r.NroDocumentoCliente || '—'}</p>
                            </div>
                        </div>
                        <div class="reserva-card__detalles">
                            <div class="reserva-card__detalle">
                                <i data-lucide="calendar" style="width:14px; color:var(--color-acento);"></i>
                                <div><span class="reserva-card__detalle-label">Check-in</span><span class="reserva-card__detalle-val">${formatFecha(r.FechaInicio)}</span></div>
                            </div>
                            <div class="reserva-card__detalle">
                                <i data-lucide="calendar-off" style="width:14px; color:var(--color-acento);"></i>
                                <div><span class="reserva-card__detalle-label">Check-out</span><span class="reserva-card__detalle-val">${formatFecha(r.FechaFinalizacion)}</span></div>
                            </div>
                            <div class="reserva-card__detalle">
                                <i data-lucide="credit-card" style="width:14px; color:var(--color-acento);"></i>
                                <div><span class="reserva-card__detalle-label">Pago</span><span class="reserva-card__detalle-val">${r.NomMetodoPago || '—'}</span></div>
                            </div>
                            <div class="reserva-card__detalle">
                                <i data-lucide="dollar-sign" style="width:14px; color:#10b981;"></i>
                                <div><span class="reserva-card__detalle-label">Total</span><span class="reserva-card__detalle-val reserva-card__total">$${(r.MontoTotal || 0).toLocaleString('es-CO')}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="reserva-card__footer">
                        <span class="reserva-card__footer-left">${diasTxt}</span>
                        <div class="reserva-card__acciones">
                            <button onclick="verDetalleReserva(${r.IdReserva})" class="btn-icon-admin btn-view" title="Ver Detalle">
                                <i data-lucide="eye" style="width:15px;"></i>
                            </button>
                            ${esCompletada ? '' : `
                            <button onclick="editarReserva(${r.IdReserva})" class="btn-icon-admin btn-edit" title="Editar Reserva">
                                <i data-lucide="edit-2" style="width:15px;"></i>
                            </button>
                            <button onclick="eliminarReserva(${r.IdReserva})" class="btn-icon-admin btn-delete" title="Eliminar Reserva">
                                <i data-lucide="trash-2" style="width:15px;"></i>
                            </button>`}
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>

        <!-- PAGINACIÓN -->
        <div class="admin-pagination">
            <button class="pagination-btn" ${reservasCurrentPage === 1 ? 'disabled' : ''} onclick="cargarReservas(${reservasCurrentPage - 1})">
                <i data-lucide="chevron-left"></i>
            </button>
            
            <div class="pagination-pages">
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                    <button class="pagination-page ${p === reservasCurrentPage ? 'active' : ''}" 
                            onclick="cargarReservas(${p})">${p}</button>
                `).join('')}
            </div>

            <button class="pagination-btn" ${reservasCurrentPage === totalPages ? 'disabled' : ''} onclick="cargarReservas(${reservasCurrentPage + 1})">
                <i data-lucide="chevron-right"></i>
            </button>
        </div>`;

    if (window.lucide) lucide.createIcons({ parent: list });
}

function filtrarReservas(estado, btn) {
    // Actualizar botones de filtro
    const filtros = document.querySelectorAll('.reservas-filtro');
    filtros.forEach(f => f.classList.remove('active'));
    btn.classList.add('active');

    const cards = document.querySelectorAll('.reserva-card');
    cards.forEach(card => {
        if (estado === 'todas' || card.dataset.estado === estado) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

async function cambiarEstado(idReserva, idEstado) {
    try {
        const response = await fetch(`/api/reservas/${idReserva}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ IdEstadoReserva: idEstado })
        });
        if (response.ok) {
            cargarReservas();
            mostrarNotificacion('Estado de la reserva actualizado.', 'success');
        }
        else mostrarNotificacion('Error al cambiar el estado de la reserva.', 'error');
    } catch (error) {
        mostrarNotificacion('Error de conexión al servidor.', 'error');
    }
}

// ===== CRUD DE RESERVAS =====
window.verDetalleReserva = async (id) => {
    try {
        const res = await fetch(`/api/reservas/${id}`);
        if (!res.ok) throw new Error('No se pudo cargar la reserva');
        const r = await res.json();

        const estadoConfig = {
            pendiente:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: 'clock' },
            confirmada:   { color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: 'check-circle-2' },
            cancelada:    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: 'x-circle' },
            completada:   { color: '#2B6CB0', bg: 'rgba(49,130,206,0.15)',  icon: 'check-circle' },
            'en proceso': { color: '#0D9488', bg: 'rgba(13,148,136,0.15)', icon: 'door-open' },
        };
        const key = (r.NombreEstadoReserva || '').toLowerCase();
        const cfg = estadoConfig[key] || { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: 'help-circle' };
        const fmt = f => f ? new Date(f).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) : '—';
        const montoFmt = (v) => '$' + Number(v || 0).toLocaleString('es-CO');
        const alojamiento = r.NombreHabitacion || r.NombreCabana || r.NombrePaquete || '—';
        const serviciosHtml = (r.servicios && r.servicios.length > 0)
            ? r.servicios.map(s => {
                const precioUnit = s.PrecioUnitario || s.Costo || s.precio || 0;
                const cant = s.Cantidad || 1;
                const totalS = s.Subtotal || (precioUnit * cant);
                const extra = cant > 1 ? ` <span style="opacity:0.7;font-weight:400;">(x${cant} personas)</span>` : '';
                return `<span class="rd-tag">${s.NombreServicio}
                    <span style="margin-left:0.35rem;font-weight:700;color:#2B6CB0;">$${Number(totalS).toLocaleString('es-CO')}${extra}</span>
                </span>`;
            }).join('')
            : '<span style="color:rgba(26,43,74,0.45); font-size:0.8rem;">Sin servicios adicionales</span>';

        document.getElementById('detalleTitulo').textContent = `Detalle de Reserva #${r.IdReserva}`;
        document.getElementById('detalleContent').style.padding = '0';
        const modalBox = document.querySelector('#detalleModalOverlay .modal-box-ver');
        if (modalBox) modalBox.classList.remove('modal-box--wide');

        document.getElementById('detalleContent').innerHTML = `
        <div class="rd-wrap">

          <!-- FRANJA DE RESUMEN HORIZONTAL -->
          <div class="rd-hero" style="border-top: 3px solid ${cfg.color};">
            <div class="rd-hero__left">
              <span class="rd-badge" style="color:${cfg.color}; background:${cfg.bg}; border-color:${cfg.color}44;">
                <i data-lucide="${cfg.icon}" style="width:12px;height:12px;"></i>
                ${r.NombreEstadoReserva || '—'}
              </span>
              <div class="rd-hero__id"># ${r.IdReserva}</div>
            </div>
            <div class="rd-hero__center">
              <span class="rd-hero__label">Total a pagar</span>
              <span class="rd-hero__amount" style="color:#1A2B4A;">
                <span style="color:#10b981;">$</span>${Number(r.MontoTotal || 0).toLocaleString('es-CO')}
              </span>
            </div>
            <div class="rd-hero__right">
              <span class="rd-hero__label">Reservado el</span>
              <span class="rd-hero__date">${fmt(r.FechaReserva || null)}</span>
            </div>
          </div>

          <!-- GRID DE DATOS 2x2 -->
          <div class="rd-grid">

            <!-- CLIENTE -->
            <div class="rd-card">
              <div class="rd-card__icon" style="background:rgba(123,47,247,0.15); border-color:rgba(123,47,247,0.3); color:#9b59f5;">
                <i data-lucide="user" style="width:16px;height:16px;"></i>
              </div>
              <div class="rd-card__content">
                <span class="rd-card__label">Cliente</span>
                <span class="rd-card__value">${r.NombreUsuario || '—'}</span>
                <span class="rd-card__sub">${r.NroDocumentoCliente ? 'Doc: ' + r.NroDocumentoCliente : ''}</span>
              </div>
            </div>

            <!-- ALOJAMIENTO -->
            <div class="rd-card">
              <div class="rd-card__icon" style="background:rgba(49,130,206,0.12); border-color:rgba(49,130,206,0.3); color:#2B6CB0;">
                <i data-lucide="home" style="width:16px;height:16px;"></i>
              </div>
              <div class="rd-card__content">
                <span class="rd-card__label">Alojamiento</span>
                <span class="rd-card__value">${alojamiento}</span>
                <span class="rd-card__sub">${r.NombrePaquete ? 'Paquete' : r.NombreCabana ? 'Cabaña' : 'Habitación'}</span>
              </div>
            </div>

            <!-- ESTADIA -->
            <div class="rd-card">
              <div class="rd-card__icon" style="background:rgba(16,185,129,0.12); border-color:rgba(16,185,129,0.3); color:#10b981;">
                <i data-lucide="calendar-range" style="width:16px;height:16px;"></i>
              </div>
              <div class="rd-card__content">
                <span class="rd-card__label">Estadía</span>
                <div class="rd-dates">
                  <span><i data-lucide="log-in" style="width:11px;color:#10b981;"></i> ${fmt(r.FechaInicio)}</span>
                  <span style="color:rgba(26,43,74,0.35);">→</span>
                  <span><i data-lucide="log-out" style="width:11px;color:#ef4444;"></i> ${fmt(r.FechaFinalizacion)}</span>
                </div>
              </div>
            </div>

            <!-- PAGO -->
            <div class="rd-card">
              <div class="rd-card__icon" style="background:rgba(245,158,11,0.12); border-color:rgba(245,158,11,0.3); color:#f59e0b;">
                <i data-lucide="credit-card" style="width:16px;height:16px;"></i>
              </div>
              <div class="rd-card__content">
                <span class="rd-card__label">Método de pago</span>
                <span class="rd-card__value">${r.NomMetodoPago || '—'}</span>
                <div class="rd-amounts">
                  <span>Subtotal: <b>${montoFmt(r.SubTotal)}</b></span>
                  ${r.Descuento ? `<span>Dto: <b>${r.Descuento}%</b></span>` : ''}
                  ${r.IVA ? `<span>IVA: <b>${r.IVA}%</b></span>` : ''}
                </div>
              </div>
            </div>

          </div><!-- /rd-grid -->

          <!-- SERVICIOS ADICIONALES -->
          <div class="rd-section">
            <span class="rd-section__label">
              <i data-lucide="sparkles" style="width:13px; color:var(--color-acento);"></i>
              Servicios adicionales
            </span>
            <div class="rd-tags">${serviciosHtml}</div>
          </div>

        </div>`;

        if (window.lucide) lucide.createIcons({ parent: document.getElementById('detalleContent') });
        document.getElementById('detalleModalOverlay').classList.add('activo');
    } catch(e) {
        console.error(e);
        mostrarNotificacion('Error al cargar el detalle de la reserva.', 'error');
    }
};


// ── Ajusta la cantidad de un servicio en el modal de edición ─────────────────
window.erAjustarCantidad = function(id, delta) {
    const input = document.querySelector(`.er-srv-qty[data-servicio-id="${id}"]`);
    if (!input) return;
    input.value = Math.max(1, Math.min(20, parseInt(input.value || 1) + delta));
    erRecalcular();
};

// ── Recalcula el monto total visible en el modal de edición ──────────────────
function erRecalcular() {
    const inicio = document.getElementById('er_fechaInicio')?.value;
    const fin    = document.getElementById('er_fechaFin')?.value;
    const noches = (inicio && fin && new Date(fin) > new Date(inicio))
        ? Math.round((new Date(fin) - new Date(inicio)) / 86400000)
        : 1;
    const alojSelect = document.getElementById('er_alojamiento');
    const alojPrecio = alojSelect ? Number(alojSelect.selectedOptions[0]?.dataset.precio || 0) : 0;
    const totalServicios = [...document.querySelectorAll('#er_servicios_grid .er-srv-check:checked')]
        .reduce((sum, cb) => {
            const qty = parseInt(document.querySelector(`.er-srv-qty[data-servicio-id="${cb.value}"]`)?.value || 1);
            return sum + Number(cb.dataset.precio || 0) * qty;
        }, 0);
    // Actualizar totales individuales por servicio
    document.querySelectorAll('#er_servicios_grid .er-srv-check').forEach(cb => {
        const qty = parseInt(document.querySelector(`.er-srv-qty[data-servicio-id="${cb.value}"]`)?.value || 1);
        const t = Number(cb.dataset.precio || 0) * qty;
        const lbl = document.querySelector(`.er-srv-total[data-servicio-id="${cb.value}"]`);
        if (lbl) lbl.textContent = cb.checked && qty > 1 ? `= $${t.toLocaleString('es-CO')}` : '';
    });
    const total = alojPrecio * noches + totalServicios;
    const el = document.getElementById('er_monto');
    if (el) el.value = `$${total.toLocaleString('es-CO')}`;
}

window.editarReserva = async (id) => {
    try {
        const [resR, resEstados, resMetodos, resHab, resCab, resPaq, resSrv] = await Promise.all([
            fetch(`/api/reservas/${id}`),
            fetch('/api/estadosreserva'),
            fetch('/api/metodopago'),
            fetch('/api/habitaciones'),
            fetch('/api/cabanas'),
            fetch('/api/paquetes'),
            fetch('/api/servicios'),
        ]);
        if (!resR.ok) throw new Error('No se pudo cargar la reserva');
        const r        = await resR.json();
        const estados  = ordenarEstados(await resEstados.json());
        const metodos  = await resMetodos.json();
        const habitaciones = (await resHab.json()).filter(h => h.Estado !== 0);
        const cabanas      = (await resCab.json()).filter(c => c.Estado !== 0);
        const paquetes     = (await resPaq.json()).filter(p => p.Estado !== 0);
        const servicios    = (await resSrv.json()).filter(s => s.Estado !== 0);

        const fmt = f => f ? new Date(f).toISOString().split('T')[0] : '';

        // Determinar tipo y alojamiento preseleccionado
        // Comprobar IDPaquete primero para no confundir con la habitación del paquete
        let tipoActual = 'habitacion';
        let idAlojActual = null;
        if (r.IDPaquete)    { tipoActual = 'paquete';    idAlojActual = r.IDPaquete;    }
        else if (r.IDCabana){ tipoActual = 'cabana';     idAlojActual = r.IDCabana;     }
        else if (r.IDHabitacion) { tipoActual = 'habitacion'; idAlojActual = r.IDHabitacion; }

        const serviciosActivos = new Map((r.servicios || []).map(s => [Number(s.IDServicio), Number(s.Cantidad || 1)]));

        // Genera <option> para el tipo de alojamiento pedido
        const renderOpciones = (tipo, selId) => {
            const cfg = {
                habitacion: { list: habitaciones, id: 'IDHabitacion', name: 'NombreHabitacion', price: 'precio' },
                cabana:     { list: cabanas,      id: 'IDCabana',     name: 'NombreCabana',     price: 'PrecioNoche' },
                paquete:    { list: paquetes,     id: 'IDPaquete',    name: 'nombre',            price: 'precio' },
            }[tipo];
            return cfg.list.map(item =>
                `<option value="${item[cfg.id]}" data-precio="${item[cfg.price]}"${item[cfg.id] == selId ? ' selected' : ''}>` +
                `${item[cfg.name]} — $${Number(item[cfg.price]).toLocaleString('es-CO')}/noche</option>`
            ).join('');
        };

        const separador = (icono, texto) =>
            `<div style="grid-column:1/-1;display:flex;align-items:center;gap:0.5rem;margin:0.55rem 0 0.1rem;padding-bottom:0.4rem;border-bottom:1.5px solid rgba(49,130,206,0.15);">
                <span style="font-size:1rem;">${icono}</span>
                <span style="font-size:0.72rem;font-weight:800;letter-spacing:0.08em;color:#2B6CB0;text-transform:uppercase;">${texto}</span>
            </div>`;

        const tipoBtns = ['habitacion','cabana','paquete'].map(t => {
            const labels = { habitacion:'🛏 Habitación', cabana:'🏕 Cabaña', paquete:'📦 Paquete' };
            const activo = t === tipoActual;
            return `<button type="button" class="er-tipo-btn${activo?' er-tipo-btn--activo':''}" data-tipo="${t}"
                        style="flex:1;padding:0.45rem 0;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;border:1.5px solid;
                               ${activo?'background:#2B6CB0;color:#fff;border-color:#2B6CB0':'background:#fff;color:#2B6CB0;border-color:rgba(43,108,176,0.3)'};">
                        ${labels[t]}</button>`;
        }).join('');

        document.getElementById('modalTitle').textContent = `✏️ Editar Reserva #${r.IdReserva}`;
        const modalContent = document.getElementById('modalContent');
        modalContent.style.maxHeight = '72vh';
        modalContent.style.overflowY = 'auto';

        modalContent.innerHTML = `
            <form id="formEditarReserva" style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;">
                <input type="hidden" id="er_tipoAloj" value="${tipoActual}">

                <!-- Fechas -->
                <div class="form-group">
                    <label>📅 FECHA CHECK-IN</label>
                    <input type="date" id="er_fechaInicio" value="${fmt(r.FechaInicio)}" class="form-input" required>
                </div>
                <div class="form-group">
                    <label>📅 FECHA CHECK-OUT</label>
                    <input type="date" id="er_fechaFin" value="${fmt(r.FechaFinalizacion)}" class="form-input" required>
                </div>

                <!-- Estado / Método -->
                <div class="form-group">
                    <label>⚙️ ESTADO RESERVA</label>
                    <select id="er_estado" class="form-input">
                        ${estados.map(e => `<option value="${e.IdEstadoReserva}"${e.IdEstadoReserva===r.IdEstadoReserva?' selected':''}>${e.NombreEstadoReserva}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>💳 MÉTODO DE PAGO</label>
                    <select id="er_metodoPago" class="form-input">
                        ${metodos.map(m => { const mid=m.IdMetodoPago||m.IDMetodoPago; return `<option value="${mid}"${mid===r.MetodoPago?' selected':''}>${m.NomMetodoPago||m.Nombre||'—'}</option>`; }).join('')}
                    </select>
                </div>

                <!-- Alojamiento -->
                ${separador('🏨','Alojamiento')}
                <div style="grid-column:1/-1;display:flex;gap:0.45rem;margin-bottom:0.35rem;">
                    ${tipoBtns}
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label id="er_aloj_label" style="font-size:0.72rem;">Selecciona una opción</label>
                    <select id="er_alojamiento" class="form-input">
                        ${renderOpciones(tipoActual, idAlojActual)}
                    </select>
                </div>

                <!-- Servicios -->
                ${separador('⭐','Servicios Adicionales')}
                <div id="er_servicios_grid" style="grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:0.45rem;">
                    ${servicios.map(s => {
                        const isChecked = serviciosActivos.has(s.IDServicio);
                        const cant = serviciosActivos.get(s.IDServicio) || 1;
                        return `
                        <div style="display:flex;flex-direction:column;gap:0.25rem;padding:0.45rem 0.65rem;border-radius:8px;border:1.5px solid rgba(49,130,206,0.15);background:#f8fbff;">
                            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.79rem;color:#1A2B4A;margin:0;">
                                <input type="checkbox" class="er-srv-check" value="${s.IDServicio}" data-precio="${s.precio}"${isChecked?' checked':''} style="width:15px;height:15px;accent-color:#2B6CB0;flex-shrink:0;" onchange="erRecalcular()">
                                <span style="flex:1;">${s.nombre}</span>
                                <span style="color:#2B6CB0;font-weight:700;white-space:nowrap;font-size:0.75rem;">$${Number(s.precio).toLocaleString('es-CO')}/p</span>
                            </label>
                            <div style="display:flex;align-items:center;gap:0.35rem;padding-left:1.4rem;">
                                <span style="font-size:0.68rem;color:rgba(26,43,74,0.5);">Cant:</span>
                                <button type="button" onclick="erAjustarCantidad('${s.IDServicio}',-1)" style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(43,108,176,0.3);background:#fff;color:#2B6CB0;cursor:pointer;font-size:0.85rem;font-weight:700;line-height:1;padding:0;">−</button>
                                <input type="number" class="er-srv-qty" data-servicio-id="${s.IDServicio}" min="1" max="20" value="${cant}" style="width:36px;text-align:center;border:1px solid rgba(43,108,176,0.25);border-radius:4px;font-size:0.78rem;padding:2px 0;color:#1A2B4A;" oninput="erRecalcular()">
                                <button type="button" onclick="erAjustarCantidad('${s.IDServicio}',1)" style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(43,108,176,0.3);background:#fff;color:#2B6CB0;cursor:pointer;font-size:0.85rem;font-weight:700;line-height:1;padding:0;">+</button>
                                <span class="er-srv-total" data-servicio-id="${s.IDServicio}" style="font-size:0.72rem;color:#2B6CB0;font-weight:700;margin-left:0.1rem;"></span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>

                <!-- Monto total -->
                ${separador('💰','Resumen')}
                <div class="form-group" style="grid-column:1/-1;">
                    <label>MONTO TOTAL ESTIMADO</label>
                    <input type="text" id="er_monto" readonly class="form-input"
                        title="Calculado automáticamente según alojamiento, noches y servicios seleccionados."
                        style="background:rgba(43,108,176,0.05);border-color:rgba(43,108,176,0.2);color:#1A2B4A;cursor:not-allowed;font-size:1.05rem;font-weight:700;letter-spacing:0.01em;">
                </div>

                <!-- Acciones -->
                <div style="grid-column:1/-1;display:flex;gap:0.75rem;justify-content:flex-end;margin-top:0.35rem;">
                    <button type="button" onclick="cerrarModal()" class="btn btn-secundario">Cancelar</button>
                    <button type="button" onclick="guardarReserva(${r.IdReserva})" class="btn btn-primario">💾 Guardar Cambios</button>
                </div>
            </form>`;

        // Recalcular monto inicial
        erRecalcular();

        // Tabs de tipo de alojamiento
        document.querySelectorAll('.er-tipo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tipo = btn.dataset.tipo;
                document.getElementById('er_tipoAloj').value = tipo;
                document.getElementById('er_alojamiento').innerHTML = renderOpciones(tipo, null);
                const lbl = { habitacion:'🛏 Habitación', cabana:'🏕 Cabaña', paquete:'📦 Paquete' };
                document.getElementById('er_aloj_label').textContent = lbl[tipo];
                document.querySelectorAll('.er-tipo-btn').forEach(b => {
                    const a = b.dataset.tipo === tipo;
                    b.style.background     = a ? '#2B6CB0' : '#fff';
                    b.style.color          = a ? '#fff'    : '#2B6CB0';
                    b.style.borderColor    = a ? '#2B6CB0' : 'rgba(43,108,176,0.3)';
                });
                erRecalcular();
            });
        });

        // Recalcular al cambiar fechas, alojamiento o servicios
        ['er_fechaInicio','er_fechaFin','er_alojamiento'].forEach(elId =>
            document.getElementById(elId)?.addEventListener('change', erRecalcular)
        );
        // los checkboxes ya tienen onchange="erRecalcular()" en el HTML generado

        document.getElementById('modalOverlay').classList.add('activo');
    } catch(e) {
        console.error(e);
        mostrarNotificacion('Error al cargar datos de la reserva.', 'error');
    }
};

window.guardarReserva = async (id) => {
    const fechaInicio = document.getElementById('er_fechaInicio')?.value;
    const fechaFin    = document.getElementById('er_fechaFin')?.value;
    const idEstado    = document.getElementById('er_estado')?.value;
    const idMetodo    = document.getElementById('er_metodoPago')?.value;
    const tipoAloj    = document.getElementById('er_tipoAloj')?.value;
    const idAloj      = document.getElementById('er_alojamiento')?.value;

    const serviciosAdicionales = [...document.querySelectorAll('#er_servicios_grid .er-srv-check:checked')]
        .map(cb => ({
            IDServicio: Number(cb.value),
            Cantidad: parseInt(document.querySelector(`.er-srv-qty[data-servicio-id="${cb.value}"]`)?.value || 1)
        }));

    if (!fechaInicio || !fechaFin) {
        mostrarNotificacion('Las fechas de check-in y check-out son obligatorias.', 'warning');
        return;
    }
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
        mostrarNotificacion('La fecha de check-out debe ser posterior al check-in.', 'warning');
        return;
    }

    const payload = {
        FechaInicio:          fechaInicio,
        FechaFinalizacion:    fechaFin,
        IdEstadoReserva:      Number(idEstado),
        MetodoPago:           Number(idMetodo),
        serviciosAdicionales,
    };
    if (tipoAloj === 'habitacion') payload.IDHabitacion = Number(idAloj);
    else if (tipoAloj === 'cabana')   payload.IDCabana    = Number(idAloj);
    else if (tipoAloj === 'paquete')  payload.IDPaquete   = Number(idAloj);

    try {
        const res = await fetch(`/api/reservas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            cerrarModal();
            cargarReservas(reservasCurrentPage);
            mostrarNotificacion('✅ Reserva actualizada correctamente.', 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            mostrarNotificacion(`Error: ${err.message || 'No se pudo actualizar la reserva.'}`, 'error');
        }
    } catch(e) {
        mostrarNotificacion('Error de conexión al servidor.', 'error');
    }
};

window.eliminarReserva = (id) => {
    mostrarConfirmacion(
        '¿Eliminar Reserva?',
        `¿Está seguro de que desea eliminar la reserva #${id}? Esta acción no se puede deshacer.`,
        async () => {
            try {
                const res = await fetch(`/api/reservas/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    cargarReservas(reservasCurrentPage);
                    mostrarNotificacion('Reserva eliminada correctamente.', 'success');
                } else {
                    const err = await res.json().catch(() => ({}));
                    mostrarNotificacion(`No se pudo eliminar: ${err.message || ''}`, 'error');
                }
            } catch(e) {
                mostrarNotificacion('Error de conexión al servidor.', 'error');
            }
        }
    );
};

// ===== HABITACIONES =====
async function cargarHabitaciones() {
    const container = document.getElementById('habitacionesGrid');
    if (!container) return;
    if (!container.innerHTML.trim()) {
        container.innerHTML = '<p style="color:rgba(26,43,74,0.5);">Cargando habitaciones...</p>';
    }

    try {
        const response = await fetch('/api/habitaciones');
        const habitaciones = await response.json();

        // Filtrado por búsqueda
        const search = (searchInput?.value || '').toLowerCase();
        const filtered = habitaciones.filter(h => 
            (h.NombreHabitacion || '').toLowerCase().includes(search) || 
            (h.Descripcion || '').toLowerCase().includes(search)
        );

        if (!filtered.length) {
            container.innerHTML = '<p style="color:rgba(26,43,74,0.5);">No hay habitaciones registradas.</p>';
            renderPaginacionAdmin(0, itemsPorPaginaHabitaciones, paginaActualHabitaciones, 'paginacion-habitaciones-admin', (nuevaPagina) => {
                paginaActualHabitaciones = nuevaPagina;
                cargarHabitaciones();
            });
            return;
        }

        // Paginación
        const total = filtered.length;
        const totalPaginas = Math.ceil(total / itemsPorPaginaHabitaciones);
        if (paginaActualHabitaciones > totalPaginas && totalPaginas > 0) {
            paginaActualHabitaciones = totalPaginas;
        }
        
        const inicio = (paginaActualHabitaciones - 1) * itemsPorPaginaHabitaciones;
        const fin = inicio + itemsPorPaginaHabitaciones;
        const itemsPaginados = filtered.slice(inicio, fin);

        container.innerHTML = itemsPaginados.map(h => {
            const estado      = h.Estado === 1 ? 'Disponible' : 'Mantenimiento';
            const estadoClass = h.Estado === 1 ? 'status-disponible' : 'status-mantenimiento';
            const precio      = h.precio || h.Precio ? `$${Number(h.precio || h.Precio).toLocaleString('es-CO')}` : '$0';
            const imgUrl      = h.imagen || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80';
            return `
                <article class="room-card">
                    <img src="${imgUrl}"
                         alt="${h.NombreHabitacion || 'Habitación'}" />
                    <div class="room-card-body">
                        <div>
                            <h3>${h.NombreHabitacion || 'Habitación'}</h3>
                            <p>${h.Descripcion || 'Descripción breve de la habitación.'}</p>
                        </div>
                        <div class="room-info" style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                            <span class="room-price">${precio}</span>
                        </div>
                        <div class="card__acciones" style="display:flex; justify-content: space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(49,130,206,0.12);">
                            <span class="badge-status ${estadoClass}">${estado}</span>
                            <div style="display:flex; gap:8px;">
                                <button onclick="toggleEstadoHabitacion(${h.IDHabitacion}, ${h.Estado})" class="btn-icon-admin" title="Cambiar Estado">
                                    <i data-lucide="refresh-cw" style="width:16px;"></i>
                                </button>
                                <button onclick="verDetalleHabitacion(${h.IDHabitacion})" class="btn-icon-admin btn-view" title="Ver Detalle">
                                    <i data-lucide="eye" style="width:16px;"></i>
                                </button>
                                <button onclick="editarHabitacion(${h.IDHabitacion})" class="btn-icon-admin btn-edit" title="Editar">
                                    <i data-lucide="edit-2" style="width:16px;"></i>
                                </button>
                                <button onclick="eliminarHabitacion(${h.IDHabitacion})" class="btn-icon-admin btn-delete" title="Eliminar">
                                    <i data-lucide="trash-2" style="width:16px;"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </article>`;
        }).join('');

        renderPaginacionAdmin(total, itemsPorPaginaHabitaciones, paginaActualHabitaciones, 'paginacion-habitaciones-admin', (nuevaPagina) => {
            paginaActualHabitaciones = nuevaPagina;
            cargarHabitaciones();
        });

        if (window.lucide) lucide.createIcons({ parent: container });
    } catch (error) {
        container.innerHTML = '<p style="color:#ef4444;">Error al cargar habitaciones.</p>';
        console.error('Error cargando habitaciones:', error);
    }
}

// ===== USUARIOS =====
async function cargarUsuarios() {
    const list = document.getElementById('usuariosList');
    if (!list.innerHTML.trim()) {
        list.innerHTML = '<p style="color:rgba(26,43,74,0.5); padding:2rem;">Cargando usuarios...</p>';
    }

    try {
        const response = await fetch('/api/usuarios');
        const usuarios = await response.json();

        list.innerHTML = `
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>País</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usuarios.map(u => {
                            const isActive = u.Estado === 1 || u.Estado === undefined; // Fallback si no tiene estado
                            const statusIcon = isActive ? 'check-circle-2' : 'x-circle';
                            const statusClass = isActive ? 'btn-status-active' : 'btn-status-inactive';
                            const statusTitle = isActive ? 'Desactivar' : 'Activar';

                            return `
                            <tr>
                                <td><span style="color:var(--color-acento);font-weight:600;">${u.IDUsuario}</span></td>
                                <td style="color:#1A2B4A;font-weight:500;">${u.NombreUsuario}</td>
                                <td>${u.Apellido || '-'}</td>
                                <td>${u.Email}</td>
                                <td>${u.Telefono || '-'}</td>
                                <td>${u.Pais || '-'}</td>
                                <td>
                                    <span class="badge ${u.IDRol === 2 ? 'badge-completada' : 'badge-confirmada'}">
                                        ${u.IDRol === 2 ? 'Admin' : 'Cliente'}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge ${isActive ? 'badge-confirmada' : 'badge-cancelada'}">
                                        ${isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <div style="display:flex; gap:8px;">
                                        <button onclick="toggleEstadoUsuario('${u.IDUsuario}', ${u.Estado || 1})" class="btn-icon-admin ${statusClass}" title="${statusTitle}">
                                            <i data-lucide="${statusIcon}" style="width:16px;"></i>
                                        </button>
                                        <button onclick="verDetalleUsuario('${u.IDUsuario}')" class="btn-icon-admin btn-view" title="Ver Detalle">
                                            <i data-lucide="eye" style="width:16px;"></i>
                                        </button>
                                        <button onclick="editarUsuario('${u.IDUsuario}')" class="btn-icon-admin btn-edit" title="Editar">
                                            <i data-lucide="edit-2" style="width:16px;"></i>
                                        </button>
                                        <button onclick="eliminarUsuario('${u.IDUsuario}')" class="btn-icon-admin btn-delete" title="Eliminar">
                                            <i data-lucide="trash-2" style="width:16px;"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
        if (window.lucide) lucide.createIcons({ parent: list });
    } catch (error) {
        list.innerHTML = '<p style="color:#ef4444; padding:2rem;">Error al cargar usuarios.</p>';
        console.error('Error cargando usuarios:', error);
    }
}

// ===== CLIENTES =====
async function cargarClientes() {
    const list = document.getElementById('clientesList');
    if (!list.innerHTML.trim()) {
        list.innerHTML = '<p style="color:rgba(26,43,74,0.5); padding:2rem;">Cargando clientes...</p>';
    }

    try {
        const search = searchInput?.value || '';
        const response = await fetch(`/api/clientes?page=${paginaActualClientes}&limit=${itemsPorPaginaClientes}&search=${encodeURIComponent(search)}`);
        const resJson = await response.json();
        
        // El backend devuelve { data, total, page, totalPages } o un array si no hay parámetros
        const clientes = resJson.data || resJson;
        const total = resJson.total || clientes.length;
        
        window.clientesData = clientes;

        list.innerHTML = `
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Documento</th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientes.map(c => {
                            const isActive = c.Estado === 1;
                            const statusIcon = isActive ? 'check-circle-2' : 'x-circle';
                            const statusClass = isActive ? 'btn-status-active' : 'btn-status-inactive';
                            const statusTitle = isActive ? 'Desactivar' : 'Activar';
                            const email = c.Correo || c.Email || '-';

                            return `
                            <tr>
                                <td><span style="color:var(--color-acento);font-weight:600;">${c.NroDocumento}</span></td>
                                <td style="color:#1A2B4A;font-weight:500;">${c.Nombre}</td>
                                <td>${c.Apellido || '-'}</td>
                                <td>${email}</td>
                                <td>${c.Telefono || '-'}</td>
                                <td>
                                    <span class="badge ${isActive ? 'badge-confirmada' : 'badge-cancelada'}">
                                        ${isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <div style="display:flex; gap:8px;">
                                        <button onclick="toggleEstadoCliente('${c.IDCliente}', ${c.Estado})" class="btn-icon-admin ${statusClass}" title="${statusTitle}">
                                            <i data-lucide="${statusIcon}" style="width:16px;"></i>
                                        </button>
                                        <button onclick="verDetalleCliente('${c.IDCliente}')" class="btn-icon-admin btn-view" title="Ver Detalle">
                                            <i data-lucide="eye" style="width:16px;"></i>
                                        </button>
                                        <button onclick="editarCliente('${c.IDCliente}')" class="btn-icon-admin btn-edit" title="Editar">
                                            <i data-lucide="edit-2" style="width:16px;"></i>
                                        </button>
                                        <button onclick="eliminarCliente('${c.IDCliente}')" class="btn-icon-admin btn-delete" title="Eliminar">
                                            <i data-lucide="trash-2" style="width:16px;"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div id="paginacion-clientes-admin" class="admin-pagination"></div>`;
        
        renderPaginacionAdmin(total, itemsPorPaginaClientes, paginaActualClientes, 'paginacion-clientes-admin', (nuevaPagina) => {
            paginaActualClientes = nuevaPagina;
            cargarClientes();
        });

        if (window.lucide) lucide.createIcons({ parent: list });
    } catch (error) {
        list.innerHTML = '<p style="color:#ef4444; padding:2rem;">Error al cargar clientes.</p>';
        console.error('Error cargando clientes:', error);
    }
}

window.paginationCallbacks = window.paginationCallbacks || {};

function renderPaginacionAdmin(total, limit, actual, containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const totalPaginas = Math.ceil(total / limit);
    if (totalPaginas <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <div class="pagination-info">Mostrando página ${actual} de ${totalPaginas} (${total} registros)</div>
        <div class="pagination-buttons">
            <button class="btn-pag" ${actual === 1 ? 'disabled' : ''} onclick="window.cambiarPaginaAdmin('${containerId}', ${actual - 1})">
                <i data-lucide="chevron-left"></i> Anterior
            </button>`;

    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= actual - 1 && i <= actual + 1)) {
            html += `<button class="btn-pag ${i === actual ? 'active' : ''}" onclick="window.cambiarPaginaAdmin('${containerId}', ${i})">${i}</button>`;
        } else if (i === actual - 2 || i === actual + 2) {
            html += `<span class="pagination-dots">...</span>`;
        }
    }

    html += `
            <button class="btn-pag" ${actual === totalPaginas ? 'disabled' : ''} onclick="window.cambiarPaginaAdmin('${containerId}', ${actual + 1})">
                Siguiente <i data-lucide="chevron-right"></i>
            </button>
        </div>`;

    container.innerHTML = html;
    
    // Guardar el callback para este contenedor
    window.paginationCallbacks[containerId] = callback;

    window.cambiarPaginaAdmin = (id, pag) => {
        if (window.paginationCallbacks[id]) {
            window.paginationCallbacks[id](pag);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (window.lucide) lucide.createIcons({ parent: container });
}

// ===== CABAÑAS =====
async function cargarCabanas() {
    const container = document.getElementById('cabanasGrid');
    if (!container) return;
    if (!container.innerHTML.trim()) {
        container.innerHTML = '<p style="color:rgba(26,43,74,0.5);">Cargando cabañas...</p>';
    }

    try {
        const response = await fetch('/api/cabanas');
        const cabanas = await response.json();

        // Filtrado por búsqueda
        const search = (searchInput?.value || '').toLowerCase();
        const filtered = cabanas.filter(c => 
            (c.NombreCabana || '').toLowerCase().includes(search) || 
            (c.Descripcion || '').toLowerCase().includes(search)
        );

        if (!filtered.length) {
            container.innerHTML = '<p style="color:rgba(26,43,74,0.5);">No hay cabañas registradas.</p>';
            renderPaginacionAdmin(0, itemsPorPaginaCabanas, paginaActualCabanas, 'paginacion-cabanas-admin', (nuevaPagina) => {
                paginaActualCabanas = nuevaPagina;
                cargarCabanas();
            });
            return;
        }

        // Paginación
        const total = filtered.length;
        const totalPaginas = Math.ceil(total / itemsPorPaginaCabanas);
        if (paginaActualCabanas > totalPaginas && totalPaginas > 0) {
            paginaActualCabanas = totalPaginas;
        }
        
        const inicio = (paginaActualCabanas - 1) * itemsPorPaginaCabanas;
        const fin = inicio + itemsPorPaginaCabanas;
        const itemsPaginados = filtered.slice(inicio, fin);

        container.innerHTML = itemsPaginados.map(c => {
            const estado      = Number(c.Estado) === 1 ? 'Activa' : 'Inactiva';
            const estadoClass = Number(c.Estado) === 1 ? 'status-disponible' : 'status-mantenimiento';
            const precio      = `$${Number(c.PrecioNoche || 0).toLocaleString('es-CO')}`;
            const imgUrl      = c.ImagenCabana || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000';
            return `
                <article class="room-card">
                    <img src="${imgUrl}"
                         alt="${c.NombreCabana || 'Cabaña'}" />
                    <div class="room-card-body">
                        <div>
                            <h3>${c.NombreCabana || 'Cabaña'}</h3>
                            <p>${c.Descripcion || 'Descripción breve de la cabaña.'}</p>
                            <div style="font-size: 0.8rem; color: rgba(26,43,74,0.5); margin-top: 0.5rem; display: flex; flex-direction: column; gap: 4px;">
                                <span>👥 Capacidad: ${c.CapacidadPersonas || 0} pers.</span>
                                <span>🚪 Habitaciones: ${c.NumeroHabitaciones || 0}</span>
                            </div>
                        </div>
                        <div class="room-info" style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                            <span class="room-price">${precio}</span>
                        </div>
                        <div class="card__acciones" style="display:flex; justify-content: space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(49,130,206,0.12);">
                            <span class="badge-status ${estadoClass}">${estado}</span>
                            <div style="display:flex; gap:8px;">
                                <button onclick="toggleEstadoCabana(${c.IDCabana}, ${c.Estado || 0})" class="btn-icon-admin" title="Cambiar Estado">
                                    <i data-lucide="refresh-cw" style="width:16px;"></i>
                                </button>
                                <button onclick="mostrarDetallesCabana(${c.IDCabana})" class="btn-icon-admin btn-view" title="Ver Detalle">
                                    <i data-lucide="eye" style="width:16px;"></i>
                                </button>
                                <button onclick="editarCabana(${c.IDCabana})" class="btn-icon-admin btn-edit" title="Editar">
                                    <i data-lucide="edit-2" style="width:16px;"></i>
                                </button>
                                <button onclick="eliminarCabana(${c.IDCabana})" class="btn-icon-admin btn-delete" title="Eliminar">
                                    <i data-lucide="trash-2" style="width:16px;"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </article>`;
        }).join('');

        renderPaginacionAdmin(total, itemsPorPaginaCabanas, paginaActualCabanas, 'paginacion-cabanas-admin', (nuevaPagina) => {
            paginaActualCabanas = nuevaPagina;
            cargarCabanas();
        });

        if (window.lucide) lucide.createIcons({ parent: container });
    } catch (error) {
        container.innerHTML = '<p style="color:#ef4444;">Error al cargar cabañas.</p>';
        console.error('Error cargando cabañas:', error);
    }
}

// —— Helpers de Estado ——————————————————————————————————————————————————
function etiquetaEstadoCabana(estado) {
    return Number(estado) === 1 
        ? { texto: 'Activa', clase: 'badge-confirmada' }
        : { texto: 'Inactiva', clase: 'badge-cancelada' };
}

function siguienteEstado(actual) {
    return Number(actual) === 1 ? 0 : 1;
}

// —— Handlers de Modales —————————————————————————————————————————————————
window.cerrarModal = () => document.getElementById('modalOverlay').classList.remove('activo');
window.cerrarDetalle = () => document.getElementById('detalleModalOverlay').classList.remove('activo');
window.cerrarConfirmacion = () => document.getElementById('confirmModalOverlay').classList.remove('activo');

window.mostrarConfirmacion = (titulo, mensaje, onConfirm) => {
    document.getElementById('confirmTitle').textContent = titulo;
    document.getElementById('confirmMessage').textContent = mensaje;
    const okBtn = document.getElementById('confirmOkBtn');
    
    // Clonar el botón para eliminar listeners anteriores
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    
    newOkBtn.addEventListener('click', () => {
        onConfirm();
        cerrarConfirmacion();
    });
    
    document.getElementById('confirmModalOverlay').classList.add('activo');
    if (window.lucide) lucide.createIcons({ parent: document.getElementById('confirmModalOverlay') });
};

window.mostrarNotificacion = (mensaje, tipo = 'info', titulo = '') => {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    
    let icon = 'info';
    if (tipo === 'success') icon = 'check-circle';
    if (tipo === 'error') icon = 'alert-circle';
    if (tipo === 'warning') icon = 'alert-triangle';
    
    if (!titulo) {
        if (tipo === 'success') titulo = '¡Éxito!';
        if (tipo === 'error') titulo = 'Error';
        if (tipo === 'warning') titulo = 'Atención';
        if (tipo === 'info') titulo = 'Información';
    }

    toast.innerHTML = `
        <div class="toast__icon">
            <i data-lucide="${icon}"></i>
        </div>
        <div class="toast__content">
            <span class="toast__title">${titulo}</span>
            <span class="toast__message">${mensaje}</span>
        </div>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ parent: toast });

    // Auto eliminar después de 5 segundos
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
};

// —— Acciones de Clientes ————————————————————————————————————————————————
window.editarCliente = async (id) => {
    try {
        const res = await fetch(`/api/clientes/${id}`);
        const data = await res.json();
        document.getElementById('modalTitle').textContent = 'Editar Cliente';
        document.getElementById('modalContent').innerHTML = renderForm('clientes', data);
        document.getElementById('modalOverlay').classList.add('activo');
    } catch (e) { mostrarNotificacion('Error al cargar datos del cliente.', 'error'); }
};

window.toggleEstadoCliente = async (id, actual) => {
    const nuevo = actual === 1 ? 0 : 1;
    try {
        const res = await fetch(`/api/clientes/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Estado: nuevo })
        });
        if (res.ok) {
            cargarClientes();
            mostrarNotificacion(`Cliente ${nuevo === 1 ? 'activado' : 'desactivado'} con éxito.`, 'success');
        }
        else mostrarNotificacion('Error al cambiar el estado del cliente.', 'error');
    } catch (e) { mostrarNotificacion('Error de conexión al servidor.', 'error'); }
};

window.eliminarCliente = async (id) => {
    mostrarConfirmacion(
        '¿Eliminar Cliente?',
        '¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.',
        async () => {
            try {
                const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    cargarClientes();
                    mostrarNotificacion('Cliente eliminado correctamente.', 'success');
                } else {
                    mostrarNotificacion('No se pudo eliminar el cliente.', 'error');
                }
            } catch (e) {
                mostrarNotificacion('Error de conexión al servidor.', 'error');
            }
        }
    );
};

window.verDetalleCliente = (id) => {
    try {
        let c = (window.clientesData || []).find(item => 
            String(item.NroDocumento) === String(id) || 
            String(item.IDCliente) === String(id) ||
            String(item.id) === String(id)
        );

        if (!c) {
            mostrarNotificacion('No se encontraron datos para este cliente en la memoria local.', 'warning');
            return;
        }

        const email     = c.Email || c.email || c.Correo || c.correo || '-';
        const nombre    = c.Nombre || '-';
        const apellido  = c.Apellido || '';
        const idCli     = c.IDCliente || '-';
        const documento = c.NroDocumento || id;
        const telefono  = c.Telefono || '-';
        const direccion = c.Direccion || '-';
        const idRol     = c.IDRol;
        const estadoVal = c.Estado !== undefined ? c.Estado : 1;
        const estadoTxt = estadoVal == 1 ? 'Activo' : 'Inactivo';
        const badgeClass = estadoVal == 1 ? 'badge-confirmada' : 'badge-cancelada';
        
        document.getElementById('detalleTitulo').textContent = 'Detalle del Cliente';
        document.getElementById('detalleContent').innerHTML = `
            <div class="det-layout det-layout--persona">
                <div class="det-header">
                    <div class="det-avatar"><i data-lucide="user"></i></div>
                    <div class="det-header-info">
                        <h3>${nombre} ${apellido}</h3>
                        <p>ID Cliente: <strong>${idCli}</strong> &bull; Doc: <strong>${documento}</strong></p>
                    </div>
                    <span class="det-badge ${badgeClass}">${estadoTxt}</span>
                </div>
                <div class="det-grid det-grid--2">
                    <div class="det-card det-card--full">
                        <i data-lucide="mail"></i>
                        <p class="det-card__label">EMAIL</p>
                        <span class="det-card__value det-card__value--break">${email}</span>
                    </div>
                    <div class="det-card">
                        <i data-lucide="phone"></i>
                        <p class="det-card__label">TELÉFONO</p>
                        <span class="det-card__value">${telefono}</span>
                    </div>
                    <div class="det-card">
                        <i data-lucide="shield"></i>
                        <p class="det-card__label">ROL</p>
                        <span class="det-card__value">${idRol == 2 ? 'Administrador' : 'Cliente'}</span>
                    </div>
                    <div class="det-card det-card--full">
                        <i data-lucide="map-pin"></i>
                        <p class="det-card__label">DIRECCIÓN</p>
                        <span class="det-card__value det-card__value--break">${direccion}</span>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons({ parent: document.getElementById('detalleContent') });
        document.getElementById('detalleModalOverlay').classList.add('activo');
    } catch (e) { 
        console.error('Error:', e);
        mostrarNotificacion('Error al mostrar los detalles del cliente.', 'error'); 
    }
};

window.verDetalleHabitacion = async (id) => {
    try {
        const res = await fetch(`/api/habitaciones/${id}`);
        const h = await res.json();
        
        const imgUrl = h.imagen || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80';
        const estado = h.Estado === 1 ? 'Disponible' : 'Mantenimiento';
        const estadoClass = h.Estado === 1 ? 'det-badge--ok' : 'det-badge--warn';

        document.getElementById('detalleTitulo').textContent = 'Ficha de Habitación';
        document.getElementById('detalleContent').innerHTML = `
            <div class="det-layout det-layout--media">
                <div class="det-media-col">
                    <div class="det-media-wrap">
                        <img src="${imgUrl}" alt="${h.NombreHabitacion || 'Habitación'}" loading="lazy">
                        <div class="det-media-label">${h.NombreHabitacion || 'Habitación'}</div>
                    </div>
                </div>
                <div class="det-info-col">
                    <p class="det-desc">${h.Descripcion || 'Sin descripción disponible.'}</p>
                    <div class="det-grid det-grid--4">
                        <div class="det-card">
                            <i data-lucide="dollar-sign"></i>
                            <p class="det-card__label">PRECIO POR NOCHE</p>
                            <span class="det-card__value det-card__value--highlight">$${Number(h.precio || h.Precio || 0).toLocaleString('es-CO')}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="users"></i>
                            <p class="det-card__label">CAPACIDAD</p>
                            <span class="det-card__value">${h.CapacidadPersonas || '—'} pers.</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="check-circle-2"></i>
                            <p class="det-card__label">ESTADO</p>
                            <span class="det-badge ${estadoClass}">${estado}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="hash"></i>
                            <p class="det-card__label">ID HABITACIÓN</p>
                            <span class="det-card__value">#${h.IDHabitacion || id}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons({ parent: document.getElementById('detalleContent') });
        document.getElementById('detalleModalOverlay').classList.add('activo');
    } catch (e) {
        console.error('Error:', e);
        mostrarNotificacion('Error al cargar detalles de la habitación.', 'error');
    }
};

window.verDetallePaquete = async (id) => {
    try {
        const res = await fetch(`/api/paquetes/${id}`);
        const p = await res.json();
        
        const imgUrl = p.imagen || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=900&q=80';
        const estado = p.Estado === 1 ? 'Activo' : 'Inactivo';
        const estadoClass = p.Estado === 1 ? 'det-badge--ok' : 'det-badge--warn';
        const nombre = p.NombrePaquete || p.nombre || 'Paquete';
        const alojNombre = p.NombreHabitacion || p.NombreCabana || '—';
        const alojLabel = p.NombreCabana && !p.NombreHabitacion ? 'CABAÑA' : 'HABITACIÓN';
        const alojIcon = p.NombreCabana && !p.NombreHabitacion ? 'home' : 'hotel';

        document.getElementById('detalleTitulo').textContent = 'Ficha de Paquete';
        document.getElementById('detalleContent').innerHTML = `
            <div class="det-layout det-layout--media">
                <div class="det-media-col">
                    <div class="det-media-wrap">
                        <img src="${imgUrl}" alt="${nombre}" loading="lazy">
                        <div class="det-media-label">${nombre}</div>
                    </div>
                </div>
                <div class="det-info-col">
                    <p class="det-desc">${p.Descripcion || p.descripcion || 'Sin descripción disponible.'}</p>
                    <div class="det-grid det-grid--4">
                        <div class="det-card">
                            <i data-lucide="dollar-sign"></i>
                            <p class="det-card__label">PRECIO</p>
                            <span class="det-card__value det-card__value--highlight">$${Number(p.precio || p.Precio || 0).toLocaleString('es-CO')}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="check-circle-2"></i>
                            <p class="det-card__label">ESTADO</p>
                            <span class="det-badge ${estadoClass}">${estado}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="${alojIcon}"></i>
                            <p class="det-card__label">${alojLabel}</p>
                            <span class="det-card__value det-card__value--break">${alojNombre}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="smile"></i>
                            <p class="det-card__label">SERVICIO</p>
                            <span class="det-card__value det-card__value--break">${p.NombreServicio || '—'}</span>
                        </div>
                    </div>
                    <div class="det-grid det-grid--2">
                        ${p.Descuento ? `<div class="det-card"><i data-lucide="tag"></i><p class="det-card__label">DESCUENTO</p><span class="det-card__value">${p.Descuento}%</span></div>` : ''}
                        <div class="det-card${p.Descuento ? '' : ' det-card--full'}">
                            <i data-lucide="hash"></i>
                            <p class="det-card__label">ID PAQUETE</p>
                            <span class="det-card__value">#${p.IDPaquete || p.idPaquete || id}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons({ parent: document.getElementById('detalleContent') });
        document.getElementById('detalleModalOverlay').classList.add('activo');
    } catch (e) {
        console.error('Error:', e);
        mostrarNotificacion('Error al cargar detalles del paquete.', 'error');
    }
};

window.verDetalleServicio = async (id) => {
    try {
        const res = await fetch(`/api/servicios/${id}`);
        const s = await res.json();
        
        const imgUrl = s.imagen || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80';
        const estado = s.Estado === 1 ? 'Activo' : 'Inactivo';
        const estadoClass = s.Estado === 1 ? 'det-badge--ok' : 'det-badge--warn';
        const nombre = s.NombreServicio || s.nombre || 'Servicio';

        document.getElementById('detalleTitulo').textContent = 'Ficha de Servicio';
        document.getElementById('detalleContent').innerHTML = `
            <div class="det-layout det-layout--media">
                <div class="det-media-col">
                    <div class="det-media-wrap">
                        <img src="${imgUrl}" alt="${nombre}" loading="lazy">
                        <div class="det-media-label">${nombre}</div>
                    </div>
                </div>
                <div class="det-info-col">
                    <p class="det-desc">${s.Descripcion || s.descripcion || 'Sin descripción disponible.'}</p>
                    <div class="det-grid det-grid--4">
                        <div class="det-card">
                            <i data-lucide="dollar-sign"></i>
                            <p class="det-card__label">PRECIO</p>
                            <span class="det-card__value det-card__value--highlight">$${Number(s.precio || s.Costo || 0).toLocaleString('es-CO')}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="check-circle-2"></i>
                            <p class="det-card__label">ESTADO</p>
                            <span class="det-badge ${estadoClass}">${estado}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="clock"></i>
                            <p class="det-card__label">DURACIÓN</p>
                            <span class="det-card__value">${s.Duracion || s.duracion || '—'}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="users"></i>
                            <p class="det-card__label">MÁX. PERSONAS</p>
                            <span class="det-card__value">${s.CantidadMaximaPersonas || '—'}</span>
                        </div>
                    </div>
                    <div class="det-grid det-grid--2">
                        <div class="det-card det-card--full">
                            <i data-lucide="hash"></i>
                            <p class="det-card__label">ID SERVICIO</p>
                            <span class="det-card__value">#${s.IDServicio || s.idServicio || id}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons({ parent: document.getElementById('detalleContent') });
        document.getElementById('detalleModalOverlay').classList.add('activo');
    } catch (e) {
        console.error('Error:', e);
        mostrarNotificacion('Error al cargar detalles del servicio.', 'error');
    }
};

// —— Acciones de Cabañas —————————————————————————————————————————————————
window.mostrarDetallesCabana = async (id) => {
    try {
        const res = await fetch(`/api/cabanas/${id}`);
        let c = await res.json();
        
        if (Array.isArray(c)) c = c[0];
        if (c.data) c = c.data;

        const { texto, clase } = etiquetaEstadoCabana(c.Estado || c.estado);
        const estadoClass = Number(c.Estado || c.estado) === 1 ? 'det-badge--ok' : 'det-badge--warn';
        const imgUrl = c.ImagenCabana || c.imagenCabana || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000';
        const nombre = c.NombreCabana || c.nombreCabana || 'Cabaña';

        document.getElementById('detalleTitulo').textContent = 'Ficha de Cabaña';
        document.getElementById('detalleContent').innerHTML = `
            <div class="det-layout det-layout--media">
                <div class="det-media-col">
                    <div class="det-media-wrap">
                        <img src="${imgUrl}" alt="${nombre}" loading="lazy">
                        <div class="det-media-label">${nombre}</div>
                    </div>
                </div>
                <div class="det-info-col">
                    <p class="det-desc">${c.Descripcion || c.descripcion || 'Sin descripción detallada disponible.'}</p>
                    <div class="det-grid det-grid--4">
                        <div class="det-card">
                            <i data-lucide="users"></i>
                            <p class="det-card__label">CAPACIDAD</p>
                            <span class="det-card__value">${c.CapacidadPersonas || c.capacidadPersonas || '—'} personas</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="dollar-sign"></i>
                            <p class="det-card__label">PRECIO NOCHE</p>
                            <span class="det-card__value det-card__value--highlight">$${Number(c.PrecioNoche || c.precioNoche || 0).toLocaleString('es-CO')}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="door-open"></i>
                            <p class="det-card__label">HABITACIONES</p>
                            <span class="det-card__value">${c.NumeroHabitaciones || c.numeroHabitaciones || '—'}</span>
                        </div>
                        <div class="det-card">
                            <i data-lucide="check-circle-2"></i>
                            <p class="det-card__label">ESTADO</p>
                            <span class="det-badge ${estadoClass}">${texto}</span>
                        </div>
                    </div>
                    <div class="det-grid det-grid--2">
                        <div class="det-card det-card--full">
                            <i data-lucide="hash"></i>
                            <p class="det-card__label">ID CABAÑA</p>
                            <span class="det-card__value">#${c.IDCabana || c.idCabana || id}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons({ parent: document.getElementById('detalleContent') });
        document.getElementById('detalleModalOverlay').classList.add('activo');
    } catch (e) { 
        console.error('Error:', e);
        mostrarNotificacion('Error al cargar detalles de la cabaña.', 'error'); 
    }
};

window.toggleEstadoCabana = async (id, actual) => {
    const nuevo = siguienteEstado(actual);
    try {
        const res = await fetch(`/api/cabanas/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Estado: nuevo })
        });
        if (res.ok) {
            cargarCabanas();
            mostrarNotificacion('Estado de la cabaña actualizado correctamente.', 'success');
        } else {
            mostrarNotificacion('Error al cambiar el estado de la cabaña.', 'error');
        }
    } catch (e) { mostrarNotificacion('Error de conexión al servidor.', 'error'); }
};

window.editarCabana = async (id) => {
    try {
        const res = await fetch(`/api/cabanas/${id}`);
        const data = await res.json();
        document.getElementById('modalTitle').textContent = '✏️ Editar Cabaña';
        document.getElementById('modalContent').innerHTML = renderForm('cabanas', data);
        document.getElementById('modalOverlay').classList.add('activo');
    } catch (e) { mostrarNotificacion('Error al cargar datos de la cabaña.', 'error'); }
};

window.eliminarCabana = async (id) => {
    mostrarConfirmacion(
        '¿Eliminar Cabaña?',
        '¿Está seguro de que desea eliminar esta cabaña? Esta acción no se puede deshacer.',
        async () => {
            try {
                const res = await fetch(`/api/cabanas/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    cargarCabanas();
                    mostrarNotificacion('Cabaña eliminada correctamente.', 'success');
                } else {
                    mostrarNotificacion('No se pudo eliminar la cabaña.', 'error');
                }
            } catch (e) {
                mostrarNotificacion('Error de conexión al servidor.', 'error');
            }
        }
    );
};


// ===== PAQUETES =====
async function cargarPaquetes() {
    const list = document.getElementById('paquetesList');
    if (!list.innerHTML.trim()) {
        list.innerHTML = '<p style="color:rgba(26,43,74,0.5); padding:2rem;">Cargando paquetes...</p>';
    }

    try {
        const response = await fetch('/api/paquetes');
        const paquetes = await response.json();

        // Filtrado por búsqueda
        const search = (searchInput?.value || '').toLowerCase();
        const filtered = paquetes.filter(p => 
            (p.NombrePaquete || p.nombre || '').toLowerCase().includes(search) ||
            (p.Descripcion || '').toLowerCase().includes(search)
        );

        if (!filtered.length) {
            list.innerHTML = '<p style="color:rgba(26,43,74,0.5);">No hay paquetes registrados.</p>';
            renderPaginacionAdmin(0, itemsPorPaginaPaquetes, paginaActualPaquetes, 'paginacion-paquetes-admin', (nuevaPagina) => {
                paginaActualPaquetes = nuevaPagina;
                cargarPaquetes();
            });
            return;
        }

        // Paginación
        const total = filtered.length;
        const totalPaginas = Math.ceil(total / itemsPorPaginaPaquetes);
        if (paginaActualPaquetes > totalPaginas && totalPaginas > 0) {
            paginaActualPaquetes = totalPaginas;
        }
        
        const inicio = (paginaActualPaquetes - 1) * itemsPorPaginaPaquetes;
        const fin = inicio + itemsPorPaginaPaquetes;
        const itemsPaginados = filtered.slice(inicio, fin);

        list.innerHTML = `
            <div class="cards-grid">
                ${itemsPaginados.map(p => {
                    const estado      = p.Estado === 1 ? 'Activo' : 'Inactivo';
                    const estadoClass = p.Estado === 1 ? 'status-disponible' : 'status-mantenimiento';
                    const precio      = p.precio || p.Precio ? `$${Number(p.precio || p.Precio).toLocaleString('es-CO')}` : '$0';
                    const imgUrl      = p.imagen || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=900&q=80';
                    return `
                        <article class="room-card">
                            <img src="${imgUrl}" alt="${p.NombrePaquete || p.nombre || 'Paquete'}" />
                            <div class="room-card-body">
                                <div>
                                    <h3>${p.NombrePaquete || p.nombre || 'Paquete'}</h3>
                                    <p>${p.Descripcion || 'Sin descripción disponible.'}</p>
                                    <div style="font-size: 0.8rem; color: rgba(26,43,74,0.5); margin-top: 0.5rem; display: flex; flex-direction: column; gap: 4px;">
                                        ${p.NombreHabitacion ? `<span>🏠 Habitación: ${p.NombreHabitacion}</span>` : ''}
                                        ${p.NombreCabana ? `<span>🏕️ Cabaña: ${p.NombreCabana}</span>` : ''}
                                        <span>🛠️ Servicios: ${p.NombreServicio || '-'}</span>
                                    </div>
                                </div>
                                <div class="room-info" style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                                    <span class="room-price">${precio}</span>
                                </div>
                                <div class="card__acciones" style="display:flex; justify-content: space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(49,130,206,0.12);">
                                    <span class="badge-status ${estadoClass}">${estado}</span>
                                    <div style="display:flex; gap:8px;">
                                        <button onclick="toggleEstadoPaquete(${p.IDPaquete}, ${p.Estado})" class="btn-icon-admin" title="Cambiar Estado">
                                            <i data-lucide="refresh-cw" style="width:16px;"></i>
                                        </button>
                                        <button onclick="verDetallePaquete(${p.IDPaquete})" class="btn-icon-admin btn-view" title="Ver Detalle">
                                            <i data-lucide="eye" style="width:16px;"></i>
                                        </button>
                                        <button onclick="editarPaquete(${p.IDPaquete})" class="btn-icon-admin btn-edit" title="Editar">
                                            <i data-lucide="edit-2" style="width:16px;"></i>
                                        </button>
                                        <button onclick="eliminarPaquete(${p.IDPaquete})" class="btn-icon-admin btn-delete" title="Eliminar">
                                            <i data-lucide="trash-2" style="width:16px;"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>`;
                }).join('')}
            </div>`;

        renderPaginacionAdmin(total, itemsPorPaginaPaquetes, paginaActualPaquetes, 'paginacion-paquetes-admin', (nuevaPagina) => {
            paginaActualPaquetes = nuevaPagina;
            cargarPaquetes();
        });

        if (window.lucide) lucide.createIcons({ parent: list });
    } catch (error) {
        list.innerHTML = '<p style="color:#ef4444; padding:2rem;">Error al cargar paquetes.</p>';
        console.error('Error cargando paquetes:', error);
    }
}

// ===== SERVICIOS =====
async function cargarServicios() {
    const list = document.getElementById('serviciosList');
    if (!list.innerHTML.trim()) {
        list.innerHTML = '<p style="color:rgba(26,43,74,0.5); padding:2rem;">Cargando servicios...</p>';
    }

    try {
        const response = await fetch('/api/servicios');
        const servicios = await response.json();

        // Filtrado por búsqueda
        const search = (searchInput?.value || '').toLowerCase();
        const filtered = servicios.filter(s => 
            (s.NombreServicio || s.nombre || '').toLowerCase().includes(search) ||
            (s.Descripcion || s.descripcion || '').toLowerCase().includes(search)
        );

        if (!filtered.length) {
            list.innerHTML = '<p style="color:rgba(26,43,74,0.5);">No hay servicios registrados.</p>';
            renderPaginacionAdmin(0, itemsPorPaginaServicios, paginaActualServicios, 'paginacion-servicios-admin', (nuevaPagina) => {
                paginaActualServicios = nuevaPagina;
                cargarServicios();
            });
            return;
        }

        // Paginación
        const total = filtered.length;
        const totalPaginas = Math.ceil(total / itemsPorPaginaServicios);
        if (paginaActualServicios > totalPaginas && totalPaginas > 0) {
            paginaActualServicios = totalPaginas;
        }
        
        const inicio = (paginaActualServicios - 1) * itemsPorPaginaServicios;
        const fin = inicio + itemsPorPaginaServicios;
        const itemsPaginados = filtered.slice(inicio, fin);

        list.innerHTML = `
            <div class="cards-grid">
                ${itemsPaginados.map(s => {
                    const estado      = s.Estado === 1 ? 'Activo' : 'Inactivo';
                    const estadoClass = s.Estado === 1 ? 'status-disponible' : 'status-mantenimiento';
                    const costo       = s.precio || s.Costo ? `$${Number(s.precio || s.Costo).toLocaleString('es-CO')}` : '$0';
                    const imgUrl      = s.imagen || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80';
                    return `
                        <article class="room-card">
                            <img src="${imgUrl}" alt="${s.NombreServicio || s.nombre || 'Servicio'}" />
                            <div class="room-card-body">
                                <div>
                                    <h3>${s.NombreServicio || s.nombre || 'Servicio'}</h3>
                                    <p>${s.Descripcion || 'Sin descripción disponible.'}</p>
                                    <div style="font-size: 0.8rem; color: rgba(26,43,74,0.5); margin-top: 0.5rem; display: flex; flex-direction: column; gap: 4px;">
                                        <span>⏱️ Duración: ${s.Duracion || '-'}</span>
                                        <span>👥 Max. Personas: ${s.CantidadMaximaPersonas || '-'}</span>
                                    </div>
                                </div>
                                <div class="room-info" style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                                    <span class="room-price">${costo}</span>
                                </div>
                                <div class="card__acciones" style="display:flex; justify-content: space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(49,130,206,0.12);">
                                    <span class="badge-status ${estadoClass}">${estado}</span>
                                    <div style="display:flex; gap:8px;">
                                        <button onclick="toggleEstadoServicio(${s.IDServicio}, ${s.Estado})" class="btn-icon-admin" title="Cambiar Estado">
                                            <i data-lucide="refresh-cw" style="width:16px;"></i>
                                        </button>
                                        <button onclick="verDetalleServicio(${s.IDServicio})" class="btn-icon-admin btn-view" title="Ver Detalle">
                                            <i data-lucide="eye" style="width:16px;"></i>
                                        </button>
                                        <button onclick="editarServicio(${s.IDServicio})" class="btn-icon-admin btn-edit" title="Editar">
                                            <i data-lucide="edit-2" style="width:16px;"></i>
                                        </button>
                                        <button onclick="eliminarServicio(${s.IDServicio})" class="btn-icon-admin btn-delete" title="Eliminar">
                                            <i data-lucide="trash-2" style="width:16px;"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>`;
                }).join('')}
            </div>`;

        renderPaginacionAdmin(total, itemsPorPaginaServicios, paginaActualServicios, 'paginacion-servicios-admin', (nuevaPagina) => {
            paginaActualServicios = nuevaPagina;
            cargarServicios();
        });

        if (window.lucide) lucide.createIcons({ parent: list });
    } catch (error) {
        list.innerHTML = '<p style="color:#ef4444; padding:2rem;">Error al cargar servicios.</p>';
        console.error('Error cargando servicios:', error);
    }
}

// ===== DASHBOARD LOGIC =====
let chartCabanas = null;
let chartClientes = null;
let chartReservas = null;
let chartPaquetes = null;
let chartServicios = null;

async function cargarDashboard() {
    // Resetear stats con animación
    ['kpi-ocupacion', 'kpi-ingresos', 'kpi-reservas', 'kpi-clientes']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent = '...'; el.classList.add('loading-num'); }
        });

    try {
        const [cabanas, paquetes, servicios, reservas, statsRes] = await Promise.all([
            cabanasAPI.getAll(),
            paquetesAPI.getAll(),
            serviciosAPI.getAll(),
            reservasAPI.getAll(),
            fetch('/api/dashboard/stats').then(r => r.ok ? r.json() : {})
        ]);

        // ── KPI 1: Tasa de Ocupación ──
        const elOcu = document.getElementById('kpi-ocupacion');
        if (elOcu) { elOcu.classList.remove('loading-num'); elOcu.textContent = (statsRes.tasaOcupacion ?? 0) + '%'; }
        const subOcu = document.getElementById('kpi-ocupacion-trend');
        if (subOcu) { subOcu.textContent = ''; }

        // ── KPI 2: Ingresos Totales (confirmados + completados) ──
        const elIng = document.getElementById('kpi-ingresos');
        const ingresos = Number(statsRes.totalIngresos || 0);
        if (elIng) { elIng.classList.remove('loading-num'); elIng.textContent = '$' + ingresos.toLocaleString('es-CO'); }
        const subIng = document.getElementById('kpi-ingresos-trend');
        if (subIng) { subIng.textContent = ''; subIng.className = 'kpi-trend'; }

        // ── KPI 3: Reservas Activas (pendientes, confirmadas, procesando) ──
        const elRes = document.getElementById('kpi-reservas');
        if (elRes) animarNumero(elRes, statsRes.reservasActivas ?? 0);
        const subRes = document.getElementById('kpi-reservas-trend');
        if (subRes) { subRes.textContent = ''; subRes.className = 'kpi-trend'; }

        // ── KPI 4: Clientes Activos ──
        const elCli = document.getElementById('kpi-clientes');
        if (elCli) animarNumero(elCli, statsRes.clientesActivos ?? 0);
        const subCli = document.getElementById('kpi-clientes-trend');
        if (subCli) { subCli.textContent = ''; subCli.className = 'kpi-trend'; }

        // Renderizar gráficas
        renderGraficaCabanas(cabanas);
        renderGraficaEstadoReservas(reservas);
        renderGraficaReservas(reservas);

        // Renderizar tablas
        renderTopPaquetesAdmin(paquetes);
        renderTopServiciosAdmin(servicios);

    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// ── Renderizar tabla Top Paquetes ─────────────────────────────────────────
function renderTopPaquetesAdmin(paquetes) {
  const contenedor = document.getElementById('tabla-top-paquetes');
  if (!contenedor) return;

  if (!paquetes || paquetes.length === 0) {
    contenedor.innerHTML = '<p class="dashboard-loading">No hay paquetes disponibles.</p>';
    return;
  }

  // Ordenar por precio descendente y tomar 5
  const top = [...paquetes].sort((a, b) => Number(b.precio || b.Precio || 0) - Number(a.precio || a.Precio || 0)).slice(0, 5);

  contenedor.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 36px; text-align: center;">#</th>
          <th>Paquete</th>
          <th>Precio</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${top.map((p, index) => {
          const nombre = p.NombrePaquete || p.nombre || '—';
          const precio = Number(p.precio || p.Precio || 0);
          const activo = p.Estado === 1 || p.Estado === '1' || p.Estado === true;
          return `
            <tr>
              <td style="text-align: center; font-weight: bold; color: rgba(26,43,74,0.5);">${index + 1}</td>
              <td>${nombre}</td>
              <td>$${precio.toLocaleString('es-CO')}</td>
              <td>
                <span class="badge ${activo ? 'badge-confirmada' : 'badge-cancelada'}">
                  ${activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Renderizar tabla Top Servicios ────────────────────────────────────────
function renderTopServiciosAdmin(servicios) {
  const contenedor = document.getElementById('tabla-top-servicios');
  if (!contenedor) return;

  if (!servicios || servicios.length === 0) {
    contenedor.innerHTML = '<p class="dashboard-loading">No hay servicios disponibles.</p>';
    return;
  }

  // Ordenar por precio descendente y tomar 5
  const top = [...servicios].sort((a, b) => Number(b.precio || b.Precio || 0) - Number(a.precio || a.Precio || 0)).slice(0, 5);
  
  contenedor.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 36px; text-align: center;">#</th>
          <th>Servicio</th>
          <th>Precio</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${top.map((s, index) => {
          const nombre = s.NombreServicio || s.nombre || '—';
          const precio = Number(s.precio || s.Precio || 0);
          const activo = s.Estado === 1 || s.Estado === '1' || s.Estado === true;
          return `
            <tr>
              <td style="text-align: center; font-weight: bold; color: rgba(26,43,74,0.5);">${index + 1}</td>
              <td>${nombre}</td>
              <td>$${precio.toLocaleString('es-CO')}</td>
              <td>
                <span class="badge ${activo ? 'badge-confirmada' : 'badge-cancelada'}">
                  ${activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function animarNumero(el, destino, duracion = 800) {
    let inicio = 0;
    const pasos = 30;
    const intervalo = duracion / pasos;
    let paso = 0;
    el.classList.remove('loading-num');
    
    const timer = setInterval(() => {
        paso++;
        const valor = Math.round(inicio + (destino - inicio) * (paso / pasos));
        el.textContent = valor;
        if (paso >= pasos) {
            clearInterval(timer);
            el.textContent = destino;
        }
    }, intervalo);
}

function renderGraficaCabanas(cabanas) {
    const ctx = document.getElementById('grafica-cabanas');
    if (!ctx) return;
    if (chartCabanas) chartCabanas.destroy();

    const activas = cabanas.filter(c => Number(c.Estado) === 1).length;
    const inactivas = cabanas.length - activas;

    const data = {
        labels: ['Activa', 'Inactiva'],
        datasets: [{
            data: [activas, inactivas],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0
        }]
    };

    chartCabanas = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'rgba(26,43,74,0.7)', padding: 20 }
                }
            },
            cutout: '70%'
        }
    });
}
let chartEstadoReservas = null;

function renderGraficaEstadoReservas(reservas) {
    const ctx = document.getElementById('grafica-estado-reservas');
    if (!ctx) return;
    if (chartEstadoReservas) chartEstadoReservas.destroy();

    let pendientes = 0;
    let confirmadas = 0;

    reservas.forEach(r => {
        const estado = (r.NombreEstadoReserva || '').toLowerCase();
        if (estado === 'pendiente') {
            pendientes++;
        } else if (estado === 'confirmada') {
            confirmadas++;
        }
    });

    chartEstadoReservas = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Confirmadas'],
            datasets: [{
                data: [pendientes, confirmadas],
                backgroundColor: ['#f59e0b', '#10b981'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'rgba(26,43,74,0.7)', font: { size: 12 } }
                }
            },
            cutout: '70%'
        }
    });
}

function renderGraficaReservas(reservas) {
    const ctx = document.getElementById('grafica-reservas');
    if (!ctx) return;
    if (chartReservas) chartReservas.destroy();

    const checkins = [0,0,0,0,0,0,0];
    const checkouts = [0,0,0,0,0,0,0];

    reservas.forEach(r => {
        if (r.FechaInicio) {
            const dIn = new Date(r.FechaInicio);
            if (!isNaN(dIn)) {
                const idx = dIn.getDay() === 0 ? 6 : dIn.getDay() - 1;
                checkins[idx]++;
            }
        }
        if (r.FechaFinalizacion) {
            const dOut = new Date(r.FechaFinalizacion);
            if (!isNaN(dOut)) {
                const idx = dOut.getDay() === 0 ? 6 : dOut.getDay() - 1;
                checkouts[idx]++;
            }
        }
    });

    chartReservas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [
                {
                    label: 'Check-ins',
                    data: checkins,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'Check-outs',
                    data: checkouts,
                    backgroundColor: '#3182CE',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(49,130,206,0.08)' }, ticks: { color: 'rgba(26,43,74,0.5)', stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: 'rgba(26,43,74,0.5)' } }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: 'rgba(26,43,74,0.7)' }
                }
            }
        }
    });
}



// ===== INICIALIZAR =====
switchSection('dashboard');
// -- Acciones de Habitaciones ---------------------------------------------
window.toggleEstadoHabitacion = async (id, actual) => {
    const nuevo = actual === 1 ? 0 : 1;
    try {
        const resGet = await fetch(`/api/habitaciones/${id}`);
        const data = await resGet.json();
        data.Estado = nuevo;
        
        const res = await fetch(`/api/habitaciones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            cargarHabitaciones();
            mostrarNotificacion(`Habitación ${nuevo === 1 ? 'disponible' : 'en mantenimiento'} con éxito.`, 'success');
        } else {
            mostrarNotificacion('Error al cambiar el estado de la habitación.', 'error');
        }
    } catch (e) { mostrarNotificacion('Error de conexión.', 'error'); }
};

window.editarHabitacion = async (id) => {
    try {
        const res = await fetch(`/api/habitaciones/${id}`);
        const data = await res.json();
        document.getElementById('modalTitle').textContent = 'Editar Habitación';
        document.getElementById('modalContent').innerHTML = renderForm('habitaciones', data);
        document.getElementById('modalOverlay').classList.add('activo');
    } catch (e) { mostrarNotificacion('Error al cargar datos de la habitación.', 'error'); }
};
window.eliminarHabitacion = async (id) => {
    mostrarConfirmacion(
        '¿Eliminar Habitación?',
        '¿Está seguro de que desea eliminar esta habitación? Esta acción no se puede deshacer.',
        async () => {
            try {
                const res = await fetch(`/api/habitaciones/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    cargarHabitaciones();
                    mostrarNotificacion('Habitación eliminada correctamente.', 'success');
                } else {
                    mostrarNotificacion('Error al eliminar habitación.', 'error');
                }
            } catch (e) {
                mostrarNotificacion('Error de conexión al servidor.', 'error');
            }
        }
    );
};

// —— Acciones de Usuarios —————————————————————————————————————————————————
window.verDetalleUsuario = async (id) => {
    try {
        const res = await fetch(`/api/usuarios/${id}`);
        const data = await res.json();
        
        const overlay = document.getElementById('detalleModalOverlay');
        const content = document.getElementById('detalleContent');
        
        const email     = data.Email || data.email || data.Correo || '-';
        const nombre    = data.NombreUsuario || data.Nombre || '-';
        const apellido  = data.Apellido || '';
        const idRol     = data.IDRol;
        const estadoVal = data.Estado !== undefined ? data.Estado : 1;
        const estadoTxt = estadoVal == 1 ? 'Activo' : 'Inactivo';
        const badgeClass = estadoVal == 1 ? 'badge-confirmada' : 'badge-cancelada';
        
        const telefono  = data.Telefono || '—';
        const pais      = data.Pais || '—';
        const direccion = data.Direccion || '—';
        const documento = `${data.TipoDocumento || ''} ${data.NumeroDocumento || ''}`.trim() || '—';

        document.getElementById('detalleTitulo').textContent = 'Detalle de Usuario';
        content.innerHTML = `
            <div class="det-layout det-layout--persona">
                <div class="det-header">
                    <div class="det-avatar"><i data-lucide="user"></i></div>
                    <div class="det-header-info">
                        <h3>${nombre} ${apellido}</h3>
                        <p>ID: <strong>${data.IDUsuario || data.idUsuario || id}</strong> &bull; Rol: <strong>${idRol === 2 ? 'Administrador' : 'Usuario General'}</strong></p>
                    </div>
                    <span class="det-badge ${badgeClass}">${estadoTxt}</span>
                </div>
                <div class="det-grid det-grid--2">
                    <div class="det-card det-card--full">
                        <i data-lucide="mail"></i>
                        <p class="det-card__label">EMAIL</p>
                        <span class="det-card__value det-card__value--break">${email}</span>
                    </div>
                    <div class="det-card">
                        <i data-lucide="phone"></i>
                        <p class="det-card__label">TELÉFONO</p>
                        <span class="det-card__value">${telefono}</span>
                    </div>
                    <div class="det-card">
                        <i data-lucide="globe"></i>
                        <p class="det-card__label">PAÍS</p>
                        <span class="det-card__value">${pais}</span>
                    </div>
                    <div class="det-card det-card--full">
                        <i data-lucide="fingerprint"></i>
                        <p class="det-card__label">DOCUMENTO</p>
                        <span class="det-card__value">${documento}</span>
                    </div>
                    <div class="det-card det-card--full">
                        <i data-lucide="map-pin"></i>
                        <p class="det-card__label">DIRECCIÓN</p>
                        <span class="det-card__value det-card__value--break">${direccion}</span>
                    </div>
                </div>
            </div>`;
            
        overlay.classList.add('activo');
        if (window.lucide) lucide.createIcons({ parent: content });
    } catch (e) { mostrarNotificacion('Error al cargar detalles del usuario.', 'error'); }
};

window.toggleEstadoUsuario = async (id, actual) => {
    const nuevo = actual === 1 ? 0 : 1;
    try {
        const res = await fetch(`/api/usuarios/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Estado: nuevo })
        });
        if (res.ok) {
            cargarUsuarios();
            mostrarNotificacion(`Usuario ${nuevo === 1 ? 'activado' : 'desactivado'} con éxito.`, 'success');
        } else {
            mostrarNotificacion('Error al cambiar el estado del usuario.', 'error');
        }
    } catch (e) { mostrarNotificacion('Error de conexión.', 'error'); }
};

window.editarUsuario = async (id) => {
    try {
        const res = await fetch(`/api/usuarios/${id}`);
        const data = await res.json();
        document.getElementById('modalTitle').textContent = 'Editar Usuario';
        document.getElementById('modalContent').innerHTML = renderForm('usuarios', data);
        document.getElementById('modalOverlay').classList.add('activo');
    } catch (e) { mostrarNotificacion('Error al cargar datos del usuario.', 'error'); }
};
window.eliminarUsuario = async (id) => {
    mostrarConfirmacion(
        '¿Eliminar Usuario?',
        '¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.',
        async () => {
            try {
                const res = await fetch('/api/usuarios/' + id, { method: 'DELETE' });
                if (res.ok) {
                    cargarUsuarios();
                    mostrarNotificacion('Usuario eliminado con éxito.', 'success');
                } else {
                    mostrarNotificacion('Error al eliminar el usuario.', 'error');
                }
            } catch (e) {
                mostrarNotificacion('Error de conexión al servidor.', 'error');
            }
        }
    );
};

// -- Acciones de Paquetes -------------------------------------------------
window.toggleEstadoPaquete = async (id, actual) => {
    const nuevo = actual === 1 ? 0 : 1;
    try {
        const resGet = await fetch(`/api/paquetes/${id}`);
        const data = await resGet.json();
        data.Estado = nuevo;
        
        const res = await fetch(`/api/paquetes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            cargarPaquetes();
            mostrarNotificacion(`Paquete ${nuevo === 1 ? 'activado' : 'desactivado'} con éxito.`, 'success');
        } else {
            mostrarNotificacion('Error al cambiar el estado del paquete.', 'error');
        }
    } catch (e) { mostrarNotificacion('Error de conexión.', 'error'); }
};

window.editarPaquete = async (id) => {
    try {
        const [resP, resH, resS, resC] = await Promise.all([
            fetch(`/api/paquetes/${id}`),
            fetch('/api/habitaciones'),
            fetch('/api/servicios'),
            fetch('/api/cabanas')
        ]);
        const data = await resP.json();
        const extra = {
            habitaciones: await resH.json(),
            servicios: await resS.json(),
            cabanas: await resC.json()
        };
        document.getElementById('modalTitle').textContent = 'Editar Paquete';
        document.getElementById('modalContent').innerHTML = renderForm('paquetes', data, extra);
        document.getElementById('modalOverlay').classList.add('activo');
    } catch (e) { mostrarNotificacion('Error al cargar datos del paquete.', 'error'); }
};
window.eliminarPaquete = async (id) => {
    mostrarConfirmacion(
        '¿Eliminar Paquete?',
        '¿Está seguro de que desea eliminar este paquete? Esta acción no se puede deshacer.',
        async () => {
            try {
                const res = await fetch('/api/paquetes/' + id, { method: 'DELETE' });
                if (res.ok) {
                    cargarPaquetes();
                    mostrarNotificacion('Paquete eliminado con éxito.', 'success');
                } else {
                    mostrarNotificacion('Error al eliminar el paquete.', 'error');
                }
            } catch (e) {
                mostrarNotificacion('Error de conexión al servidor.', 'error');
            }
        }
    );
};

// -- Acciones de Servicios ------------------------------------------------
window.toggleEstadoServicio = async (id, actual) => {
    const nuevo = actual === 1 ? 0 : 1;
    try {
        const resGet = await fetch(`/api/servicios/${id}`);
        const data = await resGet.json();
        data.Estado = nuevo;
        
        const res = await fetch(`/api/servicios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            cargarServicios();
            mostrarNotificacion(`Servicio ${nuevo === 1 ? 'activado' : 'desactivado'} con éxito.`, 'success');
        } else {
            mostrarNotificacion('Error al cambiar el estado del servicio.', 'error');
        }
    } catch (e) { mostrarNotificacion('Error de conexión.', 'error'); }
};

window.editarServicio = async (id) => {
    try {
        const res = await fetch(`/api/servicios/${id}`);
        const data = await res.json();
        document.getElementById('modalTitle').textContent = 'Editar Servicio';
        document.getElementById('modalContent').innerHTML = renderForm('servicios', data);
        document.getElementById('modalOverlay').classList.add('activo');
    } catch (e) { mostrarNotificacion('Error al cargar datos del servicio.', 'error'); }
};
window.eliminarServicio = async (id) => {
    mostrarConfirmacion(
        '¿Eliminar Servicio?',
        '¿Está seguro de que desea eliminar este servicio? Esta acción no se puede deshacer.',
        async () => {
            try {
                const res = await fetch('/api/servicios/' + id, { method: 'DELETE' });
                if (res.ok) {
                    cargarServicios();
                    mostrarNotificacion('Servicio eliminado con éxito.', 'success');
                } else {
                    const err = await res.json().catch(() => ({}));
                    mostrarNotificacion(err.message || 'Error al eliminar el servicio.', 'error');
                }
            } catch (e) {
                mostrarNotificacion('Error de conexión al servidor.', 'error');
            }
        }
    );
};

// —— Funciones de Creación —————————————————————————————————————————————
async function abrirModalCrear() {
    // Reservas tiene su propia página dedicada — se maneja en el listener del botón
    const title = titles[currentSection]?.replace('Gestión de ', 'Nueva/o ') || 'Nuevo Registro';
    document.getElementById('modalTitle').textContent = title;
    
    let extra = {};
    if (currentSection === 'paquetes') {
        try {
            const [resH, resS, resC] = await Promise.all([
                fetch('/api/habitaciones'),
                fetch('/api/servicios'),
                fetch('/api/cabanas')
            ]);
            extra.habitaciones = await resH.json();
            extra.servicios = await resS.json();
            extra.cabanas = await resC.json();
        } catch (e) { console.error('Error cargando dependencias'); }
    }

    document.getElementById('modalContent').innerHTML = renderForm(currentSection, null, extra);
    document.getElementById('modalOverlay').classList.add('activo');
}

window.calcularPrecioPaquete = () => {
    let subtotal = 0;
    
    // Habitación
    const habSelect = document.getElementById('select-habitacion');
    if (habSelect && habSelect.selectedOptions.length > 0) {
        subtotal += Number(habSelect.selectedOptions[0].dataset.precio || 0);
    }
    
    // Cabaña
    const cabSelect = document.getElementById('select-cabana');
    if (cabSelect && cabSelect.selectedOptions.length > 0) {
        subtotal += Number(cabSelect.selectedOptions[0].dataset.precio || 0);
    }
    
    // Servicios
    const servCheckboxes = document.querySelectorAll('input[name="IDServicioCheckbox"]:checked');
    servCheckboxes.forEach(chk => {
        subtotal += Number(chk.dataset.precio || 0);
    });
    
    // Descuento
    const descInput = document.getElementById('input-descuento');
    const precioFinalInput = document.getElementById('input-precio-final');
    
    if (descInput && precioFinalInput) {
        const numServicios = document.querySelectorAll('input[name="IDServicioCheckbox"]:checked').length;
        let total = subtotal;
        
        if (numServicios >= 2) {
            const descuento = Number(descInput.value || 0);
            total = subtotal - (subtotal * (descuento / 100)); // Calculado como porcentaje
        }
        
        if (total < 0) total = 0;
        precioFinalInput.value = total;
    }
};

function renderForm(section, data = null, extra = {}) {
    const isEdit = !!data;
    let fields = '';

    switch(section) {
        case 'habitaciones':
            fields = `
                <div class="form-group" style="grid-column:1/-1;">
                    <label>🏨 NOMBRE HABITACIÓN</label>
                    <input type="text" name="NombreHabitacion" value="${data?.NombreHabitacion || ''}" required>
                </div>
                <div class="form-group">
                    <label>💰 PRECIO</label>
                    <input type="number" name="precio" value="${data?.precio || data?.Precio || ''}" min="1" required>
                </div>
                <div class="form-group">
                    <label>⚙️ ESTADO</label>
                    <select name="Estado">
                        <option value="1" ${data?.Estado === 1 ? 'selected' : ''}>Disponible</option>
                        <option value="0" ${data?.Estado === 0 ? 'selected' : ''}>Mantenimiento</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label>👥 CAPACIDAD PERSONAS</label>
                    <input type="number" name="CapacidadPersonas" value="${data?.CapacidadPersonas || ''}" min="1" placeholder="Ej: 2" required>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label>📝 DESCRIPCIÓN</label>
                    <textarea name="Descripcion" rows="2">${data?.Descripcion || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>🖼️ IMAGEN URL</label>
                    <input type="text" name="imagen" value="${data?.imagen || ''}" oninput="document.getElementById('preview-img-modal').src = this.value || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'">
                </div>
                <div style="display:flex;align-items:center;">
                    <img id="preview-img-modal" src="${data?.imagen || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'}" alt="Preview" style="width:100%;height:68px;object-fit:cover;border-radius:8px;border:1px solid rgba(49,130,206,0.15);">
                </div>`;
            break;
        case 'clientes':
            fields = `
                <div class="form-group">
                    <label>🆔 NRO DOCUMENTO</label>
                    <input type="text" name="NroDocumento" value="${data?.NroDocumento || ''}" pattern="\\d+" title="Solo debe contener números." required>
                    <span class="field-error" id="err-NroDocumento"></span>
                </div>
                <div class="form-group">
                    <label>📞 TELÉFONO</label>
                    <input type="text" name="Telefono" value="${data?.Telefono || ''}" pattern="\\d+" title="Solo debe contener números.">
                    <span class="field-error" id="err-Telefono"></span>
                </div>
                <div class="form-group">
                    <label>👤 NOMBRE</label>
                    <input type="text" name="Nombre" value="${data?.Nombre || ''}" pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+" title="Solo debe contener letras y espacios." required>
                    <span class="field-error" id="err-Nombre"></span>
                </div>
                <div class="form-group">
                    <label>👤 APELLIDO</label>
                    <input type="text" name="Apellido" value="${data?.Apellido || ''}" pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+" title="Solo debe contener letras y espacios.">
                    <span class="field-error" id="err-Apellido"></span>
                </div>
                <div class="form-group">
                    <label>📧 EMAIL</label>
                    <input type="email" name="Email" value="${data?.Email || data?.Correo || ''}" required>
                </div>
                <div class="form-group">
                    <label>📍 DIRECCIÓN</label>
                    <input type="text" name="Direccion" value="${data?.Direccion || ''}">
                </div>
                ${isEdit ? '<input type="hidden" name="Estado" value="' + (data?.Estado ?? 1) + '">' : ''}
                ${isEdit ? '<input type="hidden" name="IDRol" value="' + (data?.IDRol ?? 1) + '">' : ''}`;
            break;
        case 'cabanas':
            fields = `
                <div class="form-group">
                    <label>🏠 NOMBRE DE LA CABAÑA</label>
                    <input type="text" name="NombreCabana" value="${data?.NombreCabana || ''}" pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+" title="Solo debe contener letras y espacios." required>
                    <span class="field-error" id="err-NombreCabana"></span>
                </div>
                <div class="form-group">
                    <label>👥 CAP. PERSONAS</label>
                    <input type="text" name="CapacidadPersonas" value="${data?.CapacidadPersonas || ''}" pattern="\\d+" title="Solo debe contener números." required>
                    <span class="field-error" id="err-CapacidadPersonas"></span>
                </div>
                <div class="form-group">
                    <label>🚪 NRO HABITACIONES</label>
                    <input type="text" name="NumeroHabitaciones" value="${data?.NumeroHabitaciones || ''}" pattern="\\d+" title="Solo debe contener números." required>
                    <span class="field-error" id="err-NumeroHabitaciones"></span>
                </div>
                <div class="form-group">
                    <label>💰 PRECIO POR NOCHE</label>
                    <input type="text" name="PrecioNoche" value="${data?.PrecioNoche || ''}" pattern="\\d+" title="Solo debe contener números." required>
                    <span class="field-error" id="err-PrecioNoche"></span>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label>⚙️ ESTADO</label>
                    <select name="Estado">
                        <option value="1" ${data?.Estado == 1 || !isEdit ? 'selected' : ''}>Disponible</option>
                        <option value="0" ${data?.Estado == 0 && isEdit ? 'selected' : ''}>No disponible</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label>📝 DESCRIPCIÓN</label>
                    <textarea name="Descripcion" rows="2" title="Puede contener letras, números, puntos, comas y signos de puntuación.">${data?.Descripcion || ''}</textarea>
                    <span class="field-error" id="err-Descripcion"></span>
                </div>
                <div class="form-group">
                    <label>🖼️ IMAGEN URL</label>
                    <input type="text" name="ImagenCabana" value="${data?.ImagenCabana || ''}" oninput="document.getElementById('preview-img-modal').src = this.value || 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=900&q=80'">
                </div>
                <div style="display:flex;align-items:center;">
                    <img id="preview-img-modal" src="${data?.ImagenCabana || 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=900&q=80'}" alt="Preview" style="width:100%;height:68px;object-fit:cover;border-radius:8px;border:1px solid rgba(49,130,206,0.15);">
                </div>`;
            break;
        case 'usuarios':
            fields = `
                <div class="form-group">
                    <label>👤 NOMBRE DE USUARIO</label>
                    <input type="text" name="NombreUsuario" value="${data?.NombreUsuario || ''}" required>
                </div>
                <div class="form-group">
                    <label>👤 APELLIDO</label>
                    <input type="text" name="Apellido" value="${data?.Apellido || ''}">
                </div>
                <div class="form-group">
                    <label>📧 EMAIL</label>
                    <input type="email" name="Email" value="${data?.Email || ''}" required>
                </div>
                <div class="form-group">
                    <label>🪪 NÚMERO DE DOCUMENTO <span style="color:#c0392b;font-size:0.7rem;">*</span></label>
                    <div style="display:flex;gap:0.5rem;align-items:stretch;">
                        <select name="TipoDocumento" style="width:72px;min-width:72px;max-width:72px;flex-shrink:0;padding:0.45rem 0.3rem;font-size:0.8rem;font-weight:600;border:1.5px solid rgba(123,82,171,0.58);background:#F5F0FF;border-radius:7px;color:#1A2B4A;cursor:pointer;appearance:auto;">
                            <option value="CC"  ${data?.TipoDocumento === 'CC'  ? 'selected' : ''}>CC</option>
                            <option value="CE"  ${data?.TipoDocumento === 'CE'  ? 'selected' : ''}>CE</option>
                            <option value="PA"  ${data?.TipoDocumento === 'PA'  ? 'selected' : ''}>PA</option>
                            <option value="NIT" ${data?.TipoDocumento === 'NIT' ? 'selected' : ''}>NIT</option>
                        </select>
                        <input type="text" name="NumeroDocumento" value="${data?.NumeroDocumento || ''}" placeholder="Ej. 1234567890" style="flex:1;min-width:0;" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>📞 TELÉFONO</label>
                    <input type="text" name="Telefono" value="${data?.Telefono || ''}">
                </div>
                <div class="form-group">
                    <label>🌍 PAÍS</label>
                    <input type="text" name="Pais" value="${data?.Pais || ''}">
                </div>
                <div class="form-group">
                    <label>🔑 ROL</label>
                    <select name="IDRol">
                        <option value="1" ${data?.IDRol === 1 ? 'selected' : ''}>Cliente</option>
                        <option value="2" ${data?.IDRol === 2 ? 'selected' : ''}>Administrador</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>⚙️ ESTADO</label>
                    <select name="Estado">
                        <option value="1" ${data?.Estado === 1 ? 'selected' : ''}>Activo</option>
                        <option value="0" ${data?.Estado === 0 ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
                ${!isEdit
                    ? '<div class="form-group" style="grid-column:1/-1;"><label>🔒 CONTRASEÑA</label><input type="password" name="Contrasena" required></div>'
                    : `<div class="form-group" style="grid-column:1/-1;">
                            <label>🔒 NUEVA CONTRASEÑA <span style="font-size:0.7rem;font-weight:400;color:rgba(26,43,74,0.5);">(dejar vacío para no cambiarla)</span></label>
                            <input type="password" name="Contrasena" placeholder="Escribe una nueva contraseña…" autocomplete="new-password">
                       </div>`
                }`;
            break;
        case 'paquetes':
            const selectedServices = (data?.IDServicio || '').toString().split(',');
            fields = `
                <div class="form-group" style="grid-column:1/-1;">
                    <label>📦 NOMBRE PAQUETE</label>
                    <input type="text" name="NombrePaquete" value="${data?.NombrePaquete || ''}" required>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label>📝 DESCRIPCIÓN</label>
                    <textarea id="paquete-descripcion-admin" name="Descripcion" rows="2">${data?.Descripcion || data?.descripcion || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>🏨 HABITACIÓN</label>
                    <select name="IDHabitacion" id="select-habitacion" onchange="window.calcularPrecioPaquete()">
                        <option value="" data-precio="0">Ninguna</option>
                        ${(extra.habitaciones || []).filter(h => h.Estado === 1 || h.IDHabitacion === data?.IDHabitacion).map(h => `
                            <option value="${h.IDHabitacion}" data-precio="${h.precio || h.Precio || 0}" ${h.IDHabitacion === data?.IDHabitacion ? 'selected' : ''}>
                                ${h.NombreHabitacion} ($${Number(h.precio || h.Precio || 0).toLocaleString('es-CO')})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>🏕️ CABAÑA</label>
                    <select name="IDCabana" id="select-cabana" onchange="window.calcularPrecioPaquete()">
                        <option value="" data-precio="0">Ninguna</option>
                        ${(extra.cabanas || []).filter(c => Number(c.Estado) === 1 || c.IDCabana === data?.IDCabana).map(c => `
                            <option value="${c.IDCabana}" data-precio="${c.PrecioNoche || c.precioNoche || 0}" ${c.IDCabana === data?.IDCabana ? 'selected' : ''}>
                                ${c.NombreCabana} ($${Number(c.PrecioNoche || c.precioNoche || 0).toLocaleString('es-CO')})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label>🛠️ SERVICIOS INCLUIDOS</label>
                    <div id="checkboxes-servicios" style="background-color:#f0f7ff;border:1px solid rgba(49,130,206,0.18);border-radius:8px;padding:8px;max-height:90px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;">
                        ${(extra.servicios || []).map(s => `
                            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.82rem;margin:0;padding:2px;border-radius:4px;">
                                <input type="checkbox" name="IDServicioCheckbox" value="${s.IDServicio}" data-precio="${s.precio || s.Costo || 0}" ${selectedServices.includes(s.IDServicio.toString()) ? 'checked' : ''} onchange="window.calcularPrecioPaquete()" style="width:16px;height:16px;accent-color:#2B6CB0;cursor:pointer;">
                                <span>${s.nombre || s.NombreServicio} <strong style="color:rgba(26,43,74,0.5);font-weight:normal;">($${Number(s.precio || s.Costo || 0).toLocaleString('es-CO')})</strong></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group" style="background-color:rgba(49,130,206,0.04);padding:0.5rem;border-radius:8px;border:1px solid rgba(49,130,206,0.1);">
                    <label>📉 DESCUENTO (%)</label>
                    <input type="number" name="Descuento" id="input-descuento" value="${data?.Descuento || 0}" oninput="window.calcularPrecioPaquete()" min="0" max="100" step="any">
                    <input type="hidden" name="TipoDescuento" value="porcentaje">
                </div>
                <div class="form-group" style="background-color:rgba(49,130,206,0.04);padding:0.5rem;border-radius:8px;border:1px solid rgba(49,130,206,0.1);">
                    <label>💰 PRECIO FINAL</label>
                    <input type="number" name="precio" id="input-precio-final" value="${data?.precio || data?.Precio || 0}" required readonly style="background-color:#f0f7ff;color:#10b981;font-weight:bold;">
                </div>
                <div class="form-group">
                    <label>🖼️ IMAGEN URL</label>
                    <input type="text" name="imagen" value="${data?.imagen || ''}" oninput="document.getElementById('preview-img-modal').src = this.value || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=900&q=80'">
                </div>
                <div class="form-group">
                    <label>⚙️ ESTADO</label>
                    <select name="Estado">
                        <option value="1" ${data?.Estado === 1 ? 'selected' : ''}>Activo</option>
                        <option value="0" ${data?.Estado === 0 ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
                <div style="grid-column:1/-1;">
                    <img id="preview-img-modal" src="${data?.imagen || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=900&q=80'}" alt="Preview" style="width:100%;height:60px;object-fit:cover;border-radius:8px;border:1px solid rgba(49,130,206,0.15);">
                </div>`;
            break;
        case 'servicios':
            fields = `
                <div class="form-group">
                    <label>🛠️ NOMBRE SERVICIO</label>
                    <input type="text" name="NombreServicio" value="${data?.NombreServicio || ''}" required>
                </div>
                <div class="form-group">
                    <label>💰 PRECIO</label>
                    <input type="number" name="precio" value="${data?.precio || data?.Costo || ''}" required>
                </div>
                <div class="form-group">
                    <label>👥 MÁX. PERSONAS</label>
                    <input type="number" name="CantidadMaximaPersonas" value="${data?.CantidadMaximaPersonas || ''}">
                </div>
                <div class="form-group">
                    <label>⚙️ ESTADO</label>
                    <select name="Estado">
                        <option value="1" ${data?.Estado === 1 ? 'selected' : ''}>Activo</option>
                        <option value="0" ${data?.Estado === 0 ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label>⏱️ DURACIÓN</label>
                    <input type="text" name="Duracion" value="${data?.Duracion || ''}" placeholder="Ej: 2 horas">
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label>📝 DESCRIPCIÓN</label>
                    <textarea name="Descripcion" rows="2">${data?.Descripcion || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>🖼️ IMAGEN URL</label>
                    <input type="text" name="imagen" value="${data?.imagen || ''}" oninput="document.getElementById('preview-img-modal').src = this.value || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80'">
                </div>
                <div style="display:flex;align-items:center;">
                    <img id="preview-img-modal" src="${data?.imagen || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80'}" alt="Preview" style="width:100%;height:68px;object-fit:cover;border-radius:8px;border:1px solid rgba(49,130,206,0.15);">
                </div>`;
            break;
    }

    // Determinar el ID primario según la sección, NO usar OR genérico
    // (porque paquetes tiene IDHabitacion como FK y se confundía con el PK)
    let itemId = null;
    switch (section) {
        case 'habitaciones': itemId = data?.IDHabitacion || null; break;
        case 'usuarios':     itemId = data?.IDUsuario    || null; break;
        case 'clientes':     itemId = data?.IDCliente    || null; break;
        case 'cabanas':      itemId = data?.IDCabana     || null; break;
        case 'paquetes':     itemId = data?.IDPaquete    || null; break;
        case 'servicios':    itemId = data?.IDServicio   || null; break;
        default:             itemId = data?.IDHabitacion || data?.IDUsuario || data?.NroDocumento || data?.IDCabana || data?.IDPaquete || data?.IDServicio || null;
    }

    window.guardarItem = async (e, section, id) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData.entries());
        
        // Fix explícito para Descripcion en paquetes en caso de que FormData falle
        if (section === 'paquetes') {
            const descrEl = document.getElementById('paquete-descripcion-admin');
            if (descrEl) {
                body.Descripcion = descrEl.value.trim();
            }
            const checkboxes = document.querySelectorAll('input[name="IDServicioCheckbox"]:checked');
            body.IDServicio = Array.from(checkboxes).map(c => c.value);
        }

        // Limpiar errores previos
        document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
        document.querySelectorAll('.form-group input, .form-group textarea').forEach(el => el.classList.remove('input-error'));

        // Validación Frontend con errores inline
        const letrasEspaciosRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
        const descripcionRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.,;:!?¡¿\-()'"\-&]+$/;
        const numerosRegex = /^\d+$/;
        let hayError = false;

        function marcarError(campo, mensaje) {
            const errEl = document.getElementById('err-' + campo);
            const inputEl = e.target.querySelector(`[name="${campo}"]`);
            if (errEl) { errEl.textContent = mensaje; errEl.classList.add('visible'); }
            if (inputEl) inputEl.classList.add('input-error');
            hayError = true;
        }

        if (section === 'clientes') {
            if (body.Nombre && !letrasEspaciosRegex.test(body.Nombre)) {
                marcarError('Nombre', 'Solo debe contener letras y espacios.');
            }
            if (body.Apellido && !letrasEspaciosRegex.test(body.Apellido)) {
                marcarError('Apellido', 'Solo debe contener letras y espacios.');
            }
            if (body.NroDocumento && !numerosRegex.test(body.NroDocumento)) {
                marcarError('NroDocumento', 'Solo debe contener números.');
            }
            if (body.Telefono && !numerosRegex.test(body.Telefono)) {
                marcarError('Telefono', 'Solo debe contener números.');
            }
        } else if (section === 'cabanas') {
            if (body.NombreCabana && !letrasEspaciosRegex.test(body.NombreCabana)) {
                marcarError('NombreCabana', 'Solo debe contener letras y espacios.');
            }
            if (body.Descripcion && !descripcionRegex.test(body.Descripcion)) {
                marcarError('Descripcion', 'La descripción contiene caracteres no permitidos.');
            }
            if (body.CapacidadPersonas && !numerosRegex.test(body.CapacidadPersonas.toString())) {
                marcarError('CapacidadPersonas', 'Solo debe contener números.');
            }
            if (body.NumeroHabitaciones && !numerosRegex.test(body.NumeroHabitaciones.toString())) {
                marcarError('NumeroHabitaciones', 'Solo debe contener números.');
            }
            if (body.PrecioNoche && !numerosRegex.test(body.PrecioNoche.toString())) {
                marcarError('PrecioNoche', 'Solo debe contener números.');
            }
        }

        if (hayError) {
            return mostrarNotificacion('Corrige los errores marcados en el formulario.', 'error', 'Error de Validación');
        }

        // Conversión de tipos para números
        ['precio', 'PrecioNoche', 'CapacidadPersonas', 'CantidadMaximaPersonas', 'NumeroHabitaciones', 'IDHabitacion', 'IDServicio', 'IDCabana', 'IDRol', 'Estado'].forEach(key => {
            if (body[key] !== undefined && body[key] !== '') body[key] = Number(body[key]);
        });

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/${section}/${id}` : `/api/${section}`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                cerrarModal();
                cargarSeccion(section);
                mostrarNotificacion(`Registro ${id ? 'actualizado' : 'creado'} correctamente.`, 'success');
            } else {
                const err = await res.json();
                mostrarNotificacion(err.error || err.message || 'No se pudo guardar el registro.', 'error', 'Error al guardar');
            }
        } catch (e) {
            mostrarNotificacion('Error de conexión con el servidor.', 'error');
        }
    };

    return `
        <form class="modal-form" onsubmit="guardarItem(event, '${section}', ${itemId ? `'${itemId}'` : 'null'})">
            ${fields}
            <div class="modal-actions">
                <button type="button" onclick="cerrarModal()" class="btn-cancelar">Cancelar</button>
                <button type="submit" class="btn-guardar">${isEdit ? 'Guardar Cambios' : 'Crear Registro'}</button>
            </div>
        </form>`;
}

// ===== INICIALIZAR =====
// Soporte de hash en la URL (ej: admin.html#reservas al volver de nueva reserva)
(function initWithHash() {
    const hash = window.location.hash.replace('#', '').trim();
    const validSections = ['dashboard','reservas','habitaciones','usuarios','clientes','cabanas','paquetes','servicios'];
    const startSection  = validSections.includes(hash) ? hash : 'dashboard';
    switchSection(startSection);
    // Limpiar el hash de la URL sin recargar
    if (hash) history.replaceState(null, '', window.location.pathname);
})();
