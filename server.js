const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();

// ── Middleware global ────────────────────────────────────────
app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: 'clave_secreta_gimnasio',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ── Middleware de autenticación ──────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
  }
  next();
}

// ── Función para calcular fecha de vencimiento ───────────────
function calcularFechaFin(fechaInicio, duracionDias) {
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + duracionDias);
  return fecha.toISOString().split('T')[0];
}

// ── Rutas de autenticación (Emilio) ──────────────────────────
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

app.get('/me', requireAuth, (req, res) => {
  res.json({ usuario: req.session.usuario });
});

// ── Rutas de membresías (Alejandro) ──────────────────────────
app.get('/membresias', requireAuth, (req, res) => {
  const sql = `
    SELECT 
      membresias.id,
      miembros.nombre AS miembro,
      miembros.telefono,
      planes.nombre AS plan,
      planes.precio,
      membresias.fecha_inicio,
      membresias.fecha_fin,
      membresias.estado
    FROM membresias
    JOIN miembros ON membresias.miembro_id = miembros.id
    JOIN planes ON membresias.plan_id = planes.id
    ORDER BY membresias.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/membresias', requireAuth, (req, res) => {
  const { miembro_id, plan_id, fecha_inicio } = req.body;
  db.query('SELECT * FROM planes WHERE id = ?', [plan_id], (err, planes) => {
    if (err) return res.status(500).json({ error: err.message });
    if (planes.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });
    const plan = planes[0];
    const fecha_fin = calcularFechaFin(fecha_inicio, plan.duracion_dias);
    const sql = `
      INSERT INTO membresias (miembro_id, plan_id, fecha_inicio, fecha_fin, estado)
      VALUES (?, ?, ?, ?, 'activa')
    `;
    db.query(sql, [miembro_id, plan_id, fecha_inicio, fecha_fin], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Membresía asignada ✅', fecha_inicio, fecha_fin, plan: plan.nombre });
    });
  });
});

app.put('/membresias/:id', requireAuth, (req, res) => {
  const { estado } = req.body;
  const { id } = req.params;
  const sql = 'UPDATE membresias SET estado = ? WHERE id = ?';
  db.query(sql, [estado, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Membresía no encontrada' });
    res.json({ mensaje: 'Estado actualizado ✅' });
  });
});

// America agrega sus rutas aquí:
// app.get('/miembros', requireAuth, ...)
// app.post('/miembros', requireAuth, ...)

// Jorge agrega sus rutas aquí:
// app.get('/pagos', requireAuth, ...)
// app.post('/pagos', requireAuth, ...)

// ── Arranque ─────────────────────────────────────────────────
app.listen(4000, () => {
  console.log('Servidor corriendo en http://localhost:4000 🚀');
});