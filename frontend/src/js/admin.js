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
        window.location.href = '/src/pages/login.html';
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
        list.innerHTML = '<p style="color:rgba(255,255,255,0.4); padding:2rem;">Cargando reservas...</p>';
    }

    try {
        const [resReservas, resEstados] = await Promise.all([
            fetch(`/api/reservas?page=${reservasCurrentPage}&limit=${reservasLimit}`),
            fetch('/api/estadosreserva')
        ]);

        if (!resReservas.ok) throw new Error(`Error reservaciones: ${resReservas.status}`);
        if (!resEstados.ok)  throw new Error(`Error estados: ${resEstados.status}`);

        const responseData = await resReservas.json();
        reservasEstados    = await resEstados.json();

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
                <div style="text-align:center; padding:4rem 2rem; color:rgba(255,255,255,0.3);">
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
        pendiente:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: 'clock' },
        confirmada:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  icon: 'check-circle-2' },
        cancelada:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   icon: 'x-circle' },
        completada:  { color: '#00d4ff', bg: 'rgba(0,212,255,0.12)',   border: 'rgba(0,212,255,0.3)',   icon: 'check-circle' },
        procesando:  { color: '#7b2ff7', bg: 'rgba(123,47,247,0.12)', border: 'rgba(123,47,247,0.3)', icon: 'loader' },
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
                const cfg   = getEstado(r.NombreEstadoReserva);
                const dias  = diasRestantes(r.FechaFinalizacion);
                const diasTxt = dias !== null
                    ? dias > 0
                        ? `<span style="color:#10b981; font-size:0.75rem;">⏳ ${dias} días restantes</span>`
                        : dias === 0
                            ? `<span style="color:#f59e0b; font-size:0.75rem;">⚡ Finaliza hoy</span>`
                            : `<span style="color:#ef4444; font-size:0.75rem;">✓ Finalizada hace ${Math.abs(dias)} días</span>`
                    : '';

                return `
                <div class="reserva-card" data-estado="${r.NombreEstadoReserva?.toLowerCase()}">
                    <div class="reserva-card__header" style="border-left: 4px solid ${cfg.color};">
                        <div class="reserva-card__id-wrap">
                            <span class="reserva-card__id">#${r.IdReserva}</span>
                            <span class="reserva-card__badge" style="color:${cfg.color}; background:${cfg.bg}; border:1px solid ${cfg.border};">
                                <i data-lucide="${cfg.icon}" style="width:12px; height:12px;"></i>
                                ${r.NombreEstadoReserva}
                            </span>
                        </div>
                        <div class="reserva-card__select-wrap">
                            <select class="reserva-estado-select" onchange="cambiarEstado(${r.IdReserva}, this.value)"
                                style="border-color: ${cfg.border}; color: ${cfg.color};">
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
                            <button onclick="editarReserva(${r.IdReserva})" class="btn-icon-admin btn-edit" title="Editar Reserva">
                                <i data-lucide="edit-2" style="width:15px;"></i>
                            </button>
                            <button onclick="eliminarReserva(${r.IdReserva})" class="btn-icon-admin btn-delete" title="Eliminar Reserva">
                                <i data-lucide="trash-2" style="width:15px;"></i>
                            </button>
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
            pendiente:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: 'clock' },
            confirmada:  { color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: 'check-circle-2' },
            cancelada:   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: 'x-circle' },
            completada:  { color: '#00d4ff', bg: 'rgba(0,212,255,0.15)',   icon: 'check-circle' },
            procesando:  { color: '#7b2ff7', bg: 'rgba(123,47,247,0.15)', icon: 'loader' },
        };
        const key = (r.NombreEstadoReserva || '').toLowerCase();
        const cfg = estadoConfig[key] || { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: 'help-circle' };
        const fmt = f => f ? new Date(f).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) : '—';

        document.getElementById('detalleTitulo').textContent = `Detalle de Reserva #${r.IdReserva}`;
        document.getElementById('detalleContent').style.padding = '0';
        const modalBox = document.querySelector('#detalleModalOverlay .modal-box-ver');
        if (modalBox) modalBox.classList.add('modal-box--wide');

        document.getElementById('detalleContent').innerHTML = `
            <div class="reserva-detalle" style="padding: 1rem;">
                <!-- Encabezado de la Reserva -->
                <div style="background: linear-gradient(135deg, ${cfg.color}15, rgba(13,11,46,0.8)); border: 1px solid ${cfg.color}44; border-radius: 16px; padding: 2.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 2rem; position: relative; overflow: hidden;">
                    
                    <!-- Elemento decorativo de fondo -->
                    <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at center, ${cfg.color}11 0%, transparent 50%); pointer-events: none;"></div>

                    <div style="position: relative; z-index: 1;">
                        <div style="margin-bottom: 1rem;">
                             <span style="font-size: 0.85rem; font-weight: 600; color: ${cfg.color}; background: ${cfg.bg}; border: 1px solid ${cfg.color}44; padding: 6px 14px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px ${cfg.color}22;">
                                 <i data-lucide="${cfg.icon}" style="width: 15px; height: 15px;"></i> ${r.NombreEstadoReserva || '—'}
                             </span>
                        </div>
                        <div style="margin-bottom: 0.5rem; color: rgba(255,255,255,0.5); font-size: 0.8rem; font-weight: 700; letter-spacing: 2px;">TOTAL A PAGAR</div>
                        <div style="font-size: 3.2rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; text-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                            <span style="color: #10b981;">$</span>${Number(r.MontoTotal || 0).toLocaleString('es-CO')}
                        </div>
                        <div style="font-size: 1rem; color: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                             <i data-lucide="hash" style="width: 16px; color: ${cfg.color};"></i> Reserva <strong style="color: #fff; font-size: 1.1rem; font-family: monospace;">#${r.IdReserva}</strong>
                        </div>
                    </div>
                </div>

                <!-- Grid de Información Centrada -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.2rem; padding: 0 0.5rem;">
                    
                    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 1.8rem 1rem; border-radius: 16px; transition: all 0.3s; cursor: default;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(123,47,247,0.15); border: 1px solid rgba(123,47,247,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: #9b59f5; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                            <i data-lucide="user" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 700; letter-spacing: 1px; margin-bottom: 0.5rem;">CLIENTE</div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: #fff;">${r.NombreUsuario || '—'}</div>
                        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-top: 0.4rem; font-family: monospace;">${r.NroDocumentoCliente || '—'}</div>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 1.8rem 1rem; border-radius: 16px;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: #10b981; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                            <i data-lucide="calendar-range" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 700; letter-spacing: 1px; margin-bottom: 0.5rem;">ESTADÍA</div>
                        <div style="display: flex; flex-direction: column; gap: 0.4rem; width: 100%; align-items: center;">
                            <div style="font-size: 0.95rem; font-weight: 500; color: rgba(255,255,255,0.8); display: flex; justify-content: space-between; width: 140px;">
                                <span>In:</span> <span style="font-weight:600; color: #10b981;">${fmt(r.FechaInicio)}</span>
                            </div>
                            <div style="font-size: 0.95rem; font-weight: 500; color: rgba(255,255,255,0.8); display: flex; justify-content: space-between; width: 140px;">
                                <span>Out:</span> <span style="font-weight:600; color: #ef4444;">${fmt(r.FechaFinalizacion)}</span>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 1.8rem 1rem; border-radius: 16px;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: #f59e0b; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                            <i data-lucide="credit-card" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 700; letter-spacing: 1px; margin-bottom: 0.5rem;">MÉTODO DE PAGO</div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: #fff;">${r.NomMetodoPago || '—'}</div>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 1.8rem 1rem; border-radius: 16px;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(0,212,255,0.15); border: 1px solid rgba(0,212,255,0.3); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: #00d4ff; box-shadow: 0 8px 16px rgba(0,0,0,0.2);">
                            <i data-lucide="home" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 700; letter-spacing: 1px; margin-bottom: 0.5rem;">ALOJAMIENTO</div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: #fff;">${r.NombreHabitacion || r.NombreCabana || r.NombrePaquete || '—'}</div>
                    </div>
                </div>
            </div>`;
        if (window.lucide) lucide.createIcons({ parent: document.getElementById('detalleContent') });
        document.getElementById('detalleModalOverlay').classList.add('activo');
    } catch(e) {
        console.error(e);
        mostrarNotificacion('Error al cargar el detalle de la reserva.', 'error');
    }
};

window.editarReserva = async (id) => {
    try {
        const [resR, resEstados, resMetodos] = await Promise.all([
            fetch(`/api/reservas/${id}`),
            fetch('/api/estadosreserva'),
            fetch('/api/metodopago')
        ]);
        if (!resR.ok) throw new Error('No se pudo cargar la reserva');
        const r = await resR.json();
        const estados = await resEstados.json();
        const metodos = await resMetodos.json();

        const fmt = f => f ? new Date(f).toISOString().split('T')[0] : '';

        document.getElementById('modalTitle').textContent = `✏️ Editar Reserva #${r.IdReserva}`;
        document.getElementById('modalContent').innerHTML = `
            <form id="formEditarReserva" style="display:flex; flex-direction:column; gap:1.2rem;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div class="form-group">
                        <label>Fecha Check-In</label>
                        <input type="date" id="er_fechaInicio" value="${fmt(r.FechaInicio)}" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>Fecha Check-Out</label>
                        <input type="date" id="er_fechaFin" value="${fmt(r.FechaFinalizacion)}" class="form-input" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Estado de la Reserva</label>
                    <select id="er_estado" class="form-input">
                        ${estados.map(e => `<option value="${e.IdEstadoReserva}" ${e.IdEstadoReserva === r.IdEstadoReserva ? 'selected' : ''}>${e.NombreEstadoReserva}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Método de Pago</label>
                    <select id="er_metodoPago" class="form-input">
                        ${metodos.map(m => `<option value="${m.IdMetodoPago || m.IDMetodoPago}" ${(m.IdMetodoPago || m.IDMetodoPago) === r.IdMetodoPago ? 'selected' : ''}>${m.NomMetodoPago || m.Nombre || '—'}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Monto Total ($)</label>
                    <input type="number" id="er_monto" value="${r.MontoTotal || 0}" min="0" class="form-input">
                </div>
                <div style="display:flex; gap:1rem; justify-content:flex-end; margin-top:0.5rem;">
                    <button type="button" onclick="cerrarModal()" class="btn btn-secundario">Cancelar</button>
                    <button type="button" onclick="guardarReserva(${r.IdReserva})" class="btn btn-primario">💾 Guardar Cambios</button>
                </div>
            </form>`;
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
    const monto       = document.getElementById('er_monto')?.value;

    if (!fechaInicio || !fechaFin) {
        mostrarNotificacion('Las fechas de check-in y check-out son obligatorias.', 'warning');
        return;
    }
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
        mostrarNotificacion('La fecha de check-out debe ser posterior al check-in.', 'warning');
        return;
    }

    try {
        const res = await fetch(`/api/reservas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                FechaInicio:       fechaInicio,
                FechaFinalizacion: fechaFin,
                IdEstadoReserva:   Number(idEstado),
                IdMetodoPago:      Number(idMetodo),
                MontoTotal:        Number(monto)
            })
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
        container.innerHTML = '<p style="color:rgba(255,255,255,0.4);">Cargando habitaciones...</p>';
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
            container.innerHTML = '<p style="color:rgba(255,255,255,0.4);">No hay habitaciones registradas.</p>';
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
                        <div class="card__acciones" style="display:flex; justify-content: space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.05);">
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
        list.innerHTML = '<p style="color:rgba(255,255,255,0.4); padding:2rem;">Cargando usuarios...</p>';
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
                                <td style="color:#fff;font-weight:500;">${u.NombreUsuario}</td>
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
        list.innerHTML = '<p style="color:rgba(255,255,255,0.4); padding:2rem;">Cargando clientes...</p>';
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
                                <td style="color:#fff;font-weight:500;">${c.Nombre}</td>
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
        container.innerHTML = '<p style="color:rgba(255,255,255,0.4);">Cargando cabañas...</p>';
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
            container.innerHTML = '<p style="color:rgba(255,255,255,0.4);">No hay cabañas registradas.</p>';
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
                            <div style="font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem; display: flex; flex-direction: column; gap: 4px;">
                                <span>👥 Capacidad: ${c.CapacidadPersonas || 0} pers.</span>
                                <span>🚪 Habitaciones: ${c.NumeroHabitaciones || 0}</span>
                            </div>
                        </div>
                        <div class="room-info" style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                            <span class="room-price">${precio}</span>
                        </div>
                        <div class="card__acciones" style="display:flex; justify-content: space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.05);">
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
        // En lugar de hacer fetch, buscamos en los datos que YA tenemos cargados en la tabla
        // Esto garantiza que si se ve en la tabla, se verá en el detalle
        let c = (window.clientesData || []).find(item => 
            String(item.NroDocumento) === String(id) || 
            String(item.IDCliente) === String(id) ||
            String(item.id) === String(id)
        );

        if (!c) {
            mostrarNotificacion('No se encontraron datos para este cliente en la memoria local.', 'warning');
            return;
        }

        // Normalización de valores con búsqueda exhaustiva para el email
        const getVal = (obj, key) => obj[key] !== undefined ? obj[key] : '-';
        
        // El email es crítico, buscamos en todas las variantes posibles
        const email = c.Email || c.email || c.Correo || c.correo || c.Mail || c.mail || '-';
        const nombre = getVal(c, 'Nombre');
        const apellido = getVal(c, 'Apellido');
        const idCli = getVal(c, 'IDCliente');
        const documento = getVal(c, 'NroDocumento') !== '-' ? getVal(c, 'NroDocumento') : id;
        const telefono = getVal(c, 'Telefono');
        const direccion = getVal(c, 'Direccion');
        const idRol = getVal(c, 'IDRol');
        const estadoVal = c.Estado !== undefined ? c.Estado : 1;
        const estadoTxt = estadoVal == 1 ? 'Activo' : 'Inactivo';
        
        document.getElementById('detalleTitulo').textContent = `Detalle del Cliente`;
        document.getElementById('detalleContent').style.padding = "0"; 
        
        const modalBox = document.querySelector('#detalleModalOverlay .modal-box-ver');
        if (modalBox) modalBox.classList.remove('modal-box--wide');

        document.getElementById('detalleContent').innerHTML = `
            <div class="cliente-detalle">
                <div class="cliente-detalle__header">
                    <div class="cliente-detalle__avatar">
                        <i data-lucide="user"></i>
                    </div>
                    <div class="cliente-detalle__header-info">
                        <h4>${nombre} ${apellido}</h4>
                        <span>ID: ${idCli} &bull; Doc: ${documento}</span>
                    </div>
                    <span class="badge ${estadoVal == 1 ? 'badge-confirmada' : 'badge-cancelada'} cliente-detalle__badge">${estadoTxt}</span>
                </div>

                <div class="cliente-detalle__grid">
                    <div class="cliente-detalle__card">
                        <i data-lucide="mail"></i>
                        <p>EMAIL</p>
                        <span>${email}</span>
                    </div>
                    <div class="cliente-detalle__card">
                        <i data-lucide="phone"></i>
                        <p>TELÉFONO</p>
                        <span>${telefono}</span>
                    </div>
                    <div class="cliente-detalle__card">
                        <i data-lucide="map-pin"></i>
                        <p>DIRECCIÓN</p>
                        <span>${direccion}</span>
                    </div>
                    <div class="cliente-detalle__card">
                        <i data-lucide="shield"></i>
                        <p>ROL</p>
                        <span>${idRol == 2 ? 'Administrador' : 'Cliente'}</span>
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
        const estadoClass = h.Estado === 1 ? 'status-disponible' : 'status-mantenimiento';

        document.getElementById('detalleTitulo').textContent = `Ficha de Habitación`;
        document.getElementById('detalleContent').innerHTML = `
            <div class="ficha-detalle">
                <div class="ficha-detalle__img">
                    <img src="${imgUrl}" alt="${h.NombreHabitacion || 'Habitación'}">
                    <div class="ficha-detalle__badge">${h.NombreHabitacion || 'Habitación'}</div>
                </div>
                <div class="ficha-detalle__info">
                    <p class="ficha-detalle__desc">"${h.Descripcion || 'Sin descripción disponible.'}"</p>
                    <div class="ficha-detalle__datos">
                        <div class="ficha-detalle__dato"><i data-lucide="dollar-sign"></i> <b>Precio:</b> $${Number(h.precio || h.Precio || 0).toLocaleString('es-CO')}</div>
                        <div class="ficha-detalle__dato"><i data-lucide="check-circle-2"></i> <b>Estado:</b> <span class="badge-status ${estadoClass}">${estado}</span></div>
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
        const estadoClass = p.Estado === 1 ? 'status-disponible' : 'status-mantenimiento';

        document.getElementById('detalleTitulo').textContent = `Ficha de Paquete`;
        document.getElementById('detalleContent').innerHTML = `
            <div class="ficha-detalle">
                <div class="ficha-detalle__img">
                    <img src="${imgUrl}" alt="${p.NombrePaquete || p.nombre || 'Paquete'}">
                    <div class="ficha-detalle__badge">${p.NombrePaquete || p.nombre || 'Paquete'}</div>
                </div>
                <div class="ficha-detalle__info">
                    <p class="ficha-detalle__desc">"${p.Descripcion || p.descripcion || 'Sin descripción disponible.'}"</p>
                    <div class="ficha-detalle__datos">
                        <div class="ficha-detalle__dato"><i data-lucide="dollar-sign"></i> <b>Precio:</b> $${Number(p.precio || p.Precio || 0).toLocaleString('es-CO')}</div>
                        <div class="ficha-detalle__dato"><i data-lucide="hotel"></i> <b>Habitación:</b> ${p.NombreHabitacion || '-'}</div>
                        <div class="ficha-detalle__dato"><i data-lucide="smile"></i> <b>Servicio:</b> ${p.NombreServicio || '-'}</div>
                        <div class="ficha-detalle__dato"><i data-lucide="check-circle-2"></i> <b>Estado:</b> <span class="badge-status ${estadoClass}">${estado}</span></div>
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
        const estadoClass = s.Estado === 1 ? 'status-disponible' : 'status-mantenimiento';

        document.getElementById('detalleTitulo').textContent = `Ficha de Servicio`;
        document.getElementById('detalleContent').innerHTML = `
            <div class="ficha-detalle">
                <div class="ficha-detalle__img">
                    <img src="${imgUrl}" alt="${s.NombreServicio || s.nombre || 'Servicio'}">
                    <div class="ficha-detalle__badge">${s.NombreServicio || s.nombre || 'Servicio'}</div>
                </div>
                <div class="ficha-detalle__info">
                    <p class="ficha-detalle__desc">"${s.Descripcion || s.descripcion || 'Sin descripción disponible.'}"</p>
                    <div class="ficha-detalle__datos">
                        <div class="ficha-detalle__dato"><i data-lucide="dollar-sign"></i> <b>Precio:</b> $${Number(s.precio || s.Costo || 0).toLocaleString('es-CO')}</div>
                        <div class="ficha-detalle__dato"><i data-lucide="clock"></i> <b>Duración:</b> ${s.Duracion || s.duracion || '-'}</div>
                        <div class="ficha-detalle__dato"><i data-lucide="users"></i> <b>Máx. Personas:</b> ${s.CantidadMaximaPersonas || '-'}</div>
                        <div class="ficha-detalle__dato"><i data-lucide="check-circle-2"></i> <b>Estado:</b> <span class="badge-status ${estadoClass}">${estado}</span></div>
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
        const estadoClass = Number(c.Estado || c.estado) === 1 ? 'status-disponible' : 'status-mantenimiento';

        document.getElementById('detalleTitulo').textContent = `Ficha de Cabaña`;
        document.getElementById('detalleContent').style.padding = "0";

        const modalBox = document.querySelector('#detalleModalOverlay .modal-box-ver');
        if (modalBox) modalBox.classList.add('modal-box--wide');

        document.getElementById('detalleContent').innerHTML = `
            <div class="cabana-detalle">
                <div class="cabana-detalle__img-wrapper">
                    <img src="${c.ImagenCabana || c.imagenCabana || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'}" alt="${c.NombreCabana || c.nombreCabana || 'Cabaña'}">
                </div>
                <div class="cabana-detalle__info">
                    <h2 class="cabana-detalle__title">${c.NombreCabana || c.nombreCabana || 'Cabaña'}</h2>
                    <p class="cabana-detalle__desc">"${c.Descripcion || c.descripcion || 'Sin descripción detallada disponible.'}"</p>
                    <div class="cabana-detalle__grid">
                        <div class="cabana-detalle__card">
                            <i data-lucide="users"></i>
                            <div class="cabana-detalle__card-text">
                                <p>CAPACIDAD</p>
                                <span>${c.CapacidadPersonas || c.capacidadPersonas} personas</span>
                            </div>
                        </div>
                        <div class="cabana-detalle__card">
                            <i data-lucide="dollar-sign"></i>
                            <div class="cabana-detalle__card-text">
                                <p>PRECIO</p>
                                <span>$${Number(c.PrecioNoche || c.precioNoche || 0).toLocaleString('es-CO')}</span>
                            </div>
                        </div>
                        <div class="cabana-detalle__card" style="grid-column: span 2;">
                            <i data-lucide="check-circle-2"></i>
                            <div class="cabana-detalle__card-text">
                                <p>ESTADO</p>
                                <span class="badge ${clase}">${texto}</span>
                            </div>
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
        list.innerHTML = '<p style="color:rgba(255,255,255,0.4); padding:2rem;">Cargando paquetes...</p>';
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
            list.innerHTML = '<p style="color:rgba(255,255,255,0.4);">No hay paquetes registrados.</p>';
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
                                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem; display: flex; flex-direction: column; gap: 4px;">
                                        ${p.NombreHabitacion ? `<span>🏠 Habitación: ${p.NombreHabitacion}</span>` : ''}
                                        ${p.NombreCabana ? `<span>🏕️ Cabaña: ${p.NombreCabana}</span>` : ''}
                                        <span>🛠️ Servicios: ${p.NombreServicio || '-'}</span>
                                    </div>
                                </div>
                                <div class="room-info" style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                                    <span class="room-price">${precio}</span>
                                </div>
                                <div class="card__acciones" style="display:flex; justify-content: space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.05);">
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
        list.innerHTML = '<p style="color:rgba(255,255,255,0.4); padding:2rem;">Cargando servicios...</p>';
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
            list.innerHTML = '<p style="color:rgba(255,255,255,0.4);">No hay servicios registrados.</p>';
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
                                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-top: 0.5rem; display: flex; flex-direction: column; gap: 4px;">
                                        <span>⏱️ Duración: ${s.Duracion || '-'}</span>
                                        <span>👥 Max. Personas: ${s.CantidadMaximaPersonas || '-'}</span>
                                    </div>
                                </div>
                                <div class="room-info" style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
                                    <span class="room-price">${costo}</span>
                                </div>
                                <div class="card__acciones" style="display:flex; justify-content: space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.05);">
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
    ['kpi-ocupacion', 'kpi-ingresos', 'kpi-satisfaccion', 'kpi-reservas']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.textContent = '...'; el.classList.add('loading-num'); }
        });

    try {
        const [cabanas, habitaciones, clientes, paquetes, servicios, reservas, usuarios] = await Promise.all([
            cabanasAPI.getAll(),
            habitacionesAPI.getAll(),
            clientesAPI.getAll(),
            paquetesAPI.getAll(),
            serviciosAPI.getAll(),
            reservasAPI.getAll(),
            fetch('/api/usuarios').then(res => res.json())
        ]);

        // ── KPI 1: Tasa de Ocupación ──
        const elOcu = document.getElementById('kpi-ocupacion');
        const cabanasOcupadas = cabanas.filter(c => Number(c.Estado) === 2).length;
        const cabanasTotales = cabanas.length || 1;
        const tasaOcupacion = Math.round((cabanasOcupadas / cabanasTotales) * 100);
        if (elOcu) { elOcu.classList.remove('loading-num'); elOcu.textContent = tasaOcupacion + '%'; }
        const subOcu = document.getElementById('kpi-ocupacion-trend');
        if (subOcu) { subOcu.textContent = '+5%'; subOcu.className = 'kpi-trend kpi-trend--positive'; }

        // ── KPI 2: Ingresos Mensuales ──
        const elIng = document.getElementById('kpi-ingresos');
        const ingresos = 12500000; // Mockeado por ahora
        if (elIng) { elIng.classList.remove('loading-num'); elIng.textContent = '$' + ingresos.toLocaleString('es-CO'); }
        const subIng = document.getElementById('kpi-ingresos-trend');
        if (subIng) { subIng.textContent = '+12%'; subIng.className = 'kpi-trend kpi-trend--positive'; }

        // ── KPI 3: Satisfacción del Cliente ──
        const elSat = document.getElementById('kpi-satisfaccion');
        if (elSat) { elSat.classList.remove('loading-num'); elSat.textContent = '4.8/5'; }
        const subSat = document.getElementById('kpi-satisfaccion-trend');
        if (subSat) { subSat.textContent = '+0.2'; subSat.className = 'kpi-trend kpi-trend--positive'; }

        // ── KPI 4: Reservas Activas ──
        const elRes = document.getElementById('kpi-reservas');
        if (elRes) animarNumero(elRes, reservas.length);
        const subRes = document.getElementById('kpi-reservas-trend');
        if (subRes) { subRes.textContent = '+3'; subRes.className = 'kpi-trend kpi-trend--positive'; }

        // Renderizar gráficas
        renderGraficaCabanas(cabanas);
        renderGraficaClientes(clientes);
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
              <td style="text-align: center; font-weight: bold; color: rgba(255,255,255,0.4);">${index + 1}</td>
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
              <td style="text-align: center; font-weight: bold; color: rgba(255,255,255,0.4);">${index + 1}</td>
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
                    labels: { color: 'rgba(255,255,255,0.6)', padding: 20 }
                }
            },
            cutout: '70%'
        }
    });
}

function renderGraficaClientes(clientes) {
    const ctx = document.getElementById('grafica-clientes');
    if (!ctx) return;
    if (chartClientes) chartClientes.destroy();

    const activos = clientes.filter(c => c.Estado === 1).length;
    const inactivos = clientes.length - activos;

    chartClientes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Activos', 'Inactivos'],
            datasets: [{
                label: 'Clientes',
                data: [activos, inactivos],
                backgroundColor: ['#10b981', '#ef4444'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)' } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)' } }
            },
            plugins: { legend: { display: false } }
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
                    backgroundColor: '#e040fb',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.4)', stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.4)' } }
            },
            plugins: { 
                legend: { 
                    display: true,
                    position: 'top',
                    labels: { color: 'rgba(255,255,255,0.6)' }
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
        document.getElementById('detalleTitulo').textContent = 'Detalle de Usuario';

        content.innerHTML = `
            <div class="ver-cabana-info">
                <p>Información completa del usuario registrado en el sistema.</p>
                <div class="ver-cabana-datos">
                    <span><i data-lucide="user"></i> <b>Nombre:</b> ${data.NombreUsuario} ${data.Apellido || ''}</span>
                    <span><i data-lucide="mail"></i> <b>Email:</b> ${data.Email}</span>
                    <span><i data-lucide="phone"></i> <b>Teléfono:</b> ${data.Telefono || '—'}</span>
                    <span><i data-lucide="globe"></i> <b>País:</b> ${data.Pais || '—'}</span>
                    <span><i data-lucide="map-pin"></i> <b>Dirección:</b> ${data.Direccion || '—'}</span>
                    <span><i data-lucide="shield"></i> <b>Rol:</b> ${data.IDRol === 2 ? 'Administrador' : 'Cliente'}</span>
                    <span><i data-lucide="fingerprint"></i> <b>Documento:</b> ${data.TipoDocumento || ''} ${data.NumeroDocumento || ''}</span>
                    <span><i data-lucide="activity"></i> <b>Estado:</b> ${data.Estado === 1 ? 'Activo' : 'Inactivo'}</span>
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
                <div class="form-group">
                    <label>🏨 NOMBRE HABITACIÓN</label>
                    <input type="text" name="NombreHabitacion" value="${data?.NombreHabitacion || ''}" required>
                </div>
                <div class="form-group">
                    <label>📝 DESCRIPCIÓN</label>
                    <textarea name="Descripcion">${data?.Descripcion || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>💰 PRECIO</label>
                    <input type="number" name="precio" value="${data?.precio || data?.Precio || ''}" required>
                </div>
                <div class="form-group" style="text-align: center; margin-bottom: 1rem;">
                    <img id="preview-img-modal" src="${data?.imagen || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'}" alt="Preview" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                </div>
                <div class="form-group">
                    <label>🖼️ IMAGEN URL</label>
                    <input type="text" name="imagen" value="${data?.imagen || ''}" oninput="document.getElementById('preview-img-modal').src = this.value || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'">
                </div>
                <div class="form-group">
                    <label>⚙️ ESTADO</label>
                    <select name="Estado">
                        <option value="1" ${data?.Estado === 1 ? 'selected' : ''}>Disponible</option>
                        <option value="0" ${data?.Estado === 0 ? 'selected' : ''}>Mantenimiento</option>
                    </select>
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
                    <label>📞 TELÉFONO</label>
                    <input type="text" name="Telefono" value="${data?.Telefono || ''}" pattern="\\d+" title="Solo debe contener números.">
                    <span class="field-error" id="err-Telefono"></span>
                </div>
                <div class="form-group">
                    <label>📍 DIRECCIÓN</label>
                    <input type="text" name="Direccion" value="${data?.Direccion || ''}">
                </div>
                ${isEdit ? `<input type="hidden" name="Estado" value="${data?.Estado ?? 1}">` : ''}
                ${isEdit ? `<input type="hidden" name="IDRol" value="${data?.IDRol ?? 1}">` : ''}`;
            break;
        case 'cabanas':
            fields = `
                <div class="form-group">
                    <label>🏠 NOMBRE DE LA CABAÑA</label>
                    <input type="text" name="NombreCabana" value="${data?.NombreCabana || ''}" pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\\s]+" title="Solo debe contener letras y espacios." required>
                    <span class="field-error" id="err-NombreCabana"></span>
                </div>
                <div class="form-group">
                    <label>📝 DESCRIPCIÓN</label>
                    <textarea name="Descripcion" title="Solo debe contener letras y espacios.">${data?.Descripcion || ''}</textarea>
                    <span class="field-error" id="err-Descripcion"></span>
                </div>
                <div class="form-group">
                    <label>👥 CAPACIDAD DE PERSONAS</label>
                    <input type="text" name="CapacidadPersonas" value="${data?.CapacidadPersonas || ''}" pattern="\\d+" title="Solo debe contener números." required>
                    <span class="field-error" id="err-CapacidadPersonas"></span>
                </div>
                <div class="form-group">
                    <label>🚪 NÚMERO DE HABITACIONES</label>
                    <input type="text" name="NumeroHabitaciones" value="${data?.NumeroHabitaciones || ''}" pattern="\\d+" title="Solo debe contener números." required>
                    <span class="field-error" id="err-NumeroHabitaciones"></span>
                </div>
                <div class="form-group">
                    <label>💰 PRECIO POR NOCHE</label>
                    <input type="text" name="PrecioNoche" value="${data?.PrecioNoche || ''}" pattern="\\d+" title="Solo debe contener números." required>
                    <span class="field-error" id="err-PrecioNoche"></span>
                </div>
                <div class="form-group" style="text-align: center; margin-bottom: 1rem;">
                    <img id="preview-img-modal" src="${data?.ImagenCabana || 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=900&q=80'}" alt="Preview" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                </div>
                <div class="form-group">
                    <label>🖼️ IMAGEN URL</label>
                    <input type="text" name="ImagenCabana" value="${data?.ImagenCabana || ''}" oninput="document.getElementById('preview-img-modal').src = this.value || 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=900&q=80'">
                </div>
                ${isEdit ? `<input type="hidden" name="Estado" value="${data?.Estado ?? 1}">` : ''}`;
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
                ${!isEdit ? `
                <div class="form-group">
                    <label>🔒 CONTRASEÑA</label>
                    <input type="password" name="Contrasena" required>
                </div>` : ''}`;
            break;
        case 'paquetes':
            const selectedServices = (data?.IDServicio || '').toString().split(',');
            fields = `
                <div class="form-group">
                    <label>📦 NOMBRE PAQUETE</label>
                    <input type="text" name="NombrePaquete" value="${data?.NombrePaquete || ''}" required>
                </div>
                <div class="form-group">
                    <label>📝 DESCRIPCIÓN</label>
                    <textarea id="paquete-descripcion-admin" name="Descripcion" rows="4">${data?.Descripcion || data?.descripcion || ''}</textarea>
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
                <div class="form-group">
                    <label>🛠️ SERVICIOS INCLUIDOS</label>
                    <div id="checkboxes-servicios" style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                        ${(extra.servicios || []).map(s => `
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.9rem; margin: 0; padding: 4px; transition: background 0.2s; border-radius: 4px;">
                                <input type="checkbox" name="IDServicioCheckbox" value="${s.IDServicio}" data-precio="${s.precio || s.Costo || 0}" ${selectedServices.includes(s.IDServicio.toString()) ? 'checked' : ''} onchange="window.calcularPrecioPaquete()" style="width: 18px; height: 18px; accent-color: #6366f1; cursor: pointer;">
                                <span>${s.nombre || s.NombreServicio} <strong style="color: rgba(255,255,255,0.5); font-weight: normal;">($${Number(s.precio || s.Costo || 0).toLocaleString('es-CO')})</strong></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div style="background-color: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.1);">
                    <div class="form-group" style="margin: 0;">
                        <label style="display: flex; justify-content: space-between; align-items: center;">
                            <span>📉 DESCUENTO (%)</span>
                            <span style="font-size: 0.8rem; color: #10b981; font-weight: normal;">(Se aplica al elegir 2 o más servicios)</span>
                        </label>
                        <input type="number" name="Descuento" id="input-descuento" value="${data?.Descuento || 0}" oninput="window.calcularPrecioPaquete()" min="0" max="100" step="any">
                        <input type="hidden" name="TipoDescuento" value="porcentaje">
                    </div>
                </div>
                <div class="form-group">
                    <label>💰 PRECIO FINAL AUTOMÁTICO</label>
                    <input type="number" name="precio" id="input-precio-final" value="${data?.precio || data?.Precio || 0}" required readonly style="background-color: rgba(255,255,255,0.05); color: #10b981; font-weight: bold;">
                </div>
                <div class="form-group" style="text-align: center; margin-bottom: 1rem;">
                    <img id="preview-img-modal" src="${data?.imagen || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=900&q=80'}" alt="Preview" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
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
                </div>`;
            break;
        case 'servicios':
            fields = `
                <div class="form-group">
                    <label>🛠️ NOMBRE SERVICIO</label>
                    <input type="text" name="NombreServicio" value="${data?.NombreServicio || ''}" required>
                </div>
                <div class="form-group">
                    <label>📝 DESCRIPCIÓN</label>
                    <textarea name="Descripcion">${data?.Descripcion || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>⏱️ DURACIÓN</label>
                    <input type="text" name="Duracion" value="${data?.Duracion || ''}" placeholder="Ej: 2 horas">
                </div>
                <div class="form-group">
                    <label>👥 MÁX. PERSONAS</label>
                    <input type="number" name="CantidadMaximaPersonas" value="${data?.CantidadMaximaPersonas || ''}">
                </div>
                <div class="form-group">
                    <label>💰 PRECIO</label>
                    <input type="number" name="precio" value="${data?.precio || data?.Costo || ''}" required>
                </div>
                <div class="form-group" style="text-align: center; margin-bottom: 1rem;">
                    <img id="preview-img-modal" src="${data?.imagen || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80'}" alt="Preview" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                </div>
                <div class="form-group">
                    <label>🖼️ IMAGEN URL</label>
                    <input type="text" name="imagen" value="${data?.imagen || ''}" oninput="document.getElementById('preview-img-modal').src = this.value || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80'">
                </div>
                <div class="form-group">
                    <label>⚙️ ESTADO</label>
                    <select name="Estado">
                        <option value="1" ${data?.Estado === 1 ? 'selected' : ''}>Activo</option>
                        <option value="0" ${data?.Estado === 0 ? 'selected' : ''}>Inactivo</option>
                    </select>
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
            if (body.Descripcion && !letrasEspaciosRegex.test(body.Descripcion)) {
                marcarError('Descripcion', 'Solo debe contener letras y espacios.');
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
