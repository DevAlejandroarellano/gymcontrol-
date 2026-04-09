const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();

app.use(express.json());
app.use(express.static('public'));

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

function calcularFechaFin(fechaInicio, duracionDias) {
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + duracionDias);
  return fecha.toISOString().split('T')[0];
}

// ── Autenticación ─────────────────────────────────────────────
app.post('/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)', [nombre, email, hash]);
    res.json({ mensaje: 'Usuario registrado ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [results] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });
    const usuario = results[0];
    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) return res.status(401).json({ error: 'Contraseña incorrecta' });
    req.session.usuario = { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
    res.json({ mensaje: 'Login exitoso ✅', usuario: req.session.usuario });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.json({ mensaje: 'Sesión cerrada ✅' }));
});

app.get('/perfil', requireAuth, (req, res) => res.json({ usuario: req.session.usuario }));
app.get('/me',     requireAuth, (req, res) => res.json({ usuario: req.session.usuario }));

// ── Membresías ────────────────────────────────────────────────
app.get('/membresias', requireAuth, async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT membresias.id, miembros.nombre AS miembro, miembros.telefono,
             planes.nombre AS plan, planes.precio,
             membresias.fecha_inicio, membresias.fecha_fin, membresias.estado
      FROM membresias
      JOIN miembros ON membresias.miembro_id = miembros.id
      JOIN planes   ON membresias.plan_id    = planes.id
      ORDER BY membresias.id DESC
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/membresias', requireAuth, async (req, res) => {
  const { miembro_id, plan_id, fecha_inicio } = req.body;
  try {
    const [planes] = await db.query('SELECT * FROM planes WHERE id = ?', [plan_id]);
    if (planes.length === 0) return res.status(404).json({ error: 'Plan no encontrado' });
    const plan = planes[0];
    const fecha_fin = calcularFechaFin(fecha_inicio, plan.duracion_dias);
    await db.query(
      "INSERT INTO membresias (miembro_id, plan_id, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, 'activa')",
      [miembro_id, plan_id, fecha_inicio, fecha_fin]
    );
    res.json({ mensaje: 'Membresía asignada ✅', fecha_inicio, fecha_fin, plan: plan.nombre });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/membresias/:id', requireAuth, async (req, res) => {
  const { estado } = req.body;
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE membresias SET estado = ? WHERE id = ?', [estado, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Membresía no encontrada' });
    res.json({ mensaje: 'Estado actualizado ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Miembros ──────────────────────────────────────────────────
app.get('/miembros', requireAuth, async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, nombre, telefono, email, fecha_registro FROM miembros ORDER BY id DESC');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/miembros', requireAuth, async (req, res) => {
  const { nombre, telefono, email, fecha_registro } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const [result] = await db.query(
      'INSERT INTO miembros (nombre, telefono, email, fecha_registro) VALUES (?, ?, ?, ?)',
      [nombre, telefono, email, fecha_registro]
    );
    res.json({ mensaje: 'Miembro creado ✅', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/miembros/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, email, fecha_registro } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const [result] = await db.query(
      'UPDATE miembros SET nombre = ?, telefono = ?, email = ?, fecha_registro = ? WHERE id = ?',
      [nombre, telefono, email, fecha_registro, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Miembro no encontrado' });
    res.json({ mensaje: 'Miembro actualizado ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/miembros/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM miembros WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Miembro no encontrado' });
    res.json({ mensaje: 'Miembro eliminado ✅' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Pagos ─────────────────────────────────────────────────────
app.get('/pagos', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.membresia_id, p.monto, p.fecha_pago, p.metodo,
             mi.nombre AS miembro, pl.nombre AS plan
      FROM pagos p
      JOIN membresias m ON p.membresia_id = m.id
      JOIN miembros  mi ON m.miembro_id   = mi.id
      JOIN planes    pl ON m.plan_id      = pl.id
      ORDER BY p.fecha_pago DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los pagos' });
  }
});

app.post('/pagos', requireAuth, async (req, res) => {
  const { membresia_id, monto, fecha_pago, metodo } = req.body;
  if (!membresia_id || !monto || !fecha_pago || !metodo)
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  if (!['efectivo', 'tarjeta', 'transferencia'].includes(metodo))
    return res.status(400).json({ error: 'Método de pago no válido' });
  try {
    await db.query(
      'INSERT INTO pagos (membresia_id, monto, fecha_pago, metodo) VALUES (?, ?, ?, ?)',
      [membresia_id, monto, fecha_pago, metodo]
    );
    res.status(201).json({ mensaje: 'Pago registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
});

// ── Dashboard ─────────────────────────────────────────────────
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [[{ totalMiembros }]]     = await db.query('SELECT COUNT(*) AS totalMiembros FROM miembros');
    const [[{ membresiasActivas }]] = await db.query("SELECT COUNT(*) AS membresiasActivas FROM membresias WHERE estado = 'activa'");
    const [[{ totalMes }]]          = await db.query(`
      SELECT COALESCE(SUM(monto), 0) AS totalMes FROM pagos
      WHERE MONTH(fecha_pago) = MONTH(CURDATE()) AND YEAR(fecha_pago) = YEAR(CURDATE())
    `);
    res.json({ totalMiembros, membresiasActivas, totalMes });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ── Arranque ──────────────────────────────────────────────────
app.listen(4000, () => console.log('Servidor corriendo en http://localhost:4000 🚀'));