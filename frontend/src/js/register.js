const registerForm = document.getElementById('registerForm');
const passwordInput = document.getElementById('Contrasena');
const confirmPasswordInput = document.getElementById('ConfirmarContrasena');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const passwordHint = document.getElementById('passwordHint');

// Country phone prefixes mapping
const countryPrefixes = {
  'Alemania': '+49',
  'Argentina': '+54',
  'Australia': '+61',
  'Bolivia': '+591',
  'Brasil': '+55',
  'Canadá': '+1',
  'Chile': '+56',
  'China': '+86',
  'Colombia': '+57',
  'Costa Rica': '+506',
  'Cuba': '+53',
  'Ecuador': '+593',
  'Egipto': '+20',
  'Emiratos Árabes Unidos': '+971',
  'España': '+34',
  'Estados Unidos': '+1',
  'Finlandia': '+358',
  'Francia': '+33',
  'Guatemala': '+502',
  'Honduras': '+504',
  'India': '+91',
  'Italia': '+39',
  'Japón': '+81',
  'México': '+52',
  'Marruecos': '+212',
  'Nigeria': '+234',
  'Noruega': '+47',
  'Nueva Zelanda': '+64',
  'Países Bajos': '+31',
  'Panamá': '+507',
  'Paraguay': '+595',
  'Perú': '+51',
  'Portugal': '+351',
  'Reino Unido': '+44',
  'Rusia': '+7',
  'Sudáfrica': '+27',
  'Suecia': '+46',
  'Suiza': '+41',
  'Turquía': '+90',
  'Uruguay': '+598',
  'Venezuela': '+58'
};

const passwordRules = {
    length: { regex: /.{8,}/, label: 'Mínimo 8 caracteres' },
    uppercase: { regex: /[A-Z]/, label: 'Una letra mayúscula' },
    lowercase: { regex: /[a-z]/, label: 'Una letra minúscula' },
    number: { regex: /[0-9]/, label: 'Un número' },
    special: { regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, label: 'Un carácter especial' }
};

// Update country prefix based on selected country
const updateCountryPrefix = () => {
  const countrySelect = document.getElementById('Pais');
  const prefixElement = document.getElementById('countryPrefix');
  const selectedCountry = countrySelect.value;
  
  if (selectedCountry && countryPrefixes[selectedCountry]) {
    prefixElement.textContent = countryPrefixes[selectedCountry];
  } else {
    prefixElement.textContent = '+57'; // Default to Colombia
  }
};

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
        // Change icon to eye-off
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        button.setAttribute('aria-label', 'Mostrar contraseña');
        // Change icon to eye
        icon.setAttribute('data-lucide', 'eye');
      }
      
      // Reinitialize lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  });
};

const getPasswordValidation = (value) => {
    return Object.fromEntries(Object.entries(passwordRules).map(([key, rule]) => [key, rule.regex.test(value)]));
};

const updatePasswordRequirements = (value) => {
    const validation = getPasswordValidation(value);
    const isValid = Object.values(validation).every(Boolean);
    
    if (value.length > 0 && !isValid) {
        passwordHint.style.display = 'block';
        passwordHint.style.color = '#ef4444';
    } else if (isValid) {
        passwordHint.style.display = 'block';
        passwordHint.style.color = '#10b981';
    } else {
        passwordHint.style.display = 'none';
    }
};

const clearFeedback = () => {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    errorMessage.classList.remove('visible');
    successMessage.textContent = '';
    successMessage.style.display = 'none';
    successMessage.classList.remove('visible');
    passwordInput.classList.remove('input-error');
    confirmPasswordInput.classList.remove('input-error');
};

const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.classList.add('visible');
    successMessage.textContent = '';
    successMessage.style.display = 'none';
};

const showSuccess = (message) => {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    successMessage.classList.add('visible');
};

// Event listeners
document.getElementById('Pais').addEventListener('change', updateCountryPrefix);

passwordInput.addEventListener('input', () => {
    updatePasswordRequirements(passwordInput.value);
    passwordInput.classList.toggle('input-ok', Object.values(getPasswordValidation(passwordInput.value)).every(Boolean));
});

confirmPasswordInput.addEventListener('input', () => {
    confirmPasswordInput.classList.remove('input-error');
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFeedback();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const validation = getPasswordValidation(password);

    if (!Object.values(validation).every(Boolean)) {
        showError('La contraseña debe cumplir todos los requisitos de seguridad.');
        passwordInput.classList.add('input-error');
        updatePasswordRequirements(password);
        return;
    }

    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden.');
        confirmPasswordInput.classList.add('input-error');
        return;
    }

    const countrySelect = document.getElementById('Pais');
    const prefix = countryPrefixes[countrySelect.value] || '+57';
    const phoneNumber = document.getElementById('Telefono').value;
    const fullPhoneNumber = `${prefix} ${phoneNumber}`;

    const data = {
        NombreUsuario: document.getElementById('NombreUsuario').value,
        Apellido: document.getElementById('Apellido').value,
        Email: document.getElementById('Email').value,
        Contrasena: password,
        TipoDocumento: document.getElementById('TipoDocumento').value,
        NumeroDocumento: document.getElementById('NumeroDocumento').value,
        Telefono: fullPhoneNumber,
        Pais: countrySelect.value,
        Direccion: document.getElementById('Direccion').value
    };

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showSuccess('Registro exitoso. Revisa tu correo para verificar tu cuenta.');
            setTimeout(() => {
                window.location.href = '/src/pages/login.html';
            }, 1500);
        } else {
            const error = await response.json();
            const message = error.message || 'Error al registrarse';
            showError(message);
        }
    } catch (error) {
        showError('Error de conexión. Intenta nuevamente.');
    }
});

// Initialize password toggles when DOM is ready
setupPasswordToggles();

// Set default country prefix on page load
updateCountryPrefix();
