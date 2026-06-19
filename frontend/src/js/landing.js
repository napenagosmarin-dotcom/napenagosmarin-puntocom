document.addEventListener('DOMContentLoaded', () => {
    cargarDatosLanding();
});

async function cargarDatosLanding() {
    // Cargamos cada sección de forma independiente para que un error no afecte a las demás
    await Promise.allSettled([
        cargarHabitaciones(),
        cargarCabanas(),
        cargarPaquetes(),
        cargarServicios()
    ]);
}

async function cargarHabitaciones() {
    try {
        const res = await fetch('/api/habitaciones');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        renderizarHabitaciones(lista.filter(h => Number(h.Estado) === 1));
    } catch (error) {
        console.error("Error al cargar habitaciones:", error);
        const contenedor = document.getElementById('grid-habitaciones');
        if (contenedor) contenedor.innerHTML = '<p style="color: rgba(26,43,74,0.5); text-align: center; grid-column: 1 / -1; padding: 40px;">No hay habitaciones disponibles en este momento.</p>';
    }
}

async function cargarCabanas() {
    try {
        const res = await fetch('/api/cabanas');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        renderizarCabanas(lista.filter(c => Number(c.Estado) === 1));
    } catch (error) {
        console.error("Error al cargar cabañas:", error);
        const contenedor = document.getElementById('grid-cabanas');
        if (contenedor) contenedor.innerHTML = '<p style="color: rgba(26,43,74,0.5); text-align: center; grid-column: 1 / -1; padding: 40px;">No hay cabañas disponibles en este momento.</p>';
    }
}

async function cargarPaquetes() {
    try {
        const res = await fetch('/api/paquetes');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        renderizarPaquetes(lista.filter(p => Number(p.Estado) === 1));
    } catch (error) {
        console.error("Error al cargar paquetes:", error);
        const contenedor = document.getElementById('grid-paquetes');
        if (contenedor) contenedor.innerHTML = '<p style="color: rgba(26,43,74,0.5); text-align: center; grid-column: 1 / -1; padding: 40px;">No hay paquetes disponibles en este momento.</p>';
    }
}

async function cargarServicios() {
    try {
        const res = await fetch('/api/servicios');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        renderizarServicios(lista.filter(s => Number(s.Estado) === 1));
    } catch (error) {
        console.error("Error al cargar servicios:", error);
        const contenedor = document.getElementById('grid-servicios');
        if (contenedor) contenedor.innerHTML = '<p style="color: rgba(26,43,74,0.5); text-align: center; grid-column: 1 / -1; padding: 40px;">No hay servicios disponibles en este momento.</p>';
    }
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

// Obtener URL de imagen correctamente (puede ser URL completa o ruta local)
function obtenerImagen(img, fallback) {
    if (!img || img.trim() === '') return fallback;
    // Si ya es una URL completa (http/https), usarla directo
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    // Si es una ruta relativa, asumirla como archivo local
    if (img.startsWith('/')) return img;
    return `/uploads/${img}`;
}

// Escapar JSON para uso en atributos HTML onclick
function escaparParaAtributo(obj) {
    return JSON.stringify(obj).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function renderizarHabitaciones(habitaciones) {
    const contenedor = document.getElementById('grid-habitaciones');
    if (!contenedor) return;

    if (habitaciones.length === 0) {
        contenedor.innerHTML = '<p style="color: rgba(26,43,74,0.5); text-align: center; grid-column: 1 / -1; padding: 40px;">No hay habitaciones disponibles en este momento.</p>';
        return;
    }

    const fallbackImg = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';
    let html = '';
    
    habitaciones.forEach(hab => {
        const nombre = hab.NombreHabitacion || hab.nombre || 'Habitación';
        const precio = Number(hab.Precio || hab.precio || 0);
        const tipo = hab.TipoHabitacion || hab.tipo || 'Exclusiva';
        const descripcion = hab.Descripcion || hab.descripcion || '';
        const imagen = obtenerImagen(hab.imagen || hab.ImagenHabitacion, fallbackImg);
        const capacidad = hab.CapacidadMaxima || hab.capacidad || '';
        const camas = hab.Camas || hab.camas || '';

        const dataObj = {
            tipo: 'habitacion',
            nombre: nombre,
            precio: precio,
            categoria: tipo,
            descripcion: descripcion,
            imagen: imagen,
            capacidad: capacidad,
            camas: camas
        };

        html += `
        <div class="room-card" onclick='abrirModalDetalle(${escaparParaAtributo(dataObj)})'>
            <img src="${imagen}" alt="${nombre}" onerror="this.src='${fallbackImg}'"/>
            <div class="room-card-overlay">
                <span class="room-tag">${tipo}</span>
                <div class="room-name">${nombre}</div>
                <div class="room-price">Desde <span>${formatearMoneda(precio)}</span> / noche</div>
            </div>
            <div class="room-arrow">→</div>
        </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

function renderizarCabanas(cabanas) {
    const contenedor = document.getElementById('grid-cabanas');
    if (!contenedor) return;

    if (cabanas.length === 0) {
        contenedor.innerHTML = '<p style="color: rgba(26,43,74,0.5); text-align: center; grid-column: 1 / -1; padding: 40px;">No hay cabañas disponibles en este momento.</p>';
        return;
    }

    const fallbackImg = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80';
    let html = '';

    cabanas.forEach(cab => {
        const nombre = cab.NombreCabana || cab.nombre || 'Cabaña';
        const precio = Number(cab.PrecioNoche || cab.precio || 0);
        const descripcion = cab.Descripcion || cab.descripcion || '';
        const imagen = obtenerImagen(cab.ImagenCabana || cab.imagen, fallbackImg);
        const capacidad = cab.CapacidadPersonas || cab.capacidad || '';
        const habitaciones = cab.NumeroHabitaciones || '';

        const dataObj = {
            tipo: 'cabana',
            nombre: nombre,
            precio: precio,
            descripcion: descripcion,
            imagen: imagen,
            capacidad: capacidad,
            habitaciones: habitaciones
        };

        html += `
        <div class="room-card" onclick='abrirModalDetalle(${escaparParaAtributo(dataObj)})'>
            <img src="${imagen}" alt="${nombre}" onerror="this.src='${fallbackImg}'"/>
            <div class="room-card-overlay">
                <span class="room-tag">Cabaña</span>
                <div class="room-name">${nombre}</div>
                <div class="room-price">Desde <span>${formatearMoneda(precio)}</span> / noche</div>
            </div>
            <div class="room-arrow">→</div>
        </div>
        `;
    });

    contenedor.innerHTML = html;
}

function renderizarPaquetes(paquetes) {
    const contenedor = document.getElementById('grid-paquetes');
    if (!contenedor) return;

    if (paquetes.length === 0) {
        contenedor.innerHTML = '<p style="color: rgba(26,43,74,0.5); text-align: center; grid-column: 1 / -1; padding: 40px;">No hay paquetes disponibles en este momento.</p>';
        return;
    }

    const fallbackImg = 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=800&q=80';
    let html = '';
    
    paquetes.forEach(paq => {
        const nombre = paq.NombrePaquete || paq.nombre || 'Paquete';
        const precio = Number(paq.Precio || paq.precio || 0);
        const descripcion = paq.Descripcion || paq.descripcion || '';
        const imagen = obtenerImagen(paq.imagen, fallbackImg);
        const habitacion = paq.NombreHabitacion || '';
        const cabana = paq.NombreCabana || '';
        const servicios = paq.NombreServicio || '';
        const descuento = Number(paq.Descuento || 0);

        const dataObj = {
            tipo: 'paquete',
            nombre: nombre,
            precio: precio,
            descripcion: descripcion,
            imagen: imagen,
            habitacion: habitacion,
            cabana: cabana,
            servicios: servicios,
            descuento: descuento
        };

        html += `
        <div class="room-card" onclick='abrirModalDetalle(${escaparParaAtributo(dataObj)})'>
            <img src="${imagen}" alt="${nombre}" onerror="this.src='${fallbackImg}'"/>
            <div class="room-card-overlay">
                <span class="room-tag">Experiencia</span>
                <div class="room-name">${nombre}</div>
                <div class="room-price">Desde <span>${formatearMoneda(precio)}</span></div>
            </div>
            <div class="room-arrow">→</div>
        </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

function renderizarServicios(servicios) {
    const contenedor = document.getElementById('grid-servicios');
    if (!contenedor) return;

    if (servicios.length === 0) {
        contenedor.innerHTML = '<p style="color: rgba(26,43,74,0.5); text-align: center; grid-column: 1 / -1; padding: 40px;">No hay servicios disponibles en este momento.</p>';
        return;
    }

    const iconos = ['fa-utensils', 'fa-spa', 'fa-water', 'fa-landmark', 'fa-dumbbell', 'fa-wine-glass', 'fa-concierge-bell', 'fa-leaf', 'fa-gem', 'fa-coffee'];
    let html = '';
    
    servicios.forEach((serv, index) => {
        const nombre = serv.nombre || serv.NombreServicio || 'Servicio';
        const precio = Number(serv.precio || serv.Costo || 0);
        const descripcion = serv.Descripcion || serv.descripcion || 'Servicio exclusivo de Aura Travel.';
        const duracion = serv.Duracion || serv.duracion || '';
        const capacidad = serv.CantidadMaximaPersonas || '';
        const iconClass = iconos[index % iconos.length];
        
        const descCorta = descripcion.length > 90 ? descripcion.substring(0, 90) + '...' : descripcion;

        const dataObj = {
            tipo: 'servicio',
            nombre: nombre,
            precio: precio,
            descripcion: descripcion,
            duracion: duracion,
            capacidad: capacidad
        };

        html += `
        <div class="service-card reveal" onclick='abrirModalDetalle(${escaparParaAtributo(dataObj)})'>
            <div class="service-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="service-name">${nombre}</div>
            <p class="service-desc">${descCorta}</p>
            <div class="service-line"></div>
        </div>
        `;
    });
    
    contenedor.innerHTML = html;

    // Re-observar los nuevos elementos para las animaciones de scroll
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    contenedor.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════
// MODAL PREMIUM
// ═══════════════════════════════════════════════

function abrirModalDetalle(data) {
    const modalOverlay = document.getElementById('landingModalOverlay');
    const img = document.getElementById('lm-img');
    const tag = document.getElementById('lm-tag');
    const title = document.getElementById('lm-title');
    const price = document.getElementById('lm-price');
    const priceSuffix = document.getElementById('lm-price-suffix');
    const desc = document.getElementById('lm-desc');
    const features = document.getElementById('lm-features');

    features.innerHTML = '';

    if (data.tipo === 'habitacion') {
        img.src = data.imagen;
        img.onerror = function() { this.src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80'; };
        tag.textContent = data.categoria || 'Exclusiva';
        title.textContent = data.nombre;
        price.textContent = formatearMoneda(data.precio);
        priceSuffix.textContent = '/ noche';
        desc.textContent = data.descripcion || 'Experimente el lujo en su máxima expresión en esta estancia inigualable de Aura Travel.';

        if (data.capacidad) agregarCaracteristica('fa-user-friends', `Hasta ${data.capacidad} personas`);
        if (data.camas) agregarCaracteristica('fa-bed', `Camas: ${data.camas}`);
        agregarCaracteristica('fa-wifi', 'Wi-Fi Premium');
        agregarCaracteristica('fa-coffee', 'Desayuno Incluido');
        agregarCaracteristica('fa-snowflake', 'Aire Acondicionado');
        agregarCaracteristica('fa-tv', 'TV Smart');

    } else if (data.tipo === 'paquete') {
        img.src = data.imagen;
        img.onerror = function() { this.src = 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=800&q=80'; };
        tag.textContent = 'Paquete Especial';
        title.textContent = data.nombre;
        price.textContent = formatearMoneda(data.precio);
        priceSuffix.textContent = 'total';
        desc.textContent = data.descripcion || 'Un paquete diseñado para crear recuerdos inolvidables en Aura Travel.';

        if (data.habitacion) agregarCaracteristica('fa-bed', `Habitación: ${data.habitacion}`);
        if (data.cabana) agregarCaracteristica('fa-home', `Cabaña: ${data.cabana}`);
        if (data.servicios) agregarCaracteristica('fa-concierge-bell', `Servicios: ${data.servicios}`);
        if (data.descuento > 0) agregarCaracteristica('fa-tag', `Descuento: ${data.descuento}%`);
        agregarCaracteristica('fa-star', 'Experiencia Única');

    } else if (data.tipo === 'cabana') {
        img.src = data.imagen;
        img.onerror = function() { this.src = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80'; };
        tag.textContent = 'Cabaña';
        title.textContent = data.nombre;
        price.textContent = formatearMoneda(data.precio);
        priceSuffix.textContent = '/ noche';
        desc.textContent = data.descripcion || 'Disfrute de nuestra cabaña en contacto con la naturaleza.';

        if (data.capacidad) agregarCaracteristica('fa-user-friends', `Hasta ${data.capacidad} personas`);
        if (data.habitaciones) agregarCaracteristica('fa-bed', `${data.habitaciones} habitación(es)`);
        agregarCaracteristica('fa-tree', 'Entorno Natural');
        agregarCaracteristica('fa-fire', 'Fogón / Chimenea');
        agregarCaracteristica('fa-wifi', 'Wi-Fi');

    } else if (data.tipo === 'servicio') {
        img.src = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80';
        tag.textContent = 'Servicio Premium';
        title.textContent = data.nombre;
        price.textContent = formatearMoneda(data.precio);
        priceSuffix.textContent = '';
        desc.textContent = data.descripcion || 'Disfrute de nuestros servicios de primera clase.';

        if (data.duracion) agregarCaracteristica('fa-clock', `Duración: ${data.duracion}`);
        if (data.capacidad) agregarCaracteristica('fa-users', `Capacidad: ${data.capacidad} personas`);
        agregarCaracteristica('fa-check-circle', 'Reserva con Prioridad');
        agregarCaracteristica('fa-gem', 'Calidad Premium');
    }

    document.body.style.overflow = 'hidden';
    modalOverlay.classList.add('active');
}

function agregarCaracteristica(icono, texto) {
    const features = document.getElementById('lm-features');
    features.innerHTML += `
        <div class="lm-feature">
            <i class="fas ${icono}"></i>
            <div>${texto}</div>
        </div>
    `;
}

function cerrarModalDetalle(event, forzarCierre = false) {
    if (forzarCierre || event.target.id === 'landingModalOverlay') {
        document.getElementById('landingModalOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }
}
