async function testProductionEmail() {
  console.log('Iniciando prueba contra el servidor de producción en Railway...');
  const url = 'https://ficha3312967aura-production.up.railway.app/api/auth/forgot-password';
  const email = 'godienser@gmail.com';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    console.log(`\nRespuesta del servidor (Status: ${response.status}):`);
    console.log(data);

    if (response.ok) {
      console.log('\n✅ ¡Éxito! El servidor recibió la petición y despachó el correo de recuperación de contraseña.');
    } else {
      console.error('\n❌ Hubo un problema al contactar el servidor de producción.', data);
    }
  } catch (error) {
    console.error('\n❌ Error de red o ejecución:', error.message);
  }
}

testProductionEmail();
