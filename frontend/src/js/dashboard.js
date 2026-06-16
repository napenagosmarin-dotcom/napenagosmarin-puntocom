/* ===== DASHBOARD.JS ===== */
/* Lógica del panel de control de Aura Travel */
/* Depende de: api.js (ya cargado antes en el HTML) */

// ── Mostrar fecha actual ──────────────────────────────────────────────────────
function mostrarFecha() {
  const el = document.getElementById('dashboard-fecha');
  if (!el) return;
  const ahora = new Date();
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = ahora.toLocaleDateString('es-CO', opciones);
}

// ── Animación de número ───────────────────────────────────────────────────────
function animarNumero(el, destino, duracion = 600) {
  const inicio = 0;
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

// ── Renderizar tabla Top Paquetes ─────────────────────────────────────────
function renderTopPaquetes(paquetes) {
  const contenedor = document.getElementById('tabla-top-paquetes');
  if (!contenedor) return;

  if (!paquetes || paquetes.length === 0) {
    contenedor.innerHTML = '<p class="dashboard-loading">No hay paquetes disponibles.</p>';
    return;
  }

  // Ordenar por precio descendente y tomar 5
  const top = [...paquetes].sort((a, b) => Number(b.precio || b.Precio || 0) - Number(a.precio || a.Precio || 0)).slice(0, 5);

  contenedor.innerHTML = `
    <table class="data-table">
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
              <td style="text-align: center; font-weight: bold; color: rgba(107,114,128,0.8);">${index + 1}</td>
              <td>${nombre}</td>
              <td>$${precio.toLocaleString('es-CO')}</td>
              <td>
                <span class="badge ${activo ? 'badge--activo' : 'badge--inactivo'}">
                  ${activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Renderizar tabla Top Servicios ────────────────────────────────────────
function renderTopServicios(servicios) {
  const contenedor = document.getElementById('tabla-top-servicios');
  if (!contenedor) return;

  if (!servicios || servicios.length === 0) {
    contenedor.innerHTML = '<p class="dashboard-loading">No hay servicios disponibles.</p>';
    return;
  }

  // Ordenar por precio descendente y tomar 5
  const top = [...servicios].sort((a, b) => Number(b.precio || b.Precio || 0) - Number(a.precio || a.Precio || 0)).slice(0, 5);
  
  contenedor.innerHTML = `
    <table class="data-table">
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
              <td style="text-align: center; font-weight: bold; color: rgba(107,114,128,0.8);">${index + 1}</td>
              <td>${nombre}</td>
              <td>$${precio.toLocaleString('es-CO')}</td>
              <td>
                <span class="badge ${activo ? 'badge--activo' : 'badge--inactivo'}">
                  ${activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Referencias a instancias de gráficas ─────────────────────────────────────
let chartCabanas  = null;
let chartClientes = null;
let chartReservas = null;

// ── Gráfica 1: Estado de cabañas (Dona) ──────────────────────────────────────
function renderGraficaCabanas(cabanas) {
  const canvas = document.getElementById('grafica-cabanas');
  if (!canvas) return;

  // Contar por estados (Activa e Inactiva)
  const conteo = { 'Activa': 0, 'Inactiva': 0 };
  cabanas.forEach(c => {
    if (Number(c.Estado) === 1) conteo['Activa']++;
    else conteo['Inactiva']++;
  });

  const etiquetas = Object.keys(conteo);
  const valores = Object.values(conteo);

  if (chartCabanas) chartCabanas.destroy();

  chartCabanas = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: etiquetas,
      datasets: [{
        data: valores,
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 10, font: { size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} cabaña${ctx.parsed !== 1 ? 's' : ''}`
          }
        }
      }
    }
  });
}

// ── Gráfica 2: Clientes activos vs inactivos (Barras) ────────────────────────
function renderGraficaClientes(clientes) {
  const canvas = document.getElementById('grafica-clientes');
  if (!canvas) return;

  const activos   = clientes.filter(c => c.Estado === 1 || c.Estado === '1' || c.Estado === true).length;
  const inactivos = clientes.length - activos;

  if (chartClientes) chartClientes.destroy();

  chartClientes = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Activos', 'Inactivos'],
      datasets: [{
        label: 'Clientes',
        data: [activos, inactivos],
        backgroundColor: ['rgba(0, 180, 216, 0.85)', 'rgba(239, 68, 68, 0.75)'],
        borderColor: ['#00b4d8', '#ef4444'],
        borderWidth: 2,
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} cliente${ctx.parsed.y !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#4b5563', font: { size: 13, weight: '600' } }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#9ca3af', stepSize: 1, precision: 0 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        }
      }
    }
  });
}

// ── Gráfica 3: Reservas por estado (Barras horizontales) ─────────────────────
function renderGraficaReservas(reservas) {
  const canvas = document.getElementById('grafica-reservas');
  if (!canvas) return;

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

  if (chartReservas) {
    chartReservas.destroy();
  }

  chartReservas = new Chart(canvas, {
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
          y: { beginAtZero: true, grid: { color: 'rgba(123,47,247,0.05)' }, ticks: { stepSize: 1, color: '#6b7280', font: { family: 'Outfit' } } },
          x: { grid: { display: false }, ticks: { color: '#6b7280', font: { family: 'Outfit' } } }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#4b5563',
            font: { family: 'Outfit', weight: '600' }
          }
        }
      }
    }
  });
}

// ── Cargar todos los datos del dashboard ─────────────────────────────────────
async function cargarDashboard() {
  mostrarFecha();

  ['kpi-ocupacion', 'kpi-ingresos', 'kpi-satisfaccion', 'kpi-reservas']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = '…'; el.classList.add('loading-num'); }
    });

  try {
    const [cabanas, habitaciones, clientes, paquetes, servicios, reservas] = await Promise.all([
      cabanasAPI.getAll().catch(() => []),
      habitacionesAPI.getAll().catch(() => []),
      clientesAPI.getAll().catch(() => []),
      paquetesAPI.getAll().catch(() => []),
      serviciosAPI.getAll().catch(() => []),
      reservasAPI.getAll().catch(() => [])
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

    // ── Tablas Top ──
    renderTopPaquetes(paquetes);
    renderTopServicios(servicios);

    // ── Gráficas ──
    renderGraficaCabanas(cabanas);
    renderGraficaClientes(clientes);
    renderGraficaReservas(reservas);

  } catch (err) {
    console.error('Error cargando el dashboard:', err);
    const errEl = document.getElementById('dashboard-error');
    if (errEl) errEl.style.display = 'block';

    ['kpi-ocupacion', 'kpi-ingresos', 'kpi-satisfaccion', 'kpi-reservas']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = '0'; el.classList.remove('loading-num'); }
      });

    ['tabla-top-paquetes', 'tabla-top-servicios'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="dashboard-loading">No se pudo cargar la información.</p>';
    });
  }
}

// ── Inicializar cuando el DOM esté listo ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cargarDashboard();
  // Botón de actualización manual
  const btn = document.getElementById('btn-refresh-dashboard');
  if (btn) btn.addEventListener('click', async () => { await cargarDashboard(); const lu = document.getElementById('dashboard-last-updated'); if (lu) lu.textContent = 'Última actualización: ' + new Date().toLocaleString('es-CO'); });
  // Auto-refresh cada 5 minutos
  setInterval(() => { cargarDashboard(); }, 300000);
});