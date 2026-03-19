const axios = require('axios');
(async () => {
  try {
    console.log('Register test user...');
    let res = await axios.post('http://localhost:5000/api/auth/register', { name: 'Test User', email: 'testuser@gmail.com', password: 'Password123!' }, { headers: { 'Content-Type': 'application/json' }});
    console.log('Register:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.error('Register error', err.response.status, err.response.data);
    } else {
      console.error('Register error', err.message);
    }
  }
  try {
    console.log('Login test user...');
    let res = await axios.post('http://localhost:5000/api/auth/login', { email: 'testuser@gmail.com', password: 'Password123!' }, { headers: { 'Content-Type': 'application/json' }});
    console.log('Login:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.error('Login error', err.response.status, err.response.data);
    } else {
      console.error('Login error', err.message);
    }
  }
})();
