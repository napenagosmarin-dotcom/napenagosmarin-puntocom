// Función para listar habitaciones
async function listar() {
    const res = await fetch("./habitaciones");
    const habitaciones = await res.json();

    let html = "<table border='1'><tr><th>Número</th><th>Tipo</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>";

    habitaciones.forEach(h => {
        html += `
        <tr>
            <td>${h.numero}</td>
            <td>${h.tipo}</td>
            <td>${h.precio}</td>
            <td>${h.estado}</td>
            <td>
                <button onclick="prepararEdicion(${h.id}, '${h.numero}', '${h.tipo}', ${h.precio}, '${h.estado}')">Editar</button>
                <button onclick="eliminarHabitacion(${h.id})">Eliminar</button>
            </td>
        </tr>`;
    });

    html += "</table>";
    document.getElementById("lista").innerHTML = html;
}

// Llenar el formulario para editar
function prepararEdicion(id, numero, tipo, precio, estado) {
    document.getElementById("id").value = id;
    document.getElementById("numero").value = numero;
    document.getElementById("tipo").value = tipo;
    document.getElementById("precio").value = precio;
    document.getElementById("estado").value = estado;
}

// Crear habitación
async function crear(numero, tipo, precio, estado) {
    await fetch("./habitaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero, tipo, precio, estado })
    });
}

// Editar habitación
async function editar(id, numero, tipo, precio, estado) {
    await fetch(`./habitaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero, tipo, precio, estado })
    });
}

// Eliminar habitación
async function eliminarHabitacion(id) {
    if (!confirm("¿Estás seguro de eliminar esta habitación?")) return;
    await fetch(`./habitaciones/${id}`, { method: "DELETE" });
    listar();
}

// Evento del formulario
document.getElementById("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("id").value;
    const numero = document.getElementById("numero").value;
    const tipo = document.getElementById("tipo").value;
    const precio = parseFloat(document.getElementById("precio").value);
    const estado = document.getElementById("estado").value;

    if (id) {
        await editar(id, numero, tipo, precio, estado);
    } else {
        await crear(numero, tipo, precio, estado);
    }

    document.getElementById("form").reset();
    document.getElementById("id").value = "";
    listar();
});

// Cargar lista al iniciar
listar();