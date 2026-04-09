  const express = require('express');
  const session = require('express-session');
  const bcrypt = require('bcrypt');
  const db = require('./db');

  const app = express();

  app.use(express.json());

  app.use(session({
    secret: 'clave_secreta_gimnasio',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  function requireAuth(req, res, next) {
    if (!req.session.usuario) {
      return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
    }
    next();
  }

  app.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
    db.query(sql, [nombre, email, hash], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Usuario registrado ✅' });
    });
  });

  app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

      const usuario = results[0];
      const coincide = await bcrypt.compare(password, usuario.password);

      if (!coincide) return res.status(401).json({ error: 'Contraseña incorrecta' });

      req.session.usuario = { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
      res.json({ mensaje: 'Login exitoso ✅', usuario: req.session.usuario });
    });
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ mensaje: 'Sesión cerrada ✅' });
    });
  });

  app.get('/perfil', requireAuth, (req, res) => {
    res.json({ usuario: req.session.usuario });
  });

  app.listen(4000, () => {
    console.log('Servidor corriendo en http://localhost:4000 🚀');
  });