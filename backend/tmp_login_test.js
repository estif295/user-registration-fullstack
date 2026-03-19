const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', { email: 'test@example.com', password: 'password' }, { headers: { 'Content-Type': 'application/json' } });
    console.log('STATUS', res.status);
    console.log(res.data);
  } catch (err) {
    if (err.response) {
      console.log('STATUS', err.response.status, err.response.statusText);
      console.log(err.response.data);
    } else {
      console.log('ERR', err.message);
    }
    process.exit(1);
  }
})();
