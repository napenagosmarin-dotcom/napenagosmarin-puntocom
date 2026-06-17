async function testLogin() {
  const url = 'https://ficha3312967aura-production.up.railway.app/api/auth/login';
  const email = 'godienser@gmail.com';
  const password = 'Godie777-';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Email: email, Contrasena: password })
    });

    const data = await response.json();
    console.log(`\nRespuesta del servidor (Status: ${response.status}):`);
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('\n❌ Error de red o ejecución:', error.message);
  }
}

testLogin();
