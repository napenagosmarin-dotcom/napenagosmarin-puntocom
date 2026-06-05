document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = 'Cargando...';
  errorEl.classList.add('visible');
  const data = {
    Email: document.getElementById('Email').value,
    Contrasena: document.getElementById('Contrasena').value
  };

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok && result.user) {
      localStorage.setItem('user', JSON.stringify(result.user));
      // Redirigir según rol
      if (result.user.IDRol === 2) {
        window.location.href = '/src/pages/admin.html';
      } else {
        window.location.href = '/src/pages/reservas.html';
      }
    } else {
      errorEl.textContent = result.message || 'Credenciales incorrectas';
    }
  } catch (error) {
    console.error('Connection error:', error);
    errorEl.textContent = 'Error de conexión con el servidor';
  }
});

// Password toggle functionality
const setupPasswordToggles = () => {
  const toggleButtons = document.querySelectorAll('.password-toggle');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      const icon = button.querySelector('.toggle-icon');
      
      if (input.type === 'password') {
        input.type = 'text';
        button.setAttribute('aria-label', 'Ocultar contraseña');
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        button.setAttribute('aria-label', 'Mostrar contraseña');
        icon.setAttribute('data-lucide', 'eye');
      }
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  });
};

setupPasswordToggles();
