const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // tu usuario de MySQL
  password: '',        // tu contraseña de MySQL
  database: 'controlgym' // el nombre de tu base de datos
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL ✅');
});

module.exports = db;