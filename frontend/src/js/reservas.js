// Verificar sesión
const userData = localStorage.getItem('user');
if (!userData) window.location.href = '/src/pages/login.html';
const user = JSON.parse(userData || '{}');
if (!user.IDUsuario) {
  localStorage.removeItem('user');
  window.location.href = '/src/pages/login.html';
}

// El nombre del usuario se inyecta en app.js → cargarComponentes() al insertar el header

let habitacionesData = [];
let paquetesData = [];
let serviciosData = [];

let allReservationsGlobal = [];
let fpEditStart = null;
let fpEditEnd = null;

async function cargarTodasReservas() {
    try {
        const response = await fetch('/api/reservas');
        if (response.ok) {
            allReservationsGlobal = await response.json();
        }
    } catch(e) {}
}

function formatDateForInput(value) {
    if (!value) return '';
    return value.split('T')[0];
}

function getEditSelectedRoomId() {
    const habitacionSelect = document.getElementById('editIDHabitacion');
    const paqueteSelect = document.getElementById('editIDPaquete');
    if (habitacionSelect.value !== '') return habitacionSelect.value;
    if (paqueteSelect.value !== '') {
        const paquete = paquetesData.find(p => String(p.IDPaquete) === String(paqueteSelect.value));
        return paquete ? paquete.IDHabitacion : null;
    }
    return null;
}

function getRoomBlockedRanges(roomId, excludeResId) {
    if (!roomId) return [];
    return allReservationsGlobal
        .filter(r => String(r.IDHabitacion) === String(roomId) && String(r.IdReserva) !== String(excludeResId) && r.FechaInicio && r.FechaFinalizacion && r.NombreEstadoReserva !== 'Cancelada')
        .map(r => ({ start: formatDateForInput(r.FechaInicio), end: formatDateForInput(r.FechaFinalizacion) }));
}

function getDisabledDatesForRoom(roomId, excludeResId) {
    if (!roomId) return [];
    const blockedRanges = getRoomBlockedRanges(roomId, excludeResId);
    const disabledDates = [];
    blockedRanges.forEach(range => {
        const startDate = new Date(range.start);
        startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
        const endDate = new Date(range.end);
        endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            disabledDates.push(formatDateForInput(currentDate.toISOString()));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });
    return disabledDates;
}

function updateEditDatePickerRestrictions() {
    const roomId = getEditSelectedRoomId();
    const currentResId = document.getElementById('editIdReserva').value;
    const disabledDates = getDisabledDatesForRoom(roomId, currentResId);
    
    const currentStartInput = document.getElementById('editFechaInicio').value;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    let minStartDate = todayStr;
    if (currentStartInput && currentStartInput < todayStr) {
        minStartDate = currentStartInput;
    }
    
    if (fpEditStart) { fpEditStart.set('disable', disabledDates); fpEditStart.set('minDate', minStartDate); }
    if (fpEditEnd)   { fpEditEnd.set('disable', disabledDates);   fpEditEnd.set('minDate', minStartDate); }
}

function isRangeOverlapping(start, end, range) {
    return !(end < range.start || start > range.end);
}

function validateEditDateSelection() {
    const roomId = getEditSelectedRoomId();
    const currentResId = document.getElementById('editIdReserva').value;
    const startInput = document.getElementById('editFechaInicio');
    const endInput = document.getElementById('editFechaFinalizacion');
    const startValue = startInput.value;
    const endValue = endInput.value;
    const blockedRanges = getRoomBlockedRanges(roomId, currentResId);
    
    let startError = '';
    let endError = '';
    
    if (startValue && endValue && endValue <= startValue) endError = 'La fecha de finalización debe ser al menos el día siguiente al de inicio.';
    if (roomId && startValue && blockedRanges.some(r => isRangeOverlapping(startValue, startValue, r))) startError = 'La fecha de inicio está ocupada.';
    if (roomId && endValue && blockedRanges.some(r => isRangeOverlapping(endValue, endValue, r))) endError = 'La fecha de finalización está ocupada.';
    if (roomId && startValue && endValue && blockedRanges.some(r => isRangeOverlapping(startValue, endValue, r))) {
        startError = 'El rango de fechas se solapa con una reserva existente.';
        endError = 'El rango de fechas se solapa con una reserva existente.';
    }
    
    startInput.setCustomValidity(startError);
    endInput.setCustomValidity(endError);
    startInput.reportValidity();
    endInput.reportValidity();
    return !startInput.validationMessage && !endInput.validationMessage;
}
async function cargarHabitaciones() {
    const response = await fetch('/api/habitaciones');
    habitacionesData = await response.json();
    const select = document.getElementById('editIDHabitacion');
    select.innerHTML = '<option value="">Seleccione una habitación</option>';
    habitacionesData.forEach(h => {
        if (h.Estado === 1) {
            const option = document.createElement('option');
            option.value = h.IDHabitacion;
            const costo = Number(h.Costo || h.precio || h.Precio || 0);
            option.textContent = `${h.NombreHabitacion} - $${costo.toLocaleString()}`;
            option.dataset.costo = costo;
            select.appendChild(option);
        }
    });
}

async function cargarPaquetes() {
    const response = await fetch('/api/paquetes');
    paquetesData = await response.json();
    const select = document.getElementById('editIDPaquete');
    select.innerHTML = '<option value="">Seleccione un paquete</option>';
    paquetesData.forEach(p => {
        const option = document.createElement('option');
        option.value = p.IDPaquete;
        const nombre = p.NombrePaquete || p.nombre || 'Paquete';
        const precio = Number(p.Precio || p.precio || 0);
        option.textContent = `${nombre} - $${precio.toLocaleString()}`;
        option.dataset.precio = precio;
        select.appendChild(option);
    });
}

async function cargarServicios() {
    try {
        const response = await fetch('/api/servicios');
        serviciosData = await response.json();
    } catch(e) {
        console.error('Error cargando servicios:', e);
        serviciosData = [];
    }
}

async function cargarMetodosPagoModal() {
    const response = await fetch('/api/metodopago');
    const metodos = await response.json();
    const select = document.getElementById('editMetodoPago');
    select.innerHTML = '<option value="">Seleccione método de pago</option>';
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

function formatCurrency(value) {
    return `$${Number(value).toLocaleString('es-CO')}`;
}

async function loadReservations() {
    try {
        const response = await fetch(`/api/reservas/user/${user.IDUsuario}`);
        const list = document.getElementById('reservationsList');
        if (!response.ok) {
            list.innerHTML = '<p style="color:var(--gris)">No se pudo cargar las reservas.</p>';
            return;
        }

        const reservations = await response.json();
        if (reservations.length === 0) {
            list.innerHTML = '<p style="color:var(--gris)">No tienes reservas aún. ¡Crea tu primera reserva!</p>';
            return;
        }

        // Estados que NO permiten cancelación: 3=Cancelada, 4=Completada
        const estadosNoCancelables = [3, 4];

        list.innerHTML = reservations.map(r => {
            const esCancelable = !estadosNoCancelables.includes(r.IdEstadoReserva || r.Estado);
            const estadoClass = (r.NombreEstadoReserva || '').toLowerCase().replace(/\s+/g, '-');

            return `
            <div class="reservation-card">
                <div class="reservation-info">
                    <h3>Reserva #${r.IdReserva}
                      <span class="status-badge status-${estadoClass}" style="font-size:0.7rem;margin-left:0.5rem;vertical-align:middle;">
                        ${r.NombreEstadoReserva || ''}
                      </span>
                    </h3>
                    <p><strong>Habitación:</strong> ${r.NombreHabitacion || 'Sin asignar'}</p>
                    <p><strong>Paquete:</strong> ${r.NombrePaquete || 'Sin paquete'}</p>
                    <p><strong>Fechas:</strong> ${r.FechaInicio ? new Date(r.FechaInicio).toLocaleDateString() : '-'} – ${r.FechaFinalizacion ? new Date(r.FechaFinalizacion).toLocaleDateString() : '-'}</p>
                    <p><strong>Total:</strong> ${formatCurrency(r.MontoTotal || 0)}</p>
                </div>
                <div class="reservation-actions">
                    <button class="btn btn-outline-primario" onclick="loadReservationDetails(${r.IdReserva})">Ver detalles</button>
                    <button class="btn btn-outline-azul" onclick="abrirEdicion(${r.IdReserva})">Editar</button>
                    ${
                      esCancelable
                        ? `<button class="btn btn-outline-peligro" onclick="solicitarCancelacion(${r.IdReserva}, ${r.MontoTotal || 0})">Cancelar</button>`
                        : `<button class="btn btn-outline-peligro" disabled style="opacity:0.35;cursor:not-allowed;">Cancelada</button>`
                    }
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Error cargando reservas', error);
    }
}

async function loadReservationDetails(id) {
    try {
        const response = await fetch(`/api/reservas/${id}`);
        if (!response.ok) return;
        const reservation = await response.json();
        const detailsOverlay = document.getElementById('reservationDetails');
        detailsOverlay.style.display = 'flex';
        const detailsContent = document.getElementById('reservationDetailsContent');
        detailsContent.innerHTML = buildReservationDetails(reservation);
    } catch (error) {
        console.error('Error cargando detalles de la reserva', error);
    }
}

function buildReservationDetails(r) {
    const serviciosHtml = (r.servicios || []).length > 0
        ? `<div class="details-services-grid">${r.servicios.map(s => {
            const costoS = s.Costo || s.precio || 0;
            return `
            <div class="detail-service-item">
                <span class="service-name">${s.NombreServicio || s.nombre}</span>
                <span class="service-price">${formatCurrency(costoS)}</span>
            </div>
          `;}).join('')}</div>`
        : '<p style="color: rgba(255,255,255,0.4); margin: 0;">No hay servicios adicionales.</p>';

    return `
        <div class="reservation-details-premium">
            <div class="modal-header">
                <div>
                    <h2 style="margin:0;">Detalles de la Reserva <span style="color:rgba(255,255,255,0.3); font-size: 1rem; font-weight: 400;">#${r.IdReserva}</span></h2>
                    <div class="status-badge status-${r.NombreEstadoReserva.toLowerCase()}">${r.NombreEstadoReserva}</div>
                </div>
                <button class="btn-close" onclick="ocultarDetalles()">×</button>
            </div>

            <div class="nr-layout" style="margin-top: 1.5rem;">
                <!-- Lado Izquierdo: Información -->
                <div class="nr-form">
                    <div class="nr-grid-2">
                        <div class="detail-info-group">
                            <label>Información del Cliente</label>
                            <p><strong>${r.NombreUsuario}</strong></p>
                            <p>Documento: ${r.NroDocumentoCliente || '-'}</p>
                        </div>
                        <div class="detail-info-group">
                            <label>Estadía</label>
                            <p>Inicio: ${r.FechaInicio ? new Date(r.FechaInicio).toLocaleDateString() : '-'}</p>
                            <p>Fin: ${r.FechaFinalizacion ? new Date(r.FechaFinalizacion).toLocaleDateString() : '-'}</p>
                        </div>
                    </div>

                    <div class="nr-card" style="padding: 1.25rem;">
                        <div class="nr-card__titulo">Habitación y Paquete</div>
                        <div class="nr-grid-2">
                            <div>
                                <p style="font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 0.2rem;">Habitación</p>
                                <p style="font-weight: 600;">${r.NombreHabitacion || '-'}</p>
                            </div>
                            <div>
                                <p style="font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 0.2rem;">Paquete</p>
                                <p style="font-weight: 600;">${r.NombrePaquete || '-'}</p>                            </div>
                        </div>
                    </div>

                    <div class="nr-card" style="padding: 1.25rem;">
                        <div class="nr-card__titulo">Servicios Adicionales</div>
                        ${serviciosHtml}
                    </div>
                </div>

                <!-- Lado Derecho: Resumen Financiero -->
                <div class="nr-resumen">
                    <div class="nr-resumen__titulo">Resumen de Pago</div>
                    <div class="nr-resumen__fila">
                        <span>Método de Pago</span>
                        <span>${r.NomMetodoPago}</span>
                    </div>
                    <div class="nr-resumen__fila">
                        <span>Subtotal</span>
                        <span>${formatCurrency(r.SubTotal || 0)}</span>
                    </div>
                    <div class="nr-resumen__fila">
                        <span>Descuento</span>
                        <span>${formatCurrency(r.Descuento || 0)}</span>
                    </div>
                    <div class="nr-resumen__fila">
                        <span>IVA (19%)</span>
                        <span>${formatCurrency(r.IVA || 0)}</span>
                    </div>
                    <div class="nr-resumen__total">
                        <span>Total Pagado</span>
                        <span>${formatCurrency(r.MontoTotal || 0)}</span>
                    </div>
                    
                    <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="btn btn-primario" onclick="abrirEdicion(${r.IdReserva})">Editar Reserva</button>
                        <button class="btn btn-outline" onclick="ocultarDetalles()">Cerrar</button>                    </div>
                </div>
            </div>
        </div>
    `;
}

function ocultarDetalles() {
    const details = document.getElementById('reservationDetails');
    details.style.display = 'none';
    document.getElementById('reservationDetailsContent').innerHTML = '';
}

async function abrirEdicion(id) {
    try {
        const response = await fetch(`/api/reservas/${id}`);
        if (!response.ok) return;
        const reservation = await response.json();
        await Promise.all([cargarHabitaciones(), cargarPaquetes(), cargarServicios(), cargarMetodosPagoModal()]);
        populateEditForm(reservation);
        document.getElementById('editModal').style.display = 'flex';
    } catch (error) {
        console.error('Error cargando reserva para editar', error);
    }
}

function populateEditForm(reservation) {
    document.getElementById('editIdReserva').value = reservation.IdReserva;
    document.getElementById('editIDPaquete').value = reservation.IDPaquete || '';
    document.getElementById('editIDHabitacion').value = reservation.IDPaquete ? '' : (reservation.IDHabitacion || '');
    document.getElementById('editFechaInicio').value = reservation.FechaInicio ? reservation.FechaInicio.split('T')[0] : '';
    document.getElementById('editFechaFinalizacion').value = reservation.FechaFinalizacion ? reservation.FechaFinalizacion.split('T')[0] : '';
    document.getElementById('editMetodoPago').value = reservation.MetodoPago || '';
    renderServiciosCheckboxes(reservation.servicios || []);
    updateEditSelectStates();    calcularTotalEdicion();
}

function updateEditSelectStates() {
    const habitacionSelect = document.getElementById('editIDHabitacion');
    const paqueteSelect = document.getElementById('editIDPaquete');
    const habitacionSelected = habitacionSelect.value !== '';
    const paqueteSelected = paqueteSelect.value !== '';

    if (habitacionSelected) {
        paqueteSelect.disabled = true;
    } else if (paqueteSelected) {
        habitacionSelect.disabled = true;
    } else {
        habitacionSelect.disabled = false;
        paqueteSelect.disabled = false;
    }
}

function renderServiciosCheckboxes(selectedServices = []) {
    const container = document.getElementById('editServiciosContainer');
    container.innerHTML = '';
    const selectedIds = selectedServices.map(s => s.IDServicio);

    serviciosData.forEach(servicio => {
        const div = document.createElement('div');
        div.className = 'servicio-item';
        const costoS = servicio.Costo || servicio.precio || 0;
        div.innerHTML = `
            <label class="servicio-label" style="padding: 1rem; gap: 0.75rem;">
                <input type="checkbox" class="edit-servicio-check" value="${servicio.IDServicio}" data-costo="${Number(servicio.Costo || servicio.precio || 0)}" ${selectedIds.includes(servicio.IDServicio) ? 'checked' : ''} style="width: 18px; height: 18px; margin-top: 2px;">
                <div class="servicio-main">
                    <div class="servicio-header" style="flex-direction: column; align-items: flex-start; gap: 0.1rem;">
                        <span class="servicio-name" style="font-size: 0.9rem; font-weight: 600;">${servicio.NombreServicio || servicio.nombre || 'Servicio'}</span>
                        <span class="servicio-price" style="font-size: 0.8rem; color: #00d4ff;">$${Number(servicio.Costo || servicio.precio || 0).toLocaleString()}</span>
                    </div>
                </div>
            </label>
        `;
        container.appendChild(div);
    });
}

function calcularTotalEdicion() {
    const habitacionSelect = document.getElementById('editIDHabitacion');
    const paqueteSelect = document.getElementById('editIDPaquete');
    const habitacionCost = parseFloat(habitacionSelect.selectedOptions[0]?.dataset.costo || 0);
    const paquetePrice = parseFloat(paqueteSelect.selectedOptions[0]?.dataset.precio || 0);
    const serviciosSeleccionados = Array.from(document.querySelectorAll('.edit-servicio-check:checked'));
    const totalServicios = serviciosSeleccionados.reduce((sum, s) => sum + parseFloat(s.dataset.costo), 0);
    const subtotal = paquetePrice + habitacionCost + totalServicios;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    document.getElementById('editSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('editIva').textContent = formatCurrency(iva);
    document.getElementById('editTotal').textContent = formatCurrency(total);
}

async function guardarEdicion() {
    const id = document.getElementById('editIdReserva').value;
    const servicioIds = Array.from(document.querySelectorAll('.edit-servicio-check:checked')).map(el => parseInt(el.value));
    const data = {
        IDHabitacion: parseInt(document.getElementById('editIDHabitacion').value),
        IDPaquete: parseInt(document.getElementById('editIDPaquete').value),
        serviciosAdicionales: servicioIds,
        FechaInicio: document.getElementById('editFechaInicio').value,
        FechaFinalizacion: document.getElementById('editFechaFinalizacion').value,
        MetodoPago: parseInt(document.getElementById('editMetodoPago').value)
    };
    try {
        const response = await fetch(`/api/reservas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            cerrarModal();
            await loadReservations();
            await loadReservationDetails(id);
        } else {
            const error = await response.json();
            alert(error.message || 'Error al actualizar la reserva');
        }
    } catch (error) {
        alert('Error de conexión');    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE CANCELACIÓN — UX de 2 pasos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paso 1: Solicita la cancelación al backend para obtener la política aplicable.
 * Si es gratuita → cancela directo y muestra resultado.
 * Si tiene penalización → muestra el modal de confirmación.
 */
async function solicitarCancelacion(id, montoTotal) {
    try {
        const response = await fetch(`/api/reservas/${id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})   // primer llamado sin confirmación
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Error al procesar la cancelación.');
            return;
        }

        // El backend requiere confirmación explícita (hay penalización)
        if (data.requiresConfirmation) {
            poblarModalCancelacion(id, montoTotal, data.politica, data.mensaje);
            document.getElementById('cancelRequieresConfirmacion').value = 'true';
            document.getElementById('cancelModal').style.display = 'flex';
            return;
        }

        // Cancelación gratuita ejecutada directamente
        if (data.cancelado) {
            mostrarResultadoCancelacion(data.data || data, montoTotal);
            await loadReservations();
            ocultarDetalles();
        }

    } catch (error) {
        console.error('Error solicitando cancelación:', error);
        alert('Error de conexión. Por favor intenta de nuevo.');
    }
}

/**
 * Rellena el modal de cancelación con la información de la política.
 */
function poblarModalCancelacion(id, montoTotal, politica, mensajeExtra) {
    document.getElementById('cancelReservaId').value = id;

    const esGratuita = politica.tipoCancelacion === 'gratuita';

    // Badge de tipo
    const badge = document.getElementById('cancelTipoBadge');
    badge.textContent = esGratuita ? '✅ Cancelación Gratuita' : `⚠️ Cancelación con Penalización (${politica.porcentajePenalizacion}%)`;
    badge.style.background = esGratuita ? '#10b981' : '#ef4444';
    badge.style.color = '#fff';

    // Mensaje de política
    const politicaBox = document.getElementById('cancelPoliticaBox');
    politicaBox.style.borderLeftColor = esGratuita ? '#10b981' : '#f59e0b';
    politicaBox.style.background = esGratuita ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)';
    document.getElementById('cancelPoliticaMensaje').textContent = mensajeExtra || politica.mensaje || '';

    // Resumen financiero
    document.getElementById('cancelMontoTotal').textContent = formatCurrency(montoTotal);
    document.getElementById('cancelPenalizacionLabel').textContent =
        esGratuita ? 'Penalización aplicada' : `Penalización (${politica.porcentajePenalizacion}%)`;
    document.getElementById('cancelPenalizacionValor').textContent =
        esGratuita ? '$0 (sin cargo)' : formatCurrency(politica.valorPenalizacion);
    document.getElementById('cancelPenalizacionValor').style.color = esGratuita ? '#10b981' : '#ef4444';
    document.getElementById('cancelReembolsoValor').textContent = formatCurrency(politica.valorReembolso);

    // Subtítulo del modal
    document.getElementById('cancelModalSubtitle').textContent =
        esGratuita ? 'Esta cancelación no generará ningún cargo.' : '⚠️ Esta cancelación generará un cargo de penalización.';
}

/**
 * Paso 2: El usuario ya vio la política y confirma la cancelación.
 * Envía confirmarConPenalizacion=true para ejecutar la cancelación en la BD.
 */
async function ejecutarCancelacion() {
    const id = document.getElementById('cancelReservaId').value;
    const montoEl = document.getElementById('cancelMontoTotal').textContent;
    // Extraer el número del texto formateado
    const montoTotal = parseFloat(montoEl.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;

    const btn = document.getElementById('cancelConfirmBtn');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
        const response = await fetch(`/api/reservas/${id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmarConPenalizacion: true })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Error al cancelar la reserva.');
            btn.disabled = false;
            btn.textContent = '❌ Confirmar cancelación';
            return;
        }

        cerrarModalCancelacion();
        mostrarResultadoCancelacion(data.data || data, montoTotal);
        await loadReservations();
        ocultarDetalles();

    } catch (error) {
        console.error('Error ejecutando cancelación:', error);
        alert('Error de conexión. Por favor intenta de nuevo.');
        btn.disabled = false;
        btn.textContent = '❌ Confirmar cancelación';
    }
}

/**
 * Muestra el modal de resultado con el resumen financiero de la cancelación.
 */
function mostrarResultadoCancelacion(data, montoTotalFallback) {
    const politica = data.politica || {};
    const esGratuita = (politica.tipoCancelacion || '') === 'gratuita';
    const montoTotal = montoTotalFallback || 0;

    // Ícono y badge
    document.getElementById('cancelResultIcon').textContent = esGratuita ? '✅' : '⚠️';
    const badge = document.getElementById('cancelResultBadge');
    badge.textContent = esGratuita ? '✅ Cancelación Gratuita' : `⚠️ Penalización del ${politica.porcentajePenalizacion || 40}%`;
    badge.style.background = esGratuita ? '#10b981' : '#ef4444';
    badge.style.color = '#fff';

    // Subtítulo
    document.getElementById('cancelResultSubtitle').textContent =
        esGratuita
            ? 'Tu reserva fue cancelada sin ningún cargo. Recibirás el reembolso completo.'
            : 'Tu reserva fue cancelada. Revisa los valores a continuación.';

    // Resumen financiero
    document.getElementById('cancelResultTotal').textContent = formatCurrency(montoTotal);
    document.getElementById('cancelResultPenLabel').textContent =
        esGratuita ? 'Penalización aplicada' : `Penalización retenida (${politica.porcentajePenalizacion || 0}%)`;
    document.getElementById('cancelResultPenValor').textContent =
        esGratuita ? '$0 (sin cargo)' : formatCurrency(politica.valorPenalizacion || 0);
    document.getElementById('cancelResultPenValor').style.color = esGratuita ? '#10b981' : '#ef4444';
    document.getElementById('cancelResultReembolso').textContent = formatCurrency(politica.valorReembolso || montoTotal);

    // Mensaje
    document.getElementById('cancelResultMensaje').textContent = data.mensaje || politica.mensaje || '';

    document.getElementById('cancelResultModal').style.display = 'flex';
}

function cerrarModalCancelacion() {
    document.getElementById('cancelModal').style.display = 'none';
    const btn = document.getElementById('cancelConfirmBtn');
    if (btn) { btn.disabled = false; btn.textContent = '❌ Confirmar cancelación'; }
}

function cerrarResultadoCancelacion() {
    document.getElementById('cancelResultModal').style.display = 'none';
}

function cerrarModal() {
    document.getElementById('editModal').style.display = 'none';
}

function handleFormChange(event) {
    if (event.target.matches('#editIDHabitacion')) {
        if (event.target.value !== '') {
            document.getElementById('editIDPaquete').value = '';
        }
        updateEditSelectStates();        calcularTotalEdicion();
    }
    
    if (event.target.matches('#editIDPaquete')) {
        if (event.target.value !== '') {
            document.getElementById('editIDHabitacion').value = '';
        }
        updateEditSelectStates();
        calcularTotalEdicion();
    }

    if (event.target.matches('.edit-servicio-check')) {
        calcularTotalEdicion();
    }
}

document.getElementById('editReservationForm').addEventListener('change', handleFormChange);

(async function initializePage() {
    await Promise.all([cargarHabitaciones(), cargarPaquetes(), cargarServicios(), cargarMetodosPagoModal()]);    await loadReservations();
})();

