// ══════════════════════════════════════════════════
//  admin-nueva-reserva.js
//  Lógica del formulario de nueva reserva en el
//  panel de administración. Reutiliza la misma lógica
//  de nueva-reserva.js pero adaptada al contexto admin.
// ══════════════════════════════════════════════════

// Verificar sesión y rol admin
const userData = localStorage.getItem('user');
if (!userData) window.location.href = '/src/pages/login.html';
const user = JSON.parse(userData);
if (user.IDRol !== 2) window.location.href = '/src/pages/reservas.html';

// Nombre de bienvenida en sidebar
const adminNameEl = document.getElementById('adminName');
if (adminNameEl) adminNameEl.textContent = `Bienvenido, ${user.NombreUsuario}`;

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '/src/pages/login.html';
    });
}

// Notificaciones (igual al admin)
function mostrarNotificacion(mensaje, tipo = 'success') {
    const container = document.getElementById('notificationContainer');
    if (!container) { alert(mensaje); return; }
    const id = 'notif-' + Date.now();
    const colors = {
        success: { bg: '#D1FAE5', border: '#059669', icon: '✓', color: '#064E3B', text: '#064E3B' },
        error:   { bg: '#FEE2E2', border: '#DC2626', icon: '✕', color: '#7F1D1D', text: '#7F1D1D' },
        warning: { bg: '#FEF3C7', border: '#F59E0B', icon: '⚠', color: '#78350F', text: '#78350F' },
        info:    { bg: '#DBEAFE', border: '#3B82F6', icon: 'ℹ', color: '#1E3A8A', text: '#1E3A8A' }
    };
    const cfg = colors[tipo] || colors.info;
    const notif = document.createElement('div');
    notif.id = id;
    notif.style.cssText = `
        display:flex;align-items:center;gap:0.75rem;
        padding:0.9rem 1.2rem;border-radius:12px;
        background:${cfg.bg};border:1.5px solid ${cfg.border};opacity:1;
        color:${cfg.text};font-family:var(--fuente-secundaria,'Inter',sans-serif);
        font-size:0.88rem;font-weight:500;box-shadow:0 10px 25px rgba(0,0,0,0.15);
        animation:slideIn 0.3s ease;max-width:360px;
    `;
    notif.innerHTML = `<span style="color:${cfg.color};font-size:1.1rem;font-weight:700;">${cfg.icon}</span><span>${mensaje}</span>`;
    container.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '0'; notif.style.transition = 'opacity 0.3s'; setTimeout(() => notif.remove(), 300); }, 3500);
}

// ─── DATA GLOBAL ───────────────────────────────────
let habitacionesData    = [];
let cabanasData         = [];
let paquetesData        = [];
let serviciosData       = [];
let allReservations     = [];
let fpStart             = null;
let fpEnd               = null;
let selectedClienteUserId = null;

/* ──────────────────────────────────────────────────
   BÚSQUEDA DE CLIENTE POR DOCUMENTO
────────────────────────────────────────────────── */
async function buscarClientePorDocumento() {
    const docInput = document.getElementById('buscarDocumento');
    const doc = (docInput?.value || '').trim();
    const encontradoEl     = document.getElementById('clienteEncontrado');
    const noEncontradoEl   = document.getElementById('clienteNoEncontrado');
    const badgeEl          = document.getElementById('clienteSeleccionadoBadge');
    const btn              = document.getElementById('btnBuscarCliente');

    if (!doc) {
        mostrarNotificacion('Ingresa un número de documento para buscar.', 'warning');
        return;
    }

    // Resetear estado anterior
    selectedClienteUserId = null;
    if (encontradoEl)   encontradoEl.style.display   = 'none';
    if (noEncontradoEl) noEncontradoEl.style.display = 'none';
    if (badgeEl)        badgeEl.style.display        = 'none';
    if (btn) { btn.textContent = 'Buscando...'; btn.disabled = true; }

    try {
        const r = await fetch(`/api/usuarios/documento/${encodeURIComponent(doc)}`);
        if (r.ok) {
            const cliente = await r.json();
            selectedClienteUserId = cliente.IDUsuario;
            const nombreCompleto = `${cliente.NombreUsuario || ''}${cliente.Apellido ? ' ' + cliente.Apellido : ''}`.trim();

            // Conectar resultado con el campo oculto y el chip de selección
            document.getElementById('IDClienteReserva').value = cliente.IDUsuario;
            docInput.value = '';
            const resultsEl = document.getElementById('docSearchResults');
            if (resultsEl) resultsEl.style.display = 'none';
            const chip = document.getElementById('clienteSeleccionado');
            if (chip) {
                chip.style.display = 'flex';
                chip.innerHTML = `
                    <span style="font-size:1.15rem;">👤</span>
                    <div class="nr-cliente-chip__info">
                        <div class="nr-cliente-chip__name">${nombreCompleto}</div>
                        <div class="nr-cliente-chip__doc">${cliente.TipoDocumento || 'Doc'}: ${cliente.NumeroDocumento} &bull; ${cliente.Email || ''}</div>
                    </div>
                    <span class="nr-cliente-chip__clear" onclick="limpiarCliente()" title="Cambiar cliente">&times;</span>
                `;
            }

            // Elementos opcionales del diseño anterior (compatibilidad)
            const nombreEl = document.getElementById('clienteNombreDisplay');
            const emailEl  = document.getElementById('clienteEmailDisplay');
            const docEl    = document.getElementById('clienteDocDisplay');
            if (nombreEl) nombreEl.textContent = nombreCompleto;
            if (emailEl)  emailEl.textContent  = cliente.Email ? `📧 ${cliente.Email}` : '';
            if (docEl)    docEl.textContent    = `🪪 Documento: ${cliente.NumeroDocumento}`;
            if (encontradoEl)   encontradoEl.style.display   = 'block';
            if (noEncontradoEl) noEncontradoEl.style.display = 'none';
            if (badgeEl)        badgeEl.style.display        = 'inline-flex';
        } else {
            mostrarNotificacion('No se encontró ningún cliente con ese número de documento.', 'warning');
            if (noEncontradoEl) noEncontradoEl.style.display = 'block';
            if (encontradoEl)   encontradoEl.style.display   = 'none';
        }
    } catch(e) {
        mostrarNotificacion('Error de conexión al buscar el cliente.', 'error');
    } finally {
        if (btn) { btn.textContent = 'Buscar'; btn.disabled = false; }
    }
}

/* ──────────────────────────────────────────────────
   UTILIDADES DE FECHA
────────────────────────────────────────────────── */
function getTodayInputValue() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
}
function getTomorrowInputValue() {
    const d = new Date(); d.setDate(d.getDate()+1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatDateForInput(value) { return value ? value.split('T')[0] : ''; }
function formatCurrency(value) {
    return Number(value||0).toLocaleString('es-CO',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function getSeasonalInfo(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return { multiplicador: 1.0, temporada: null };
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    let multiplicador = 1.0;
    let temporada = null;
    while (inicio < fin) {
        const mes = inicio.getMonth() + 1;
        const dia = inicio.getDate();
        if ((mes === 12 && dia >= 15) || (mes === 1 && dia <= 15)) {
            if (1.30 > multiplicador) { multiplicador = 1.30; temporada = 'Temporada Alta (Navidad / Año Nuevo)'; }
        } else if ((mes === 3 && dia >= 20) || (mes === 4 && dia <= 10)) {
            if (1.25 > multiplicador) { multiplicador = 1.25; temporada = 'Semana Santa'; }
        } else if (mes === 7) {
            if (1.15 > multiplicador) { multiplicador = 1.15; temporada = 'Temporada de Vacaciones (Julio)'; }
        }
        inicio.setDate(inicio.getDate() + 1);
    }
    return { multiplicador, temporada };
}

/* ──────────────────────────────────────────────────
   SERVICIOS — CONTROL INFO
────────────────────────────────────────────────── */
function getServicioControlInfo(servicio) {
    const nombre = String(servicio.NombreServicio||servicio.nombre||'').toLowerCase();
    const maxP = servicio.CantidadMaximaPersonas||servicio.cantidadMaximaPersonas||0;
    const c = {label:'Cantidad',min:1,max:10,step:1,unit:'unidades',isPersonas:false};
    if (nombre.includes('cabalgata')||nombre.includes('tour')||nombre.includes('masaje')||nombre.includes('guía')||nombre.includes('guia')||nombre.includes('spa')) {
        c.label='Personas';c.unit='personas';c.isPersonas=true;c.max=Math.max(maxP, 10);
    } else if (nombre.includes('botella'))  { c.unit='botellas';c.max=Math.max(maxP, 10); }
    else if (nombre.includes('decoración')||nombre.includes('decoracion')||nombre.includes('romántica')||nombre.includes('romantica')) { c.unit='paquetes';c.max=Math.max(maxP, 5); }
    else if (nombre.includes('desayuno'))   { c.unit='desayunos';c.max=Math.max(maxP, 10); }
    else if (nombre.includes('lavander'))   { c.unit='servicios';c.max=Math.max(maxP, 10); }
    else if (nombre.includes('traslado')||nombre.includes('transporte')) { c.unit='traslados';c.max=Math.max(maxP, 10); }
    else if (nombre.includes('wifi'))       { c.unit='paquetes';c.max=Math.max(maxP, 1); }
    else                                    { c.max=Math.max(maxP, 10); }
    return c;
}

function getServicioInfo(servicio) {
    const nombre = String(servicio.NombreServicio||servicio.nombre||'').trim();
    const nl = nombre.toLowerCase();
    const info = {
        description: servicio.Descripcion||servicio.descripcion||`Servicio adicional de ${nombre}.`,
        includes:[], duration:servicio.Duracion||servicio.duracion||'',
        people:servicio.CantidadMaximaPersonas?`${servicio.CantidadMaximaPersonas} personas`:'', conditions:''
    };
    if (nl.includes('desayuno')) {
        info.description=info.description||'Desayuno completo con productos frescos.';
        info.includes=['Café de origen nacional','Jugo natural','Panadería artesanal','Frutas de temporada'];
        info.duration=info.duration||'7:00–10:00'; info.people=info.people||'1-2 personas';
        info.conditions='Solicitar con al menos 4 horas de anticipación.';
    } else if (nl.includes('lavander')) {
        info.includes=['Lavado y secado','Planchado','Entrega en alojamiento'];
        info.duration=info.duration||'8-12 horas';
    } else if (nl.includes('traslado')||nl.includes('transporte')) {
        info.includes=['Vehículo privado','Chofer local','Maletero asistido'];
        info.duration=info.duration||'Variable'; info.people=info.people||'Hasta 4 personas';
    } else if (nl.includes('spa')) {
        info.includes=['Jacuzzi','Sala de vapor','Toallas premium']; info.duration=info.duration||'90 min';
    } else if (nl.includes('masaje')) {
        info.includes=['Masaje 60 min','Aromaterapia','Aceites naturales']; info.duration=info.duration||'60 min';
    } else if (nl.includes('cabalgata')) {
        info.includes=['Guía local','Caballos','Equipo de seguridad']; info.duration=info.duration||'2 horas';
    } else {
        info.includes=info.includes.length>0?info.includes:['Atención personalizada','Calidad garantizada'];
    }
    return info;
}

function renderServicioTooltip(info) {
    return `
        <div class="servicio-desc">${info.description}</div>
        <div class="servicio-meta-grid">
            ${info.duration?`<div><span class="meta-label">Duración:</span> ${info.duration}</div>`:''}
            ${info.people?`<div><span class="meta-label">Personas:</span> ${info.people}</div>`:''}
        </div>
        <div class="servicio-meta-section">
            <strong>Incluye:</strong>
            <ul class="servicio-includes">${info.includes.map(i=>`<li>${i}</li>`).join('')}</ul>
        </div>
        ${info.conditions?`<div class="servicio-conditions"><strong>Condiciones:</strong> ${info.conditions}</div>`:''}
    `;
}

/* ──────────────────────────────────────────────────
   CONTADOR DE NOCHES
────────────────────────────────────────────────── */
function actualizarContadorNoches() {
    let inicio, fin;
    if (fpStart && fpStart.selectedDates.length > 0) {
        const d = fpStart.selectedDates[0];
        inicio = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    } else {
        inicio = document.getElementById('FechaInicio').value;
    }
    if (fpEnd && fpEnd.selectedDates.length > 0) {
        const d = fpEnd.selectedDates[0];
        fin = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    } else {
        fin = document.getElementById('FechaFinalizacion').value;
    }
    const badge  = document.getElementById('contadorNoches');
    const numEl  = document.getElementById('numNoches');
    const resumenFechas = document.getElementById('resumenFechas');
    const resumenCheckin = document.getElementById('resumenCheckin');
    const resumenCheckout = document.getElementById('resumenCheckout');

    // El bloque de check-in/check-out es siempre visible (horas fijas del glamping)
    // Solo actualizamos las fechas cuando están disponibles
    if (resumenCheckin) resumenCheckin.textContent = (inicio && fin && fin > inicio) ? inicio : '';
    if (resumenCheckout) resumenCheckout.textContent = (inicio && fin && fin > inicio) ? fin : '';

    if (!inicio||!fin||fin<=inicio) {
        if (badge) badge.style.display='none';
        return 0;
    }
    const noches = Math.round((new Date(fin)-new Date(inicio))/(1000*60*60*24));
    if (noches>=1&&badge&&numEl) {
        numEl.textContent=noches; badge.style.display='inline-flex';
    } else {
        if (badge) badge.style.display='none';
    }
    return noches>=1?noches:0;
}

/* ──────────────────────────────────────────────────
   DESGLOSE DEL RESUMEN
────────────────────────────────────────────────── */
function actualizarDesglose() {
    const container = document.getElementById('resumenDesglose');
    if (!container) return;
    const items = [];
    const noches = actualizarContadorNoches();
    const { multiplicador } = getSeasonalInfo(
        document.getElementById('FechaInicio')?.value,
        document.getElementById('FechaFinalizacion')?.value
    );
    const temporadaLabel = multiplicador > 1 ? ` × ${multiplicador.toFixed(2)}` : '';

    const hSel = document.getElementById('IDHabitacion');
    if (hSel.value) {
        const h = habitacionesData.find(h=>String(h.IDHabitacion)===String(hSel.value));
        if (h) {
            const pn = parseFloat(h.Costo||h.precio||0);
            const sub = noches>0?pn*noches*multiplicador:0;
            items.push({
                name: h.NombreHabitacion,
                val: sub,
                detail: noches>0?`$${formatCurrency(pn)}/noche × ${noches} noches${temporadaLabel}`:'',
                type:'accommodation'
            });
        }
    }
    const cSel = document.getElementById('IDCabana');
    if (cSel.value) {
        const c = cabanasData.find(c=>String(c.IDCabana)===String(cSel.value));
        if (c) {
            const pn = parseFloat(c.PrecioNoche||0);
            const sub = noches>0?pn*noches*multiplicador:0;
            items.push({
                name: c.NombreCabana,
                val: sub,
                detail: noches>0?`$${formatCurrency(pn)}/noche × ${noches} noches${temporadaLabel}`:'',
                type:'accommodation'
            });
        }
    }
    const pSel = document.getElementById('IDPaquete');
    if (pSel.value) {
        const p = paquetesData.find(p=>String(p.IDPaquete)===String(pSel.value));
        if (p) {
            const pn = parseFloat(p.Precio||p.precio||0);
            const sub = noches>0?pn*noches*multiplicador:0;
            items.push({
                name: p.NombrePaquete||'Paquete',
                val: sub,
                detail: noches>0?`$${formatCurrency(pn)}/noche × ${noches} noches${temporadaLabel}`:'',
                type:'accommodation'
            });
        }
    }
    document.querySelectorAll('.servicio-check:checked').forEach(cb=>{
        const s = serviciosData.find(s=>String(s.IDServicio)===String(cb.value));
        if (s) {
            const cant = getServicioQuantity(s.IDServicio);
            const costo = parseFloat(cb.dataset.costo||0);
            const total = cant*costo;
            const ctrl = getServicioControlInfo(s);
            items.push({name:`+ ${s.NombreServicio||s.nombre}`,val:total,detail:`${cant} ${ctrl.unit} × $${formatCurrency(costo)}`,type:'service'});
        }
    });

    if (items.length===0) {
        container.innerHTML='<p style="font-size:0.78rem;color:rgba(26,43,74,0.45);margin:0;">Selecciona un alojamiento para ver el desglose.</p>';
    } else {
        container.innerHTML = items.map((i,idx)=>`
            <div class="nr-resumen__item ${i.type==='accommodation'?'accommodation-item':'service-item'}">
                <div>
                    <span class="nr-resumen__item-name">${i.name}</span>
                    ${i.detail?`<div class="nr-resumen__item-details">${i.detail}</div>`:''}
                </div>
                <span class="nr-resumen__item-val">$${formatCurrency(i.val)}</span>
            </div>
            ${idx<items.length-1&&items[idx+1].type!==i.type?'<div style="border-bottom:1px solid rgba(49,130,206,0.15);margin:0.5rem 0;"></div>':''}
        `).join('');
    }
}

function actualizarSubtotalServicios() {
    const checked = document.querySelectorAll('.servicio-check:checked');
    const total = Array.from(checked).reduce((sum,cb)=>sum+(parseFloat(cb.dataset.costo||0)*getServicioQuantity(cb.value)),0);
    const el = document.getElementById('serviciosSubtotal');
    const valEl = document.getElementById('serviciosSubtotalVal');
    if (!el||!valEl) return;
    if (checked.length>0) { valEl.textContent=`$${formatCurrency(total)}`; el.style.display='block'; }
    else                  { el.style.display='none'; }
}

/* ──────────────────────────────────────────────────
   CARGA DE DATOS
────────────────────────────────────────────────── */
let clientesCache = [];

async function cargarClientes() {
    try {
        const r = await fetch('/api/usuarios');
        if (!r.ok) throw new Error('Error al cargar clientes');
        const todos = await r.json();
        clientesCache = todos.filter(u => u.IDRol !== 2 && u.Estado === 1);
    } catch(e) {
        console.error('cargarClientes:', e);
    }
}

function seleccionarCliente(idUsuario) {
    const c = clientesCache.find(u => u.IDUsuario === idUsuario);
    if (!c) return;
    document.getElementById('IDClienteReserva').value = idUsuario;
    document.getElementById('buscarDocumento').value = '';
    document.getElementById('docSearchResults').style.display = 'none';
    const chip = document.getElementById('clienteSeleccionado');
    chip.style.display = 'flex';
    chip.innerHTML = `
        <span style="font-size:1.15rem;">👤</span>
        <div class="nr-cliente-chip__info">
            <div class="nr-cliente-chip__name">${c.NombreUsuario} ${c.Apellido}</div>
            <div class="nr-cliente-chip__doc">${c.TipoDocumento || 'Doc'}: ${c.NumeroDocumento} &bull; ${c.Email}</div>
        </div>
        <span class="nr-cliente-chip__clear" onclick="limpiarCliente()" title="Cambiar cliente">&times;</span>
    `;
}

function limpiarCliente() {
    document.getElementById('IDClienteReserva').value = '';
    document.getElementById('clienteSeleccionado').style.display = 'none';
    const inp = document.getElementById('buscarDocumento');
    inp.value = '';
    inp.focus();
}

document.addEventListener('DOMContentLoaded', () => {
    const inp = document.getElementById('buscarDocumento');
    const resultsEl = document.getElementById('docSearchResults');
    if (!inp) return;

    inp.addEventListener('input', function() {
        const q = this.value.trim();
        if (q.length < 2) { resultsEl.style.display = 'none'; return; }
        const matches = clientesCache.filter(c =>
            c.NumeroDocumento && c.NumeroDocumento.toLowerCase().includes(q.toLowerCase())
        );
        if (matches.length === 0) {
            resultsEl.innerHTML = '<div class="nr-doc-result-item"><span class="nr-doc-result-item__name">No se encontró ningún cliente con ese documento.</span></div>';
        } else {
            resultsEl.innerHTML = matches.map(c => `
                <div class="nr-doc-result-item" onclick="seleccionarCliente(${c.IDUsuario})">
                    <div class="nr-doc-result-item__name">${c.NombreUsuario} ${c.Apellido}</div>
                    <div class="nr-doc-result-item__doc">${c.TipoDocumento || 'Doc'}: ${c.NumeroDocumento} &bull; ${c.Email}</div>
                </div>
            `).join('');
        }
        resultsEl.style.display = 'block';
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nr-doc-search')) {
            resultsEl.style.display = 'none';
        }
    });
});

async function cargarHabitaciones() {
    try {
        const r = await fetch('/api/habitaciones');
        habitacionesData = await r.json();
        const sel = document.getElementById('IDHabitacion');
        sel.innerHTML = '<option value="">Seleccione una habitación</option>';
        habitacionesData.forEach(h => {
            if (h.Estado === 1) {
                const opt = document.createElement('option');
                opt.value = h.IDHabitacion;
                const costo = h.Costo||h.precio||0;
                opt.textContent = `${h.NombreHabitacion||h.nombre} - $${Number(costo).toLocaleString()}`;
                opt.dataset.costo = costo;
                sel.appendChild(opt);
            }
        });
    } catch(e){ console.error('Error cargando habitaciones:',e); }
}

async function cargarCabanas() {
    try {
        const r = await fetch('/api/cabanas');
        cabanasData = await r.json();
        const sel = document.getElementById('IDCabana');
        cabanasData.forEach(c => {
            if (c.Estado === 1) {
                const opt = document.createElement('option');
                opt.value = c.IDCabana;
                const precio = c.PrecioNoche||0;
                opt.textContent = `${c.NombreCabana} - $${Number(precio).toLocaleString()}`;
                opt.dataset.costo = precio;
                sel.appendChild(opt);
            }
        });
    } catch(e){ console.error('Error cargando cabañas:',e); }
}

async function cargarPaquetes(selectedRoomId=null) {
    try {
        const r = await fetch('/api/paquetes');
        paquetesData = await r.json();
        populatePaquetes(selectedRoomId);
    } catch(e){ console.error('Error cargando paquetes:',e); }
}

function populatePaquetes(selectedRoomId=null, isDisabled=false) {
    const sel = document.getElementById('IDPaquete');
    sel.innerHTML = '<option value="">Seleccione un paquete</option>';
    const filtered = selectedRoomId
        ? paquetesData.filter(p=>String(p.IDHabitacion)===String(selectedRoomId) && p.Estado === 1)
        : paquetesData.filter(p=>p.Estado === 1);
    filtered.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.IDPaquete;
        const precio = p.Precio||p.precio||0;
        opt.textContent = `${p.NombrePaquete||p.nombre} - $${Number(precio).toLocaleString()}`;
        opt.dataset.precio = precio;
        opt.disabled = isDisabled;
        sel.appendChild(opt);
    });
    if (selectedRoomId&&filtered.length===0) sel.innerHTML+='<option value="">No hay paquetes disponibles</option>';
    sel.disabled = isDisabled;
}

function aplicarRestriccionPaquete(paquete) {
    limpiarRestriccionPaquete();
    if (!paquete) return;
    const restringe = (selId, idIncluido, nombreIncluido, tipo) => {
        if (!idIncluido) return;
        const sel = document.getElementById(selId);
        const opt = sel ? sel.querySelector(`option[value="${idIncluido}"]`) : null;
        if (!opt) return;
        opt.dataset.originalText = opt.textContent;
        opt.textContent = `${nombreIncluido || opt.textContent.split(' - ')[0]} (incluida en el paquete)`;
        opt.disabled = true;
        opt.dataset.paqueteRestricted = 'true';
        if (sel.value === String(idIncluido)) {
            sel.value = '';
            const previewCard = document.getElementById('previewCard');
            if (previewCard && previewCard.dataset.type === tipo) {
                previewCard.style.display = 'none';
                previewCard.innerHTML = '';
            }
            mostrarNotificacion(`Se quitó "${nombreIncluido || tipo}" porque ya está incluida en el paquete seleccionado.`, 'warning');
            calcularTotal();
            updateSelectStates();
        }
    };
    restringe('IDHabitacion', paquete.IDHabitacion, paquete.NombreHabitacion, 'habitacion');
    restringe('IDCabana',     paquete.IDCabana,     paquete.NombreCabana,     'cabana');
}

function limpiarRestriccionPaquete() {
    document.querySelectorAll('option[data-paquete-restricted="true"]').forEach(opt => {
        opt.disabled = false;
        if (opt.dataset.originalText) opt.textContent = opt.dataset.originalText;
        delete opt.dataset.originalText;
        delete opt.dataset.paqueteRestricted;
    });
}

function updateSelectStates() {
    const hSel = document.getElementById('IDHabitacion');
    const cSel = document.getElementById('IDCabana');
    const pSel = document.getElementById('IDPaquete');
    const hSelected = hSel.value!=='';
    const cSelected = cSel.value!=='';
    // Habitación y cabaña siguen siendo mutuamente excluyentes
    if (hSelected) {
        cSel.disabled=true;cSel.value='';
    } else if (cSelected) {
        hSel.disabled=true;hSel.value='';
    } else {
        hSel.disabled=false;cSel.disabled=false;
        // Preservar el paquete ya elegido: populatePaquetes() reconstruye
        // el <select> y perdía la selección, dejando el resumen en $0.
        const paqueteActual = pSel.value;
        populatePaquetes(null,false);
        if (paqueteActual) pSel.value = paqueteActual;
    }
    // El paquete siempre está habilitado — puede combinarse con habitación o cabaña
    pSel.disabled=false;
}

async function cargarServicios() {
    const container = document.getElementById('serviciosContainer');
    if (!container) return;
    container.innerHTML = '<p class="nr-loading">Cargando servicios adicionales...</p>';
    try {
        const r = await fetch('/api/servicios');
        if (!r.ok) throw new Error(`${r.status}`);
        const servicios = await r.json();
        serviciosData = servicios.filter(s => s.Estado === 1).map(s=>({...s,NombreServicio:s.NombreServicio||s.nombre||'Servicio',Costo:Number(s.Costo||s.precio||0),Cantidad:1}));
        container.innerHTML='';
        if (!serviciosData.length) { container.innerHTML='<p class="nr-empty">No hay servicios adicionales disponibles.</p>'; return; }
        serviciosData.forEach(s=>{
            const div = document.createElement('div');
            div.className='servicio-item';
            div.dataset.servicioId=s.IDServicio;
            const info = getServicioInfo(s);
            const ctrl = getServicioControlInfo(s);
            div.innerHTML=`
                <label class="servicio-label">
                    <input type="checkbox" class="servicio-check" value="${s.IDServicio}" data-costo="${s.Costo}">
                    <div class="servicio-main">
                        <div class="servicio-header">
                            <span class="servicio-name">${s.NombreServicio}</span>
                            <span class="servicio-price">$${formatCurrency(s.Costo)}</span>
                        </div>
                        <div class="servicio-extra">
                            <div class="servicio-controls">
                                <label class="servicio-control-label">${ctrl.label}</label>
                                <div class="servicio-input-row">
                                    <div class="servicio-stepper">
                                        <button type="button" class="servicio-step-btn" data-dir="-1" data-servicio-id="${s.IDServicio}" aria-label="Reducir ${ctrl.label.toLowerCase()}" disabled>−</button>
                                        <input type="number" class="servicio-quantity-input"
                                            data-servicio-id="${s.IDServicio}"
                                            min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}"
                                            value="1" aria-label="${ctrl.label} para ${s.NombreServicio}" disabled />
                                        <button type="button" class="servicio-step-btn" data-dir="1" data-servicio-id="${s.IDServicio}" aria-label="Aumentar ${ctrl.label.toLowerCase()}" disabled>+</button>
                                    </div>
                                    <span class="servicio-input-suffix">${ctrl.unit}</span>
                                </div>
                                <div class="servicio-help" aria-live="polite"></div>
                            </div>
                            <div class="servicio-total" data-servicio-id="${s.IDServicio}">Total: $${formatCurrency(s.Costo)}</div>
                        </div>
                    </div>
                </label>
                <button type="button" class="servicio-info-btn" aria-label="Más info de ${s.NombreServicio}"><span>i</span></button>
                <div class="servicio-tooltip" aria-hidden="true">${renderServicioTooltip(info)}</div>
            `;
            container.appendChild(div);
        });
    } catch(e){ console.error('Error cargando servicios:',e); container.innerHTML='<p class="nr-empty">No se pudieron cargar los servicios. Intenta recargar.</p>'; }
}

async function cargarMetodosPago() {
    try {
        const r = await fetch('/api/metodopago');
        const metodos = await r.json();
        const sel = document.getElementById('MetodoPago');
        const permitidos = metodos.filter(m=>{
            const n=(m.NomMetodoPago||'').toLowerCase();
            return n.includes('efectivo')||n.includes('transferencia');
        });
        permitidos.forEach(m=>{
            const opt=document.createElement('option');
            opt.value=m.IdMetodoPago;
            opt.textContent=m.NomMetodoPago;
            sel.appendChild(opt);
        });
    } catch(e){ console.error('Error cargando métodos de pago:',e); }
}

/* ──────────────────────────────────────────────────
   DISPONIBILIDAD / FECHAS
────────────────────────────────────────────────── */
async function cargarReservasConfirmadasPorAlojamiento(id,type='habitacion') {
    try {
        if (!id) return [];
        const r = await fetch(`/api/reservas/confirmed/accommodation/${id}?type=${type}`);
        if (!r.ok) return [];
        return await r.json();
    } catch(e){ return []; }
}

function getSelectedRoomId() {
    const hSel=document.getElementById('IDHabitacion');
    const pSel=document.getElementById('IDPaquete');
    const cSel=document.getElementById('IDCabana');
    if (hSel.value!=='') return hSel.value;
    if (pSel.value!=='') return pSel.value;
    if (cSel.value!=='') return cSel.value;
    return null;
}
function getSelectedAccommodationType() {
    if (document.getElementById('IDHabitacion').value!=='') return 'habitacion';
    if (document.getElementById('IDPaquete').value!=='')    return 'paquete';
    if (document.getElementById('IDCabana').value!=='')     return 'cabana';
    return 'habitacion';
}
function getRoomBlockedRanges(roomId) {
    if (!roomId) return [];
    return allReservations.filter(r=>r.FechaInicio&&r.FechaFinalizacion)
        .map(r=>({start:formatDateForInput(r.FechaInicio),end:formatDateForInput(r.FechaFinalizacion)}));
}
function isRangeOverlapping(start,end,range) { return !(end<range.start||start>range.end); }

async function updateDatePickerRestrictions() {
    const roomId = getSelectedRoomId();
    const type   = getSelectedAccommodationType();
    const confirmed = roomId ? await cargarReservasConfirmadasPorAlojamiento(roomId,type) : [];
    allReservations = confirmed;
    const disabled = getDisabledDatesForRoom(roomId);
    const today = getTodayInputValue();
    if (fpStart){ fpStart.set('disable',disabled); fpStart.set('minDate',today); }
    if (fpEnd)  { fpEnd.set('disable',disabled);   fpEnd.set('minDate',today); }
}
function getDisabledDatesForRoom(roomId) {
    if (!roomId) return [];
    const dates=[];
    getRoomBlockedRanges(roomId).forEach(range=>{
        let d=new Date(range.start);
        const end=new Date(range.end);
        while(d<=end){ dates.push(formatDateForInput(d.toISOString())); d.setDate(d.getDate()+1); }
    });
    return dates;
}
function updateDateLimits() {
    const today = getTodayInputValue();
    document.getElementById('FechaInicio').min=today;
    document.getElementById('FechaFinalizacion').min=today;
}
function updateAvailabilityMessage() {
    const roomId = getSelectedRoomId();
    const el = document.getElementById('dateAvailabilityMessage');
    if (!el) return;
    if (!roomId) { el.innerHTML='<em>Selecciona una habitación, cabaña o paquete para ver las fechas disponibles.</em>'; el.style.color='rgba(26,43,74,0.65)'; return; }
    const blocked = getRoomBlockedRanges(roomId);
    if (!blocked.length) { el.innerHTML='<strong style="color:#16a34a;">✓ Disponible:</strong> El alojamiento seleccionado está completamente disponible.'; el.style.color='rgba(26,43,74,0.8)'; return; }
    const txt=blocked.map(r=>{
        const s=new Date(r.start).toLocaleDateString('es-CO',{month:'short',day:'numeric'});
        const e=new Date(r.end).toLocaleDateString('es-CO',{month:'short',day:'numeric'});
        return `${s} - ${e}`;
    }).join('; ');
    el.innerHTML=`<strong style="color:#dc2626;">⚠ Fechas ocupadas:</strong> ${txt}`; el.style.color='rgba(26,43,74,0.8)';
}
function validateDateSelection() {
    const roomId = getSelectedRoomId();
    const sIn = document.getElementById('FechaInicio');
    const eIn = document.getElementById('FechaFinalizacion');
    const sv=sIn.value, ev=eIn.value, today=getTodayInputValue();
    const blocked = getRoomBlockedRanges(roomId);
    let se='',ee='';
    if (sv&&sv<today) se='La fecha de inicio no puede ser anterior a hoy.';
    if (ev&&ev<today) ee='La fecha de finalización no puede ser anterior a hoy.';
    if (sv&&ev&&ev<=sv) ee='La fecha de finalización debe ser al menos el día siguiente al de inicio.';
    if (roomId&&sv&&ev&&blocked.some(r=>isRangeOverlapping(sv,ev,r))) { se=ee='El rango se superpone con una reserva confirmada.'; }
    sIn.setCustomValidity(se); eIn.setCustomValidity(ee);
    return !sIn.validationMessage&&!eIn.validationMessage;
}

/* ──────────────────────────────────────────────────
   DETALLES DE ALOJAMIENTO
────────────────────────────────────────────────── */
function mostrarDetalleHabitacion(id) {
    const card=document.getElementById('detalleHabitacion');
    if (!id){ card.style.display='none'; return; }
    const h=habitacionesData.find(h=>h.IDHabitacion==id);
    if (!h) return;
    card.innerHTML=`<h4>${h.NombreHabitacion}</h4><p>${h.Descripcion}</p><span class="precio-tag">$${Number(h.Costo||0).toLocaleString()} / noche</span>`;
    card.style.display='block';
}
function mostrarDetallePaquete(id) {
    const detalleInline=document.getElementById('detallePaquete');
    if (detalleInline){ detalleInline.style.display='none'; detalleInline.className='nr-detalle'; }
    mostrarPreviewPaquete(id);
}

function mostrarPreviewPaquete(id) {
    const card=document.getElementById('previewPaqueteCard');
    if (!card) return;
    if (!id){ limpiarRestriccionPaquete(); card.style.display='none'; card.innerHTML=''; return; }
    const p=paquetesData.find(p=>String(p.IDPaquete)===String(id));
    if (!p) return;
    const paqueteNombre=p.NombrePaquete||p.nombre||'Paquete';
    const descripcion=p.Descripcion||p.descripcion||'';
    const precioPaquete=p.Precio||p.precio||0;
    const imgUrl=getImageUrl(p);
    card.innerHTML=`
        <button type="button" class="nr-preview-close" aria-label="Quitar paquete" title="Quitar paquete">×</button>
        <div class="nr-preview-card__inner">
            <div class="nr-preview-card__image" style="background-image:url('${imgUrl||'../assets/images/placeholder.jpg'}')"></div>
            <div class="nr-preview-card__content">
                <span class="nr-preview-tipo">📦 Paquete</span>
                <h3>${paqueteNombre}</h3>
                <p class="nr-preview-desc">${descripcion}</p>
                <div class="nr-preview-price">$${Number(precioPaquete).toLocaleString()}</div>
                <button type="button" class="nr-preview-detail-btn" data-type="paquete" data-id="${id}">👁 Ver detalles</button>
            </div>
        </div>
    `;
    card.dataset.type='paquete'; card.dataset.activeId=String(id); card.style.display='block';
    aplicarRestriccionPaquete(p);
    card.querySelector('.nr-preview-close').addEventListener('click',()=>{
        limpiarRestriccionPaquete();
        document.getElementById('IDPaquete').value='';
        card.style.display='none'; card.innerHTML='';
        calcularTotal(); updateAvailabilityMessage(); validateDateSelection(); updateSelectStates(); updateDatePickerRestrictions();
    });
    card.querySelector('.nr-preview-detail-btn').addEventListener('click',(e)=>{
        mostrarModalDetalle(e.currentTarget.dataset.type,e.currentTarget.dataset.id);
    });
}
function mostrarDetalleCabana(id) {
    const card=document.getElementById('detalleCabana');
    if (!id){ card.style.display='none'; return; }
    const c=cabanasData.find(c=>c.IDCabana==id);
    if (!c) return;
    card.innerHTML=`<h4>${c.NombreCabana}</h4><p>${c.Descripcion||'Cabaña acogedora.'}</p><p>👥 ${c.CapacidadPersonas} personas</p><span class="precio-tag">$${Number(c.PrecioNoche||0).toLocaleString()} / noche</span>`;
    card.style.display='block';
}

function getImageUrl(item) {
    if (!item) return '';
    if (item.Fotos&&Array.isArray(item.Fotos)&&item.Fotos.length>0) return item.Fotos[0].url||item.Fotos[0];
    if (item.imagenes&&Array.isArray(item.imagenes)&&item.imagenes.length>0) return item.imagenes[0].url||item.imagenes[0];
    return item.imagen||item.Imagen||item.ImagenCabana||item.imagenUrl||item.urlImagen||item.Foto||item.foto||'';
}
function handleClosePreview() {
    const preview=document.getElementById('previewCard');
    if (!preview) return;
    const type=preview.dataset.type;
    if (type==='habitacion'){ document.getElementById('IDHabitacion').value=''; mostrarDetalleHabitacion(''); populatePaquetes(null,false); updateAvailabilityMessage(); validateDateSelection(); updateDatePickerRestrictions(); }
    if (type==='cabana'){ document.getElementById('IDCabana').value=''; }
    preview.dataset.type=''; preview.dataset.activeId=''; preview.style.display='none'; preview.innerHTML='';
    calcularTotal(); updateSelectStates();
}
async function mostrarPreviewItem(type,id) {
    const preview=document.getElementById('previewCard');
    if (!preview) return;
    if (!id){ preview.style.display='none'; preview.innerHTML=''; preview.dataset.type=''; preview.dataset.activeId=''; return; }
    let data=null;
    if (type==='habitacion') data=habitacionesData.find(h=>String(h.IDHabitacion)===String(id));
    if (type==='cabana')     data=cabanasData.find(c=>String(c.IDCabana)===String(id));
    const imgC=getImageUrl(data);
    if ((!imgC||imgC==='')&&type==='habitacion') {
        try { const r=await fetch(`/api/habitaciones/${id}`); if (r.ok){ const full=await r.json(); if (full) data=Object.assign({},data||{},full); } } catch(e){}
    }
    if (!data){ preview.style.display='none'; preview.innerHTML=''; preview.dataset.type=''; preview.dataset.activeId=''; return; }
    const imgUrl=getImageUrl(data);
    const title=data.NombreHabitacion||data.NombreCabana||data.nombre||'Alojamiento';
    const desc=data.Descripcion||data.descripcion||'';
    const cap=data.CapacidadPersonas||data.Capacidad||'';
    const habs=data.NumeroHabitaciones||'';
    const precio=data.Costo||data.PrecioNoche||data.precio||0;
    preview.innerHTML=`
        <button type="button" class="nr-preview-close" aria-label="Cerrar">×</button>
        <div class="nr-preview-card__inner">
            <div class="nr-preview-card__image" style="background-image:url('${imgUrl||''}')"></div>
            <div class="nr-preview-card__content">
                <h3>${title}</h3>
                <p class="nr-preview-desc">${desc}</p>
                <div class="nr-preview-meta">
                    ${cap?`<span>👥 ${cap} personas</span>`:''}
                    ${habs?`<span>🛏️ ${habs} hab.</span>`:''}
                </div>
                <div class="nr-preview-price">$${Number(precio).toLocaleString()} / noche</div>
                <button type="button" class="nr-preview-detail-btn" data-type="${type}" data-id="${id}">👁 Ver detalles</button>
            </div>
        </div>`;
    preview.dataset.type=type; preview.dataset.activeId=String(id); preview.style.display='block';
    preview.querySelector('.nr-preview-close').addEventListener('click',handleClosePreview);
    preview.querySelector('.nr-preview-detail-btn').addEventListener('click',(e)=>{
        mostrarModalDetalle(e.currentTarget.dataset.type,e.currentTarget.dataset.id);
    });
    ['detalleHabitacion','detalleCabana','detallePaquete'].forEach(id=>{ const el=document.getElementById(id); if (el) el.style.display='none'; });
}

/* ──────────────────────────────────────────────────
   MODAL DE DETALLE
────────────────────────────────────────────────── */
function mostrarModalDetalle(type,id) {
    let data=null;
    if (type==='habitacion') data=habitacionesData.find(h=>String(h.IDHabitacion)===String(id));
    if (type==='cabana')     data=cabanasData.find(c=>String(c.IDCabana)===String(id));
    if (type==='paquete')    data=paquetesData.find(p=>String(p.IDPaquete)===String(id));
    if (!data) return;
    const modal=document.getElementById('detalleModal');
    const content=document.getElementById('detalleModalContent');
    if (!modal||!content) return;
    const imgUrl=getImageUrl(data);
    let tipoLabel,titulo,descripcion,precio,sufijoPrecio,stats,incluidos;
    if (type==='habitacion') {
        tipoLabel='🛏️ Habitación'; titulo=data.NombreHabitacion||'Habitación';
        descripcion=data.Descripcion||data.descripcion||''; precio=data.Costo||data.precio||0; sufijoPrecio='/ noche';
        stats=[data.CapacidadPersonas?`👥 ${data.CapacidadPersonas} personas`:null,data.NumeroHabitaciones?`🛏️ ${data.NumeroHabitaciones} hab.`:null,data.tipo?`🏷️ ${data.tipo}`:null].filter(Boolean);
        incluidos=[];
    } else if (type==='cabana') {
        tipoLabel='🏡 Cabaña'; titulo=data.NombreCabana||'Cabaña';
        descripcion=data.Descripcion||data.descripcion||''; precio=data.PrecioNoche||data.precio||0; sufijoPrecio='/ noche';
        stats=[data.CapacidadPersonas?`👥 ${data.CapacidadPersonas} personas`:null,data.NumeroHabitaciones?`🛏️ ${data.NumeroHabitaciones} hab.`:null].filter(Boolean);
        incluidos=[];
    } else {
        tipoLabel='📦 Paquete'; titulo=data.NombrePaquete||'Paquete';
        descripcion=data.Descripcion||data.descripcion||''; precio=data.Precio||data.precio||0; sufijoPrecio='';
        stats=[];
        incluidos=[
            data.NombreHabitacion?`🛏️ Alojamiento: ${data.NombreHabitacion}`:null,
            data.NombreCabana?`🏡 Alojamiento: ${data.NombreCabana}`:null,
            ...(data.NombreServicio?data.NombreServicio.split(',').map(s=>`✨ ${s.trim()}`):[]),
        ].filter(Boolean);
    }
    content.innerHTML=`
        <div class="nr-modal__image" ${imgUrl?`style="background-image:url('${imgUrl}')"`:''}></div>
        <div class="nr-modal__body">
            <span class="nr-modal__tipo">${tipoLabel}</span>
            <h2 class="nr-modal__titulo">${titulo}</h2>
            <p class="nr-modal__desc">${descripcion}</p>
            ${stats.length?`<div class="nr-modal__stats">${stats.map(s=>`<div class="nr-modal__stat">${s}</div>`).join('')}</div>`:''}
            ${incluidos.length?`
            <div class="nr-modal__incluidos">
                <p class="nr-modal__incluidos-titulo">Incluye</p>
                <ul class="nr-modal__incluidos-list">${incluidos.map(i=>`<li>${i}</li>`).join('')}</ul>
            </div>`:''}
            <div class="nr-modal__precio">
                <span class="nr-modal__precio-label">${sufijoPrecio?'Precio por noche':'Precio del paquete'}</span>
                <span class="nr-modal__precio-val">$${Number(precio).toLocaleString()}${sufijoPrecio?` <small>${sufijoPrecio}</small>`:''}</span>
            </div>
        </div>`;
    modal.style.display='flex';
    document.getElementById('detalleModalClose').onclick=cerrarModal;
    modal.onclick=(e)=>{ if(e.target===modal) cerrarModal(); };
}
function cerrarModal() {
    const modal=document.getElementById('detalleModal');
    if (modal) modal.style.display='none';
}

/* ──────────────────────────────────────────────────
   CALCULAR TOTAL
────────────────────────────────────────────────── */
function calcularTotal() {
    const noches=actualizarContadorNoches();
    const animate=(elId,newVal)=>{ const el=document.getElementById(elId); if(!el)return; el.style.transition='opacity 0.15s'; el.style.opacity='0'; setTimeout(()=>{ el.textContent=`$${formatCurrency(newVal)}`; el.style.opacity='1'; },120); };
    if (noches<=0){ animate('subtotal',0); animate('iva',0); animate('total',0); actualizarDesglose(); actualizarSubtotalServicios(); return; }
    const { multiplicador } = getSeasonalInfo(
        document.getElementById('FechaInicio')?.value,
        document.getElementById('FechaFinalizacion')?.value
    );
    let precioAloj=0;
    const pSel=document.getElementById('IDPaquete');
    if (pSel.value) {
        const p=paquetesData.find(p=>String(p.IDPaquete)===String(pSel.value));
        if (p) precioAloj += parseFloat(p.Precio||p.precio||0)*noches*multiplicador;
    }
    const hSel=document.getElementById('IDHabitacion');
    if (hSel.value) {
        const h=habitacionesData.find(h=>String(h.IDHabitacion)===String(hSel.value));
        if (h) precioAloj += parseFloat(h.Costo||h.precio||0)*noches*multiplicador;
    }
    const cSel=document.getElementById('IDCabana');
    if (cSel.value) {
        const c=cabanasData.find(c=>String(c.IDCabana)===String(cSel.value));
        if (c) precioAloj += parseFloat(c.PrecioNoche||0)*noches*multiplicador;
    }
    const totalServ=Array.from(document.querySelectorAll('.servicio-check:checked')).reduce((sum,s)=>sum+(parseFloat(s.dataset.costo)*getServicioQuantity(s.value)),0);
    const sub_total=precioAloj+totalServ;
    const sub=Math.round((sub_total / 1.19)*100)/100;
    const iva=Math.round((sub_total - sub)*100)/100;
    const total=sub_total;
    animate('subtotal',sub); animate('iva',iva); animate('total',total);
    actualizarDesglose(); actualizarSubtotalServicios();
}

/* ──────────────────────────────────────────────────
   SERVICIOS — HELPERS
────────────────────────────────────────────────── */
function getServicioQuantity(servicioId) {
    const input=document.querySelector(`.servicio-quantity-input[data-servicio-id="${servicioId}"]`);
    const s=serviciosData.find(s=>String(s.IDServicio)===String(servicioId));
    const ctrl=s?getServicioControlInfo(s):{min:1,max:1};
    if (!input) return ctrl.min;
    let v=parseInt(input.value,10);
    if (isNaN(v)) v=ctrl.min;
    if (v<ctrl.min) v=ctrl.min;
    if (v>ctrl.max) v=ctrl.max;
    input.value=v; return v;
}
function updateServicioTotal(servicioId) {
    const item=document.querySelector(`.servicio-item[data-servicio-id="${servicioId}"]`);
    const s=serviciosData.find(s=>String(s.IDServicio)===String(servicioId));
    if (!item||!s) return;
    const q=getServicioQuantity(servicioId);
    const t=q*Number(s.Costo||0);
    const el=item.querySelector(`.servicio-total[data-servicio-id="${servicioId}"]`);
    if (el) el.textContent=`Total: $${formatCurrency(t)}`;
}
function toggleServicioDetails(servicioId,isActive) {
    const item=document.querySelector(`.servicio-item[data-servicio-id="${servicioId}"]`);
    if (!item) return;
    item.classList.toggle('active',isActive);
    const qInput=item.querySelector('.servicio-quantity-input');
    if (qInput){ qInput.disabled=!isActive; if(!isActive){ qInput.value=1; const h=item.querySelector('.servicio-help'); if(h) h.textContent=''; } }
    item.querySelectorAll('.servicio-step-btn').forEach(btn => { btn.disabled = !isActive; });
    if (!isActive) item.classList.remove('tooltip-open');
    updateServicioTotal(servicioId);
}

/* ──────────────────────────────────────────────────
   EVENTOS
────────────────────────────────────────────────── */
// Búsqueda de cliente
const btnBuscarCliente = document.getElementById('btnBuscarCliente');
if (btnBuscarCliente) btnBuscarCliente.addEventListener('click', buscarClientePorDocumento);
const buscarDocumentoInput = document.getElementById('buscarDocumento');
if (buscarDocumentoInput) buscarDocumentoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); buscarClientePorDocumento(); }
});

const habitacionInput        = document.getElementById('IDHabitacion');
const paqueteInput           = document.getElementById('IDPaquete');
const cabanaInput            = document.getElementById('IDCabana');
const fechaInicioInput       = document.getElementById('FechaInicio');
const fechaFinalizacionInput = document.getElementById('FechaFinalizacion');

habitacionInput.addEventListener('change', async(e)=>{
    mostrarPreviewItem('habitacion',e.target.value);
    populatePaquetes(null,false);
    calcularTotal(); updateAvailabilityMessage(); validateDateSelection(); updateSelectStates();
    await updateDatePickerRestrictions();
});
cabanaInput.addEventListener('change', async(e)=>{
    mostrarPreviewItem('cabana',e.target.value);
    calcularTotal(); updateSelectStates();
    await updateDatePickerRestrictions();
});
paqueteInput.addEventListener('change', async(e)=>{
    mostrarDetallePaquete(e.target.value);
    calcularTotal(); updateAvailabilityMessage(); validateDateSelection(); updateSelectStates();
    await updateDatePickerRestrictions();
});
fechaInicioInput.addEventListener('change',()=>{
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
    actualizarContadorNoches(); calcularTotal(); updateAvailabilityMessage(); validateDateSelection();
});
fechaFinalizacionInput.addEventListener('change',()=>{
    actualizarContadorNoches(); calcularTotal(); validateDateSelection();
});
document.addEventListener('change',(e)=>{
    if (e.target.classList.contains('servicio-check')) { toggleServicioDetails(e.target.value,e.target.checked); calcularTotal(); return; }
    if (e.target.classList.contains('servicio-quantity-input')) {
        const sid=e.target.dataset.servicioId;
        const s=serviciosData.find(s=>String(s.IDServicio)===String(sid));
        const ctrl=getServicioControlInfo(s||{});
        let q=parseInt(e.target.value,10);
        if (isNaN(q)||q<ctrl.min) q=ctrl.min;
        if (q>ctrl.max) q=ctrl.max;
        e.target.value=q;
        const help=e.target.closest('.servicio-item')?.querySelector('.servicio-help');
        if (help) help.textContent=q===ctrl.max?`Máximo ${ctrl.max} ${ctrl.unit} permitidos.`:'';
        if (e.target.closest('.servicio-item')?.querySelector('.servicio-check')?.checked) { updateServicioTotal(sid); calcularTotal(); }
    }
});
document.addEventListener('click',(e)=>{
    // El botón "!" solo muestra el tooltip al pasar el mouse (hover CSS).
    if (e.target.closest('.servicio-info-btn')) { e.stopPropagation(); return; }
    const stepBtn = e.target.closest('.servicio-step-btn');
    if (stepBtn && !stepBtn.disabled) {
        const sid = stepBtn.dataset.servicioId;
        const input = document.querySelector(`.servicio-quantity-input[data-servicio-id="${sid}"]`);
        if (input && !input.disabled) {
            const current = parseInt(input.value, 10) || 0;
            input.value = current + Number(stepBtn.dataset.dir);
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
});

/* ──────────────────────────────────────────────────
   ENVIAR FORMULARIO
────────────────────────────────────────────────── */
document.getElementById('reservationForm').addEventListener('submit', async(e)=>{
    e.preventDefault();
    if (!validateDateSelection()) return;

    const habitacionVal = document.getElementById('IDHabitacion').value;
    const cabanaVal     = document.getElementById('IDCabana').value;
    const paqueteVal    = document.getElementById('IDPaquete').value;
    const metodoPagoVal = document.getElementById('MetodoPago').value;

    const clienteId = document.getElementById('IDClienteReserva').value;
    if (!clienteId) {
        mostrarNotificacion('Debes seleccionar el cliente para quien es la reserva.','warning');
        return;
    }
    if (!habitacionVal && !cabanaVal && !paqueteVal) {
        mostrarNotificacion('Debes seleccionar un alojamiento (habitación, cabaña o paquete).','warning');
        return;
    }
    if (!metodoPagoVal) {
        mostrarNotificacion('Debes seleccionar un método de pago.','warning');
        return;
    }

    const serviciosSeleccionados = Array.from(document.querySelectorAll('.servicio-check:checked')).map(s=>({
        IDServicio: parseInt(s.value),
        Cantidad: getServicioQuantity(s.value)
    }));

    const data = {
        IDHabitacion:       habitacionVal ? parseInt(habitacionVal) : null,
        IDCabana:           cabanaVal     ? parseInt(cabanaVal)     : null,
        IDPaquete:          paqueteVal    ? parseInt(paqueteVal)    : null,
        serviciosAdicionales: serviciosSeleccionados,
        FechaInicio:        document.getElementById('FechaInicio').value,
        FechaFinalizacion:  document.getElementById('FechaFinalizacion').value,
        MetodoPago:         metodoPagoVal ? parseInt(metodoPagoVal) : null,
        UsuarioIdusuario:   parseInt(clienteId)
    };

    const submitBtn = document.querySelector('.nr-btn-confirmar');
    if (submitBtn) { submitBtn.disabled=true; submitBtn.textContent='Creando reserva...'; }

    try {
        const response = await fetch('/api/reservas',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(data)
        });
        if (response.ok) {
            mostrarNotificacion('✓ Reserva creada correctamente.','success');
            setTimeout(()=>{ window.location.href='/src/pages/admin.html#reservas'; },1500);
        } else {
            const err = await response.json();
            mostrarNotificacion(err.message||'Error al crear la reserva.','error');
            if (submitBtn) { submitBtn.disabled=false; submitBtn.textContent='✓ Confirmar Reserva'; }
        }
    } catch(err) {
        mostrarNotificacion('Error de conexión con el servidor.','error');
        if (submitBtn) { submitBtn.disabled=false; submitBtn.textContent='✓ Confirmar Reserva'; }
    }
});

/* ──────────────────────────────────────────────────
   INICIALIZAR
────────────────────────────────────────────────── */
(async function init() {
    await Promise.allSettled([
        cargarClientes(),
        cargarHabitaciones(),
        cargarCabanas(),
        cargarPaquetes(),
        cargarServicios(),
        cargarMetodosPago()
    ]);

    updateDateLimits();
    updateAvailabilityMessage();
    updateSelectStates();

    const today    = getTodayInputValue();
    const tomorrow = getTomorrowInputValue();
    document.getElementById('FechaInicio').value        = today;
    document.getElementById('FechaFinalizacion').value  = tomorrow;

    fpStart = flatpickr('#FechaInicio',{
        locale:'es', minDate:today, disable:[], dateFormat:'Y-m-d', defaultDate:today,
        onChange(selectedDates){
            if (selectedDates.length>0) {
                const nextDay = new Date(selectedDates[0].getTime() + 86400000);
                if(fpEnd)fpEnd.set('minDate',formatDateForInput(nextDay.toISOString()));
                actualizarContadorNoches(); calcularTotal(); validateDateSelection();
            }
        }
    });
    fpEnd = flatpickr('#FechaFinalizacion',{
        locale:'es', minDate:today, disable:[], dateFormat:'Y-m-d', defaultDate:tomorrow,
        onChange(){ actualizarContadorNoches(); calcularTotal(); validateDateSelection(); }
    });

    actualizarContadorNoches();
    calcularTotal();
})();
