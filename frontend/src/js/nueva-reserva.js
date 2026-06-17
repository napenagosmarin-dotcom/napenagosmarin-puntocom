// Verificar sesión
const userData = localStorage.getItem('user');
if (!userData) window.location.href = '/src/pages/login.html';
const user = JSON.parse(userData);
const isAdminEmbed = new URLSearchParams(window.location.search).get('admin') === '1';

// Set user name and logout after components are loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = `Hola, ${user.NombreUsuario}`;
    }, 100);
});

// Data global
let habitacionesData = [];
let cabanasData = [];
let paquetesData = [];
let serviciosData = [];
let allReservations = [];
let fpStart = null;
let fpEnd = null;

/* -----------------------------------------------
   UTILIDADES DE FECHA
   ----------------------------------------------- */
function getTodayInputValue() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function getTomorrowInputValue() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
}

function formatDateForInput(value) {
    if (!value) return '';
    return value.split('T')[0];
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getServicioControlInfo(servicio) {
    const nombre = String(servicio.NombreServicio || servicio.nombre || '').toLowerCase();
    const maxPersonas = servicio.CantidadMaximaPersonas || servicio.cantidadMaximaPersonas || 0;
    const control = {
        label: 'Cantidad',
        min: 1,
        max: 10,
        step: 1,
        unit: 'unidades',
        isPersonas: false
    };

    if (nombre.includes('cabalgata') || nombre.includes('tour') || nombre.includes('masaje') || nombre.includes('guía') || nombre.includes('guia') || nombre.includes('spa')) {
        control.label = 'Personas';
        control.unit = 'personas';
        control.isPersonas = true;
        control.max = Math.max(maxPersonas, 10);
    } else if (nombre.includes('botella')) {
        control.label = 'Cantidad';
        control.unit = 'botellas';
        control.max = Math.max(maxPersonas, 10);
    } else if (nombre.includes('decoración') || nombre.includes('decoracion') || nombre.includes('romántica') || nombre.includes('romantica')) {
        control.label = 'Paquetes';
        control.unit = 'paquetes';
        control.max = Math.max(maxPersonas, 5);
    } else if (nombre.includes('desayuno')) {
        control.label = 'Cantidad';
        control.unit = 'desayunos';
        control.max = Math.max(maxPersonas, 10);
    } else if (nombre.includes('lavander')) {
        control.label = 'Cantidad';
        control.unit = 'servicios';
        control.max = Math.max(maxPersonas, 10);
    } else if (nombre.includes('traslado') || nombre.includes('transporte')) {
        control.label = 'Cantidad';
        control.unit = 'traslados';
        control.max = Math.max(maxPersonas, 10);
    } else if (nombre.includes('wifi')) {
        control.label = 'Cantidad';
        control.unit = 'paquetes';
        control.max = Math.max(maxPersonas, 1);
    } else if (nombre.includes('descuento') || nombre.includes('adicional')) {
        control.max = Math.max(maxPersonas, 5);
    } else {
        control.max = Math.max(maxPersonas, 10);
    }

    return control;
}

function getServicioInfo(servicio) {
    const nombre = String(servicio.NombreServicio || servicio.nombre || '').trim();
    const nombreLlave = nombre.toLowerCase();
    const baseDescription = servicio.Descripcion || servicio.descripcion || '';
    const duracion = servicio.Duracion || servicio.duracion || '';
    const personas = servicio.CantidadMaximaPersonas || servicio.cantidadMaximaPersonas || '';

    const info = {
        description: baseDescription || `Servicio adicional de ${nombre} para mejorar tu experiencia.`,
        includes: [],
        duration: duracion,
        people: personas ? `${personas} persona${personas === 1 ? '' : 's'}` : '',
        conditions: ''
    };

    if (nombreLlave.includes('desayuno')) {
        info.description = baseDescription || 'Desayuno completo servido con productos frescos y regionales para empezar el día con energía.';
        info.includes = ['Café de origen nacional', 'Jugo natural', 'Panadería artesanal', 'Frutas de temporada'];
        info.duration = info.duration || 'Servicio entre 7:00 y 10:00';
        info.people = info.people || '1-2 personas';
        info.conditions = 'Solicitar con al menos 4 horas de anticipación. Disponible en el comedor o trayecto a la habitación.';
    } else if (nombreLlave.includes('lavander')) {
        info.description = baseDescription || 'Servicio rápido de lavandería para prendas ligeras con planchado incluido.';
        info.includes = ['Lavado y secado', 'Planchado de prendas seleccionadas', 'Entrega en el alojamiento', 'Limpieza de ropa personal'];
        info.duration = info.duration || '8-12 horas';
        info.people = info.people || 'Hasta 4 prendas por servicio';
        info.conditions = 'Recoger ropa antes de las 11:00 para entrega el mismo día.';
    } else if (nombreLlave.includes('traslado') || nombreLlave.includes('transporte')) {
        info.description = baseDescription || 'Traslado privado con chofer desde y hacia el aeropuerto o puntos clave del destino.';
        info.includes = ['Vehículo privado', 'Chofer local', 'Maletero asistido', 'Cobertura de hasta 3 paradas'];
        info.duration = info.duration || 'Variable según ruta';
        info.people = info.people || 'Hasta 4 personas';
        info.conditions = 'Confirmar ubicación de recogida con 24 horas de anticipación.';
    } else if (nombreLlave.includes('spa')) {
        info.description = baseDescription || 'Acceso a circuito de spa con jacuzzi, vapor y relajación guiada.';
        info.includes = ['Jacuzzi', 'Sala de vapor', 'Toallas premium', 'Snacks saludables'];
        info.duration = info.duration || '90 minutos';
        info.people = info.people || '1 persona';
        info.conditions = 'Reservar con anticipación. Inclusión de horario sujeto a disponibilidad.';
    } else if (nombreLlave.includes('masaje')) {
        info.description = baseDescription || 'Masaje relajante con técnicas de aromaterapia para liberar tensiones.';
        info.includes = ['Masaje de 60 minutos', 'Aromaterapia', 'Aceites naturales', 'Toalla y ambientación'];
        info.duration = info.duration || '60 minutos';
        info.people = info.people || '1 persona';
        info.conditions = 'Disponible en la sala de masajes o en la habitación. Reservar con 6 horas de anticipación.';
    } else if (nombreLlave.includes('cena') || nombreLlave.includes('romántica')) {
        info.description = baseDescription || 'Cena privada con menú de tres tiempos y decoración especial para una velada inolvidable.';
        info.includes = ['Entrada, plato principal y postre', 'Decoración romántica', 'Bebida de cortesía', 'Atención personalizada'];
        info.duration = info.duration || '120 minutos';
        info.people = info.people || '2 personas';
        info.conditions = 'Disponible a partir de las 19:00. Confirmar al menos 24 horas antes.';
    } else if (nombreLlave.includes('tour') || nombreLlave.includes('excursión')) {
        info.description = baseDescription || 'Excursión guiada por los puntos naturales más destacados con actividades incluidas.';
        info.includes = ['Guía local', 'Ruta segura', 'Bebida hidratante', 'Actividades en el sendero'];
        info.duration = info.duration || '3-4 horas';
        info.people = info.people || 'Hasta 6 personas';
        info.conditions = 'Calzado cómodo recomendado. Cancelación gratuita 6 horas antes.';
    } else if (nombreLlave.includes('wifi')) {
        info.description = baseDescription || 'Conexión de internet premium para toda la familia sin límites de datos.';
        info.includes = ['Velocidad estable', 'Soporte técnico', 'Conexión para múltiples dispositivos'];
        info.duration = info.duration || '24 horas';
        info.people = info.people || 'Para todo el alojamiento';
        info.conditions = 'Disponible solo en áreas con cobertura óptima.';
    } else if (nombreLlave.includes('guía') || nombreLlave.includes('guia')) {
        info.description = baseDescription || 'Guía experto local que acompaña el recorrido, comparte historia y recomendaciones especiales.';
        info.includes = ['Guía bilingüe', 'Rutas personalizadas', 'Recomendaciones locales', 'Pausas fotográficas'];
        info.duration = info.duration || '4 horas';
        info.people = info.people || 'Hasta 8 personas';
        info.conditions = 'Requiere confirmación de fecha y hora con 12 horas de antelación.';
    } else {
        info.includes = info.includes.length > 0 ? info.includes : ['Atención personalizada', 'Calidad garantizada', 'Disponibilidad sujeta a confirmación'];
        if (!info.duration) info.duration = 'Duración según el servicio';
        if (!info.people) info.people = 'A consultar según servicio';
    }

    return info;
}

function renderServicioTooltip(info) {
    return `
        <div class="servicio-desc">${info.description}</div>
        <div class="servicio-meta-grid">
            ${info.duration ? `<div><span class="meta-label">Duración:</span> ${info.duration}</div>` : ''}
            ${info.people ? `<div><span class="meta-label">Personas:</span> ${info.people}</div>` : ''}
        </div>
        <div class="servicio-meta-section">
            <strong>Incluye:</strong>
            <ul class="servicio-includes">
                ${info.includes.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        ${info.conditions ? `<div class="servicio-conditions"><strong>Condiciones especiales:</strong> ${info.conditions}</div>` : ''}
    `;
}

/* -----------------------------------------------
   CONTADOR DE NOCHES (nuevo)
   ----------------------------------------------- */
function actualizarContadorNoches() {
    const inicio = document.getElementById('FechaInicio').value;
    const fin = document.getElementById('FechaFinalizacion').value;
    const badge = document.getElementById('contadorNoches');
    const numEl = document.getElementById('numNoches');
    const resumenFechas = document.getElementById('resumenFechas');
    const resumenCheckin = document.getElementById('resumenCheckin');
    const resumenCheckout = document.getElementById('resumenCheckout');

    if (!inicio || !fin || fin <= inicio) {
        if (badge) badge.style.display = 'none';
        if (resumenFechas) resumenFechas.style.display = 'none';
        return 0;
    }

    const diffMs = new Date(fin) - new Date(inicio);
    const noches = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (noches >= 1 && badge && numEl) {
        numEl.textContent = noches;
        badge.style.display = 'inline-flex';
        if (resumenFechas && resumenCheckin && resumenCheckout) {
            resumenCheckin.textContent = inicio;
            resumenCheckout.textContent = fin;
            resumenFechas.style.display = 'block';
        }
    } else {
        if (badge) badge.style.display = 'none';
        if (resumenFechas) resumenFechas.style.display = 'none';
    }

    return noches >= 1 ? noches : 0;
}

/* -----------------------------------------------
   DESGLOSE DEL RESUMEN DE PAGO (nuevo)
   ----------------------------------------------- */
function actualizarDesglose() {
    const container = document.getElementById('resumenDesglose');
    if (!container) return;

    const items = [];
    const noches = actualizarContadorNoches();

    // Habitación
    const habitacionSelect = document.getElementById('IDHabitacion');
    if (habitacionSelect.value) {
        const h = habitacionesData.find(h => String(h.IDHabitacion) === String(habitacionSelect.value));
        if (h) {
            const precioPorNoche = parseFloat(h.Costo || h.precio || 0);
            const subtotal = noches > 0 ? precioPorNoche * noches : 0;
            const label = `${h.NombreHabitacion}`;
            const detail = noches > 0 
                ? `$${formatCurrency(precioPorNoche)}/noche × ${noches} ${noches === 1 ? 'noche' : 'noches'}` 
                : '';
            items.push({ name: label, val: subtotal, detail, type: 'accommodation' });
        }
    }

    // Cabaña
    const cabanaSelect = document.getElementById('IDCabana');
    if (cabanaSelect.value) {
        const c = cabanasData.find(c => String(c.IDCabana) === String(cabanaSelect.value));
        if (c) {
            const precioPorNoche = parseFloat(c.PrecioNoche || 0);
            const subtotal = noches > 0 ? precioPorNoche * noches : 0;
            const label = `${c.NombreCabana}`;
            const detail = noches > 0 
                ? `$${formatCurrency(precioPorNoche)}/noche × ${noches} ${noches === 1 ? 'noche' : 'noches'}` 
                : '';
            items.push({ name: label, val: subtotal, detail, type: 'accommodation' });
        }
    }

    // Paquete
    const paqueteSelect = document.getElementById('IDPaquete');
    if (paqueteSelect.value) {
        const p = paquetesData.find(p => String(p.IDPaquete) === String(paqueteSelect.value));
        if (p) {
            const precioPorNoche = parseFloat(p.Precio || p.precio || 0);
            const subtotal = noches > 0 ? precioPorNoche * noches : 0;
            const label = p.NombrePaquete || p.nombre || 'Paquete';
            const detail = noches > 0 
                ? `$${formatCurrency(precioPorNoche)}/noche × ${noches} ${noches === 1 ? 'noche' : 'noches'}` 
                : '';
            items.push({ name: label, val: subtotal, detail, type: 'accommodation' });
        }
    }

    // Servicios seleccionados
    document.querySelectorAll('.servicio-check:checked').forEach(cb => {
        const s = serviciosData.find(s => String(s.IDServicio) === String(cb.value));
        if (s) {
            const cantidad = getServicioQuantity(s.IDServicio);
            const costo = parseFloat(cb.dataset.costo || 0);
            const total = cantidad * costo;
            const control = getServicioControlInfo(s);
            const unidad = cantidad === 1 ? control.unit.replace(/s$/, '') : control.unit;
            const detail = `${cantidad} ${unidad} × $${formatCurrency(costo)}`;
            items.push({ name: `+ ${s.NombreServicio || s.nombre}`, val: total, detail, type: 'service' });
        }
    });

    // Renderizar desglose
    if (items.length === 0) {
        container.innerHTML = '<p style="font-size:0.78rem;color:rgba(255,255,255,0.3);margin:0;">Selecciona un alojamiento para ver el desglose.</p>';
    } else {
        container.innerHTML = items.map((i, idx) => `
            <div class="nr-resumen__item ${i.type === 'accommodation' ? 'accommodation-item' : 'service-item'}">
                <div>
                    <span class="nr-resumen__item-name">${i.name}</span>
                    ${i.detail ? `<div class="nr-resumen__item-details">${i.detail}</div>` : ''}
                </div>
                <span class="nr-resumen__item-val">$${formatCurrency(i.val)}</span>
            </div>
            ${idx < items.length - 1 && items[idx + 1].type !== i.type ? '<div style="border-bottom: 1px solid rgba(255,255,255,0.1); margin: 0.5rem 0;"></div>' : ''}
        `).join('');
    }
}

/* -----------------------------------------------
   SUBTOTAL PARCIAL DE SERVICIOS (nuevo)
   ----------------------------------------------- */
function actualizarSubtotalServicios() {
    const checked = document.querySelectorAll('.servicio-check:checked');
    const total = Array.from(checked).reduce((sum, cb) => {
        const cantidad = getServicioQuantity(cb.value);
        return sum + (parseFloat(cb.dataset.costo || 0) * cantidad);
    }, 0);
    const el = document.getElementById('serviciosSubtotal');
    const valEl = document.getElementById('serviciosSubtotalVal');
    if (!el || !valEl) return;
    if (checked.length > 0) {
        valEl.textContent = `$${formatCurrency(total)}`;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

/* -----------------------------------------------
   CARGA DE DATOS
   ----------------------------------------------- */
async function cargarHabitaciones() {
    try {
        const response = await fetch('/api/habitaciones');
        habitacionesData = await response.json();
        const select = document.getElementById('IDHabitacion');
        select.innerHTML = '<option value="">Seleccione una habitación</option>';
        habitacionesData.forEach(h => {
            if (h.Estado === 1) {
                const option = document.createElement('option');
                option.value = h.IDHabitacion;
                const costoH = h.Costo || h.precio || 0;
                option.textContent = `${h.NombreHabitacion || h.nombre} - $${costoH.toLocaleString()}`;
                option.dataset.costo = costoH;
                select.appendChild(option);
            }
        });
    } catch (e) { console.error('Error cargando habitaciones:', e); }
}

async function cargarCabanas() {
    try {
        const response = await fetch('/api/cabanas');
        cabanasData = await response.json();
        const select = document.getElementById('IDCabana');
        cabanasData.forEach(c => {
            if (c.Estado === 1) {
                const option = document.createElement('option');
                option.value = c.IDCabana;
                const precioC = c.PrecioNoche || 0;
                option.textContent = `${c.NombreCabana} - $${precioC.toLocaleString()}`;
                option.dataset.costo = precioC;
                select.appendChild(option);
            }
        });
    } catch (e) { console.error('Error cargando cabañas:', e); }
}

async function cargarPaquetes(selectedRoomId = null) {
    const response = await fetch('/api/paquetes');
    paquetesData = await response.json();
    populatePaquetes(selectedRoomId);
}

function populatePaquetes(selectedRoomId = null, isDisabled = false) {
    const select = document.getElementById('IDPaquete');
    select.innerHTML = '<option value="">Seleccione un paquete</option>';
    const filteredPaquetes = selectedRoomId
        ? paquetesData.filter(p => String(p.IDHabitacion) === String(selectedRoomId) && p.Estado === 1)
        : paquetesData.filter(p => p.Estado === 1);
    filteredPaquetes.forEach(p => {
        const option = document.createElement('option');
        option.value = p.IDPaquete;
        const precioP = p.Precio || p.precio || 0;
        option.textContent = `${p.NombrePaquete || p.nombre} - $${precioP.toLocaleString()}`;
        option.dataset.precio = precioP;
        option.disabled = isDisabled;
        select.appendChild(option);
    });
    if (selectedRoomId && filteredPaquetes.length === 0) {
        select.innerHTML += '<option value="">No hay paquetes disponibles</option>';
    }
    select.disabled = isDisabled;
}

function updateSelectStates() {
    const habitacionSelect = document.getElementById('IDHabitacion');
    const cabanaSelect = document.getElementById('IDCabana');
    const paqueteSelect = document.getElementById('IDPaquete');

    const hSelected = habitacionSelect.value !== '';
    const cSelected = cabanaSelect.value !== '';
    const pSelected = paqueteSelect.value !== '';

    if (hSelected) {
        cabanaSelect.disabled = true; cabanaSelect.value = '';
        paqueteSelect.disabled = true; paqueteSelect.value = '';
    } else if (cSelected) {
        habitacionSelect.disabled = true; habitacionSelect.value = '';
        paqueteSelect.disabled = true; paqueteSelect.value = '';
    } else if (pSelected) {
        cabanaSelect.disabled = true; cabanaSelect.value = '';
        habitacionSelect.disabled = true; habitacionSelect.value = '';
    } else {
        habitacionSelect.disabled = false;
        cabanaSelect.disabled = false;
        paqueteSelect.disabled = false;
        populatePaquetes(null, false);
    }
}

async function cargarServicios() {
    const container = document.getElementById('serviciosContainer');
    if (!container) return;
    container.innerHTML = '<p class="nr-loading">Cargando servicios adicionales...</p>';

    try {
        const response = await fetch('/api/servicios');
        if (!response.ok) throw new Error(`Servicios API error: ${response.status}`);
        const servicios = await response.json();
        serviciosData = servicios.filter(s => s.Estado === 1).map(s => ({
            ...s,
            NombreServicio: s.NombreServicio || s.nombre || 'Servicio adicional',
            Costo: Number(s.Costo || s.precio || 0),
            Cantidad: 1
        }));

        container.innerHTML = '';
        if (serviciosData.length === 0) {
            container.innerHTML = '<p class="nr-empty">No hay servicios adicionales disponibles por el momento.</p>';
            return;
        }

        serviciosData.forEach(s => {
            const div = document.createElement('div');
            div.className = 'servicio-item';
            div.dataset.servicioId = s.IDServicio;
            const nombre = s.NombreServicio;
            const info = getServicioInfo(s);
            const control = getServicioControlInfo(s);
            div.innerHTML = `
                <label class="servicio-label">
                    <input type="checkbox" class="servicio-check" value="${s.IDServicio}" data-costo="${s.Costo}">
                    <div class="servicio-main">
                        <div class="servicio-header">
                            <span class="servicio-name">${nombre}</span>
                            <span class="servicio-price">$${formatCurrency(s.Costo)}</span>
                        </div>
                        <div class="servicio-extra">
                            <div class="servicio-controls">
                                <label class="servicio-control-label">${control.label}</label>
                                <div class="servicio-input-row">
                                    <input
                                        type="number"
                                        class="servicio-quantity-input"
                                        data-servicio-id="${s.IDServicio}"
                                        min="${control.min}"
                                        max="${control.max}"
                                        step="${control.step}"
                                        value="1"
                                        aria-label="${control.label} para ${nombre}"
                                        disabled
                                    />
                                    <span class="servicio-input-suffix">${control.unit}</span>
                                </div>
                                <div class="servicio-help" aria-live="polite"></div>
                            </div>
                            <div class="servicio-total" data-servicio-id="${s.IDServicio}">Total: $${formatCurrency(s.Costo)}</div>
                        </div>
                    </div>
                </label>
                <button type="button" class="servicio-info-btn" aria-label="Más información de ${nombre}">
                    <span>i</span>
                </button>
                <div class="servicio-tooltip" aria-hidden="true">
                    ${renderServicioTooltip(info)}
                </div>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error cargando servicios adicionales:', error);
        container.innerHTML = '<p class="nr-empty">No se pudieron cargar los servicios adicionales. Intenta recargar la página.</p>';
    }
}

function getServicioQuantity(servicioId) {
    const input = document.querySelector(`.servicio-quantity-input[data-servicio-id="${servicioId}"]`);
    const service = serviciosData.find(s => String(s.IDServicio) === String(servicioId));
    const control = service ? getServicioControlInfo(service) : { min: 1, max: 1 };
    if (!input) return control.min;

    let value = parseInt(input.value, 10);
    if (Number.isNaN(value)) value = control.min;
    if (value < control.min) value = control.min;
    if (value > control.max) value = control.max;
    input.value = value;
    return value;
}

function updateServicioTotal(servicioId) {
    const item = document.querySelector(`.servicio-item[data-servicio-id="${servicioId}"]`);
    const service = serviciosData.find(s => String(s.IDServicio) === String(servicioId));
    if (!item || !service) return;
    const quantity = getServicioQuantity(servicioId);
    const total = quantity * Number(service.Costo || 0);
    const totalEl = item.querySelector(`.servicio-total[data-servicio-id="${servicioId}"]`);
    if (totalEl) {
        totalEl.textContent = `Total: $${formatCurrency(total)}`;
    }
}

function toggleServicioDetails(servicioId, isActive) {
    const item = document.querySelector(`.servicio-item[data-servicio-id="${servicioId}"]`);
    if (!item) return;
    item.classList.toggle('active', isActive);
    const quantityInput = item.querySelector('.servicio-quantity-input');
    if (quantityInput) {
        quantityInput.disabled = !isActive;
        if (!isActive) {
            quantityInput.value = 1;
            const help = item.querySelector('.servicio-help');
            if (help) help.textContent = '';
        }
    }
    if (!isActive) {
        item.classList.remove('tooltip-open');
    }
    updateServicioTotal(servicioId);
}

async function cargarMetodosPago() {
    const response = await fetch('/api/metodopago');
    const metodos = await response.json();
    const select = document.getElementById('MetodoPago');
    const metodosPermitidos = metodos.filter(m => {
        const nombre = (m.NomMetodoPago || '').toLowerCase();
        return nombre.includes('efectivo') || nombre.includes('transferencia');
    });
    metodosPermitidos.forEach(m => {
        const option = document.createElement('option');
        option.value = m.IdMetodoPago;
        option.textContent = m.NomMetodoPago;
        select.appendChild(option);
    });
}

async function cargarAllReservations() {
    // Esta función ya no se usa, se mantiene por compatibilidad
    allReservations = [];
}

// Cargar reservas confirmadas por alojamiento (nuevo)
async function cargarReservasConfirmadasPorAlojamiento(accommodationId, type = 'habitacion') {
    try {
        if (!accommodationId) return [];
        const url = `/api/reservas/confirmed/accommodation/${accommodationId}?type=${type}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`No se pudieron cargar reservas confirmadas: ${response.status}`);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error('Error cargando reservas confirmadas:', error);
        return [];
    }
}

/* -----------------------------------------------
   FECHAS Y DISPONIBILIDAD
   ----------------------------------------------- */
function getDisabledDatesForRoom(roomId) {
    if (!roomId) return [];
    const blockedRanges = getRoomBlockedRanges(roomId);
    const disabledDates = [];
    blockedRanges.forEach(range => {
        const startDate = new Date(range.start);
        const endDate = new Date(range.end);
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            disabledDates.push(formatDateForInput(currentDate.toISOString()));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });
    return disabledDates;
}

async function updateDatePickerRestrictions() {
    const roomId = getSelectedRoomId();
    const accommodationType = getSelectedAccommodationType();
    
    // Cargar reservas confirmadas solo para el alojamiento seleccionado
    const confirmedReservations = roomId 
        ? await cargarReservasConfirmadasPorAlojamiento(roomId, accommodationType)
        : [];
    
    // Actualizar la variable global para uso en validaciones
    allReservations = confirmedReservations;
    
    const disabledDates = getDisabledDatesForRoom(roomId);
    const today = getTodayInputValue();
    
    if (fpStart) { 
        fpStart.set('disable', disabledDates); 
        fpStart.set('minDate', today); 
    }
    if (fpEnd) { 
        fpEnd.set('disable', disabledDates); 
        fpEnd.set('minDate', today); 
    }
}

function getSelectedRoomId() {
    const habitacionSelect = document.getElementById('IDHabitacion');
    const paqueteSelect = document.getElementById('IDPaquete');
    const cabanaSelect = document.getElementById('IDCabana');
    
    if (habitacionSelect.value !== '') return habitacionSelect.value;
    if (paqueteSelect.value !== '') {
        const paquete = paquetesData.find(p => String(p.IDPaquete) === String(paqueteSelect.value));
        return paquete ? paquete.IDHabitacion : null;
    }
    if (cabanaSelect.value !== '') return cabanaSelect.value;
    return null;
}

function getSelectedAccommodationType() {
    const habitacionSelect = document.getElementById('IDHabitacion');
    const paqueteSelect = document.getElementById('IDPaquete');
    const cabanaSelect = document.getElementById('IDCabana');
    
    if (habitacionSelect.value !== '') return 'habitacion';
    if (paqueteSelect.value !== '') return 'paquete';
    if (cabanaSelect.value !== '') return 'cabana';
    return 'habitacion';
}

function getRoomBlockedRanges(roomId) {
    if (!roomId) return [];
    return allReservations
        .filter(r => String(r.IDHabitacion || r.IDAccommodation) === String(roomId) && r.FechaInicio && r.FechaFinalizacion)
        .map(r => ({ 
            start: formatDateForInput(r.FechaInicio), 
            end: formatDateForInput(r.FechaFinalizacion) 
        }));
}

function isRangeOverlapping(start, end, range) {
    return !(end < range.start || start > range.end);
}

function updateDateLimits() {
    const today = getTodayInputValue();
    document.getElementById('FechaInicio').min = today;
    document.getElementById('FechaFinalizacion').min = today;
}

function updateAvailabilityMessage() {
    const roomId = getSelectedRoomId();
    const messageEl = document.getElementById('dateAvailabilityMessage');
    const blockedRanges = getRoomBlockedRanges(roomId);
    
    if (!messageEl) return;

    if (!roomId) {
        messageEl.innerHTML = '<em>Selecciona una habitación, cabaña o paquete para ver las fechas disponibles.</em>';
        messageEl.style.color = 'rgba(255, 255, 255, 0.6)';
        return;
    }

    if (blockedRanges.length === 0) {
        messageEl.innerHTML = '<strong style="color: #7BFF4F;">✓ Disponible:</strong> Esta habitación está completamente disponible para el período seleccionado.';
        messageEl.style.color = '#ffffff';
        return;
    }

    const rangesText = blockedRanges.map(r => {
        const startDate = new Date(r.start);
        const endDate = new Date(r.end);
        const startFormatted = startDate.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
        const endFormatted = endDate.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
        return `${startFormatted} - ${endFormatted}`;
    }).join('; ');

    messageEl.innerHTML = `<strong style="color: #FF6B6B;">⚠ Fechas ocupadas:</strong> ${rangesText}`;
    messageEl.style.color = '#ffffff';
}

function validateDateSelection() {
    const roomId = getSelectedRoomId();
    const startInput = document.getElementById('FechaInicio');
    const endInput = document.getElementById('FechaFinalizacion');
    const startValue = startInput.value;
    const endValue = endInput.value;
    const today = getTodayInputValue();
    const blockedRanges = getRoomBlockedRanges(roomId);
    let startError = '';
    let endError = '';

    // Validación 1: Fechas no pueden ser antes de hoy
    if (startValue && startValue < today) {
        startError = 'La fecha de inicio no puede ser anterior a hoy.';
    }
    if (endValue && endValue < today) {
        endError = 'La fecha de finalización no puede ser anterior a hoy.';
    }

    // Validación 2: Fecha final debe ser posterior a la inicial
    if (startValue && endValue && endValue <= startValue) {
        endError = 'La fecha de finalización debe ser al menos el día siguiente al de inicio.';
    }

    // Validación 3: Chequear superposición con reservas confirmadas
    if (roomId && startValue && endValue) {
        // Chequear si el rango completo se superpone con alguna reserva confirmada
        if (blockedRanges.some(r => isRangeOverlapping(startValue, endValue, r))) {
            startError = 'El rango de fechas seleccionadas se superpone con una reserva confirmada.';
            endError = 'El rango de fechas seleccionadas se superpone con una reserva confirmada.';
        }
    } else if (roomId && startValue) {
        // Si solo está la fecha de inicio, validar que no esté en rango ocupado
        if (blockedRanges.some(r => isRangeOverlapping(startValue, startValue, r))) {
            startError = 'Esta fecha está ocupada. Por favor selecciona otra.';
        }
    } else if (roomId && endValue) {
        // Si solo está la fecha final, validar que no esté en rango ocupado
        if (blockedRanges.some(r => isRangeOverlapping(endValue, endValue, r))) {
            endError = 'Esta fecha está ocupada. Por favor selecciona otra.';
        }
    }

    startInput.setCustomValidity(startError);
    endInput.setCustomValidity(endError);
    startInput.reportValidity();
    endInput.reportValidity();
    return !startInput.validationMessage && !endInput.validationMessage;
}

/* -----------------------------------------------
   DETALLES DE ALOJAMIENTO
   ----------------------------------------------- */
function mostrarDetalleHabitacion(id) {
    const card = document.getElementById('detalleHabitacion');
    if (!id) { card.style.display = 'none'; return; }
    const h = habitacionesData.find(h => h.IDHabitacion == id);
    if (!h) return;
    const iconos = {
        'Cabaña Simple': ['🌲 Vista al bosque', '🛏️ Cama individual', '🪵 Decoración rústica', '👤 Ideal para 1 persona'],
        'Cabaña Doble': ['🌹 Ambiente romántico', '🛏️ Cama doble', '🪵 Decoración rústica', '👥 Ideal para 2 personas'],
        'Cabaña Familiar': ['🌿 Rodeada de naturaleza', '🛏️ Múltiples camas', '🪵 Amplio espacio', '👨‍👩‍👧‍👦 Hasta 4 personas'],
        'Domo Glamping': ['⭐ Duerme bajo las estrellas', '🔭 Techo transparente', '🛏️ Cama queen', '💫 Experiencia única'],
        'Tienda de Lujo': ['🏔️ Vista panorámica', '👑 Cama king size', '✨ Acabados de lujo', '🌄 Amanecer espectacular']
    };
    const detalles = iconos[h.NombreHabitacion] || ['🏠 Alojamiento confortable', '🌿 Contacto con la naturaleza'];
    card.innerHTML = `
        <h4>${h.NombreHabitacion}</h4>
        <p>${h.Descripcion}</p>
        ${detalles.map(d => `<p><span class="icon">✓</span> ${d}</p>`).join('')}
        <span class="precio-tag">$${h.Costo.toLocaleString()} / noche</span>
    `;
    card.style.display = 'block';
}

function mostrarDetallePaquete(id) {
    const card = document.getElementById('detallePaquete');
    if (!id) { card.style.display = 'none'; return; }
    const p = paquetesData.find(p => p.IDPaquete == id);
    if (!p) return;

    const paqueteNombre = p.NombrePaquete || p.nombre || 'Paquete';
    const descripcion = p.Descripcion || p.descripcion || 'Paquete seleccionado.';
    const nombreHabitacion = p.NombreHabitacion || p.habitacion || 'Alojamiento';
    const precioPaquete = p.Precio || p.precio || 0;

    const incluidos = {
        'Paquete Romántico': ['🛁 Jacuzzi privado', '💆 Masaje relajante', '🍾 Decoración especial', '🌹 Detalles románticos'],
        'Paquete Aventura': ['🐴 Cabalgata guiada', '🥾 Caminata ecológica', '🗺️ Guía experto', '🌿 Tour por la naturaleza'],
        'Paquete Familiar': ['🍳 Desayuno campestre', '🔥 Fogata nocturna', '🎮 Actividades grupales', '👨‍👩‍👧‍👦 Espacio para todos'],
        'Paquete Estrellas': ['🔥 Fogata nocturna', '🍳 Desayuno incluido', '⭐ Observación de estrellas', '🌙 Experiencia nocturna'],
        'Paquete Relax': ['💆 Masaje completo', '🛁 Jacuzzi privado', '🧘 Zona de spa', '🌿 Desconexión total']
    };
    const items = incluidos[paqueteNombre] || ['✨ Experiencia glamping', '🌿 Contacto con naturaleza'];

    card.innerHTML = `
        <h4>${paqueteNombre}</h4>
        <p>${descripcion}</p>
        ${items.map(i => `<p><span class="icon">✓</span> ${i}</p>`).join('')}
        <p><span class="icon">✓</span> 🏠 ${nombreHabitacion}</p>
        <span class="precio-tag">$${Number(precioPaquete).toLocaleString()}</span>
    `;
    card.style.display = 'block';
}

function mostrarDetalleCabana(id) {
    const card = document.getElementById('detalleCabana');
    if (!id) { card.style.display = 'none'; return; }
    const c = cabanasData.find(c => c.IDCabana == id);
    if (!c) return;
    card.innerHTML = `
        <h4>${c.NombreCabana}</h4>
        <p>${c.Descripcion || 'Cabaña acogedora rodeada de naturaleza.'}</p>
        <p><span class="icon">👥</span> Capacidad: ${c.CapacidadPersonas} personas</p>
        <p><span class="icon">🛏️</span> Habitaciones: ${c.NumeroHabitaciones || 1}</p>
        <span class="precio-tag">$${c.PrecioNoche.toLocaleString()} / noche</span>
    `;
    card.style.display = 'block';
}

function getImageUrl(item) {
    if (!item) return '';
    if (item.Fotos && Array.isArray(item.Fotos) && item.Fotos.length > 0) return item.Fotos[0].url || item.Fotos[0];
    if (item.imagenes && Array.isArray(item.imagenes) && item.imagenes.length > 0) return item.imagenes[0].url || item.imagenes[0];
    return item.imagen || item.Imagen || item.ImagenCabana || item.imagenUrl || item.urlImagen || item.Foto || item.foto || '';
}

function handleClosePreview() {
    const preview = document.getElementById('previewCard');
    if (!preview) return;
    const type = preview.dataset.type;

    if (type === 'habitacion') {
        document.getElementById('IDHabitacion').value = '';
        mostrarDetalleHabitacion('');
        populatePaquetes(null, false);
        updateAvailabilityMessage();
        validateDateSelection();
        updateDatePickerRestrictions();
    }
    if (type === 'cabana') {
        document.getElementById('IDCabana').value = '';
    }

    preview.dataset.type = '';
    preview.dataset.activeId = '';
    preview.style.display = 'none';
    preview.innerHTML = '';

    calcularTotal();
    updateSelectStates();
}

async function mostrarPreviewItem(type, id) {
    const preview = document.getElementById('previewCard');
    if (!preview) return;
    if (!id) {
        preview.style.display = 'none';
        preview.innerHTML = '';
        preview.dataset.type = '';
        preview.dataset.activeId = '';
        return;
    }

    let data = null;
    if (type === 'habitacion') data = habitacionesData.find(h => String(h.IDHabitacion) === String(id));
    if (type === 'cabana') data = cabanasData.find(c => String(c.IDCabana) === String(id));

    const imgUrlCandidate = getImageUrl(data);
    if ((!imgUrlCandidate || imgUrlCandidate === '') && type === 'habitacion') {
        try {
            const res = await fetch(`/api/habitaciones/${id}`);
            if (res.ok) {
                const full = await res.json();
                if (full) data = Object.assign({}, data || {}, full);
            }
        } catch (err) { console.warn('No se pudo obtener detalles de habitación:', err); }
    }

    if (!data) {
        preview.style.display = 'none';
        preview.innerHTML = '';
        preview.dataset.type = '';
        preview.dataset.activeId = '';
        return;
    }

    const imgUrl = getImageUrl(data);
    const title = data.NombreHabitacion || data.NombreCabana || data.nombre || data.Nombre || 'Alojamiento';
    const descripcion = data.Descripcion || data.descripcion || data.descripcionCorta || '';
    const capacidad = data.CapacidadPersonas || data.Capacidad || data.CapacidadMaxima || '';
    const habitaciones = data.NumeroHabitaciones || data.Habitaciones || '';
    const precio = data.Costo || data.PrecioNoche || data.precio || data.Precio || 0;

    preview.innerHTML = `
        <button type="button" class="nr-preview-close" aria-label="Cerrar tarjeta" title="Cerrar tarjeta">×</button>
        <div class="nr-preview-card__inner">
            <div class="nr-preview-card__image" style="background-image: url('${imgUrl || '../assets/images/placeholder.jpg'}')"></div>
            <div class="nr-preview-card__content">
                <h3>${title}</h3>
                <p class="nr-preview-desc">${descripcion}</p>
                <div class="nr-preview-meta">
                    ${capacidad ? `<span>👥 ${capacidad} personas</span>` : ''}
                    ${habitaciones ? `<span>🛏️ ${habitaciones} hab.</span>` : ''}
                </div>
                <div class="nr-preview-price">$${Number(precio).toLocaleString()} / noche</div>
            </div>
        </div>
    `;
    preview.dataset.type = type;
    preview.dataset.activeId = String(id);
    preview.style.display = 'block';

    preview.querySelector('.nr-preview-close').addEventListener('click', handleClosePreview);

    // Ocultar detalles secundarios
    ['detalleHabitacion', 'detalleCabana', 'detallePaquete'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

/* -----------------------------------------------
   CALCULAR TOTAL + DESGLOSE
   ----------------------------------------------- */
function calcularTotal() {
    // Obtener cantidad de noches
    const noches = actualizarContadorNoches();
    
    // Si no hay noches seleccionadas, mostrar $0
    if (noches <= 0) {
        const animateValue = (elId, newVal) => {
            const el = document.getElementById(elId);
            if (el) {
                el.style.transition = 'opacity 0.15s ease';
                el.style.opacity = '0';
                setTimeout(() => {
                    el.textContent = `$${formatCurrency(newVal)}`;
                    el.style.opacity = '1';
                }, 120);
            }
        };
        animateValue('subtotal', 0);
        animateValue('iva', 0);
        animateValue('total', 0);
        actualizarDesglose();
        actualizarSubtotalServicios();
        return;
    }

    // Cálculo de alojamiento × noches
    let precioAlojamiento = 0;
    const paqueteSelect = document.getElementById('IDPaquete');
    if (paqueteSelect.value) {
        const p = paquetesData.find(p => String(p.IDPaquete) === String(paqueteSelect.value));
        if (p) {
            const precioPorNoche = parseFloat(p.Precio || p.precio || 0);
            precioAlojamiento = precioPorNoche * noches;
        }
    }

    const habitacionSelect = document.getElementById('IDHabitacion');
    if (habitacionSelect.value) {
        const h = habitacionesData.find(h => String(h.IDHabitacion) === String(habitacionSelect.value));
        if (h) {
            const precioPorNoche = parseFloat(h.Costo || h.precio || 0);
            precioAlojamiento = precioPorNoche * noches;
        }
    }

    const cabanaSelect = document.getElementById('IDCabana');
    if (cabanaSelect.value) {
        const c = cabanasData.find(c => String(c.IDCabana) === String(cabanaSelect.value));
        if (c) {
            const precioPorNoche = parseFloat(c.PrecioNoche || 0);
            precioAlojamiento = precioPorNoche * noches;
        }
    }

    // Cálculo de servicios adicionales
    const totalServicios = Array.from(document.querySelectorAll('.servicio-check:checked'))
        .reduce((sum, s) => sum + (parseFloat(s.dataset.costo) * getServicioQuantity(s.value)), 0);

    // Cálculo final
    const totalConIVA = precioAlojamiento + totalServicios;
    const subtotalSinIVA = Math.round((totalConIVA / 1.19) * 100) / 100;
    const ivaCalculado = Math.round((totalConIVA - subtotalSinIVA) * 100) / 100;

    // Transición suave en los valores
    const animateValue = (elId, newVal) => {
        const el = document.getElementById(elId);
        if (el) {
            el.style.transition = 'opacity 0.15s ease';
            el.style.opacity = '0';
            setTimeout(() => {
                el.textContent = `$${formatCurrency(newVal)}`;
                el.style.opacity = '1';
            }, 120);
        }
    };

    animateValue('subtotal', subtotalSinIVA);
    animateValue('iva', ivaCalculado);
    animateValue('total', totalConIVA);

    // Actualizar desglose y subtotal de servicios
    actualizarDesglose();
    actualizarSubtotalServicios();
}

/* -----------------------------------------------
   EVENTOS
   ----------------------------------------------- */
const habitacionInput = document.getElementById('IDHabitacion');
const paqueteInput = document.getElementById('IDPaquete');
const cabanaInput = document.getElementById('IDCabana');
const fechaInicioInput = document.getElementById('FechaInicio');
const fechaFinalizacionInput = document.getElementById('FechaFinalizacion');

habitacionInput.addEventListener('change', async (e) => {
    if (e.target.value !== '') { paqueteInput.value = ''; mostrarDetallePaquete(''); }
    mostrarPreviewItem('habitacion', e.target.value);
    populatePaquetes(e.target.value);
    calcularTotal();
    updateAvailabilityMessage();
    validateDateSelection();
    updateSelectStates();
    await updateDatePickerRestrictions();
});

cabanaInput.addEventListener('change', async (e) => {
    mostrarPreviewItem('cabana', e.target.value);
    calcularTotal();
    updateSelectStates();
    await updateDatePickerRestrictions();
});

paqueteInput.addEventListener('change', async (e) => {
    if (e.target.value !== '') {
        habitacionInput.value = '';
        mostrarDetalleHabitacion('');
        cabanaInput.value = '';
        mostrarDetalleCabana('');
    }
    mostrarDetallePaquete(e.target.value);
    calcularTotal();
    updateAvailabilityMessage();
    validateDateSelection();
    updateSelectStates();
    await updateDatePickerRestrictions();
});

fechaInicioInput.addEventListener('change', () => {
    let minDate = getTodayInputValue();
    if (fechaInicioInput.value) {
        const d = new Date(fechaInicioInput.value);
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        d.setDate(d.getDate() + 1);
        minDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    fechaFinalizacionInput.min = minDate;
    
    if (fechaFinalizacionInput.value && fechaFinalizacionInput.value <= fechaInicioInput.value) {
        fechaFinalizacionInput.value = '';
    }

    actualizarContadorNoches();
    calcularTotal();
    updateAvailabilityMessage();
    validateDateSelection();
});

fechaFinalizacionInput.addEventListener('change', () => {
    actualizarContadorNoches();
    calcularTotal();
    validateDateSelection();
});

document.addEventListener('change', (e) => {
    if (e.target.classList.contains('servicio-check')) {
        toggleServicioDetails(e.target.value, e.target.checked);
        calcularTotal();
        return;
    }

    if (e.target.classList.contains('servicio-quantity-input')) {
        const servicioId = e.target.dataset.servicioId;
        const service = serviciosData.find(s => String(s.IDServicio) === String(servicioId));
        const control = getServicioControlInfo(service || {});
        let quantity = parseInt(e.target.value, 10);
        if (Number.isNaN(quantity) || quantity < control.min) quantity = control.min;
        if (quantity > control.max) quantity = control.max;
        e.target.value = quantity;

        const help = e.target.closest('.servicio-item')?.querySelector('.servicio-help');
        if (help) {
            if (quantity === control.max) {
                help.textContent = `Máximo ${control.max} ${control.unit} permitidos.`;
            } else {
                help.textContent = '';
            }
        }

        if (e.target.closest('.servicio-item')?.querySelector('.servicio-check')?.checked) {
            updateServicioTotal(servicioId);
            calcularTotal();
        }
    }
});

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.servicio-info-btn');
    const servicioItem = e.target.closest('.servicio-item');

    if (btn) {
        const item = btn.closest('.servicio-item');
        if (!item) return;
        document.querySelectorAll('.servicio-item.tooltip-open').forEach(activeItem => {
            if (activeItem !== item) activeItem.classList.remove('tooltip-open');
        });
        item.classList.toggle('tooltip-open');
        return;
    }

    if (!servicioItem) {
        document.querySelectorAll('.servicio-item.tooltip-open').forEach(item => item.classList.remove('tooltip-open'));
    }
});

/* -----------------------------------------------
   ENVIAR FORMULARIO
   ----------------------------------------------- */
document.getElementById('reservationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateDateSelection()) return;

    const habitacionVal = document.getElementById('IDHabitacion').value;
    const cabanaVal = document.getElementById('IDCabana').value;
    const paqueteVal = document.getElementById('IDPaquete').value;
    const metodoPagoVal = document.getElementById('MetodoPago').value;

    if (!habitacionVal && !cabanaVal && !paqueteVal) {
        alert('Debes seleccionar un alojamiento (Habitación, Cabaña o Paquete).');
        return;
    }
    if (!metodoPagoVal) {
        alert('Debes seleccionar un método de pago.');
        return;
    }

    const serviciosSeleccionados = Array.from(document.querySelectorAll('.servicio-check:checked')).map(s => ({
        IDServicio: parseInt(s.value),
        Cantidad: getServicioQuantity(s.value)
    }));

    const data = {
        IDHabitacion: habitacionVal ? parseInt(habitacionVal) : null,
        IDCabana: cabanaVal ? parseInt(cabanaVal) : null,
        IDPaquete: paqueteVal ? parseInt(paqueteVal) : null,
        serviciosAdicionales: serviciosSeleccionados,
        FechaInicio: document.getElementById('FechaInicio').value,
        FechaFinalizacion: document.getElementById('FechaFinalizacion').value,
        MetodoPago: metodoPagoVal ? parseInt(metodoPagoVal) : null,
        UsuarioIdusuario: user.IDUsuario
    };

    try {
        const response = await fetch('/api/reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            alert('Reserva creada exitosamente');
            if (isAdminEmbed && window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'nuevaReservaSuccess' }, window.location.origin);
            } else {
                window.location.href = '/src/pages/reservas.html';
            }
        } else {
            const error = await response.json();
            alert(error.message || 'Error al crear la reserva');
        }
    } catch (error) {
        alert('Error de conexión');
    }
});

/* -----------------------------------------------
   INICIALIZAR
   ----------------------------------------------- */
(async function initializePage() {
    const loaders = [
        cargarHabitaciones(),
        cargarCabanas(),
        cargarPaquetes(),
        cargarServicios(),
        cargarMetodosPago()
    ];

    const results = await Promise.allSettled(loaders);
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.warn('Inicialización parcialmente fallida en loader', index, result.reason);
        }
    });

    updateDateLimits();
    updateAvailabilityMessage();
    updateSelectStates();

    const today = getTodayInputValue();
    const tomorrow = getTomorrowInputValue();
    document.getElementById('FechaInicio').value = today;
    document.getElementById('FechaFinalizacion').value = tomorrow;

    fpStart = flatpickr('#FechaInicio', {
        minDate: today,
        disable: [],
        dateFormat: 'Y-m-d',
        defaultDate: today,
        onChange: function (selectedDates) {
            if (selectedDates.length > 0) {
                const nextDay = new Date(selectedDates[0].getTime() + 86400000);
                const startDateStr = formatDateForInput(nextDay.toISOString());
                if (fpEnd) fpEnd.set('minDate', startDateStr);
                actualizarContadorNoches();
                calcularTotal();
                validateDateSelection();
            }
        }
    });

    fpEnd = flatpickr('#FechaFinalizacion', {
        minDate: today,
        disable: [],
        dateFormat: 'Y-m-d',
        defaultDate: tomorrow,
        onChange: function () {
            actualizarContadorNoches();
            calcularTotal();
            validateDateSelection();
        }
    });

    // Inicializar contador con los valores por defecto
    actualizarContadorNoches();
    calcularTotal();
})();