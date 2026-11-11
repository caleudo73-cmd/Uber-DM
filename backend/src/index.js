const express = require('express');
const cors = require('cors');
const env = require('./config/env');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', require('./routes/auth.routes'));
app.use('/rides', require('./routes/rides.routes'));
app.use('/places', require('./routes/places.routes'));
app.use('/places', require('./routes/places.routes'));
app.use('/users', require('./routes/users.routes'));

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API lista en http://localhost:${env.PORT}`);
  console.log('Usuarios demo: pasajero@demo.com / conductor@demo.com  (clave: 123456)');
});
