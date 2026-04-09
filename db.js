const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gymcontrol'
}).promise();  // ← esto es lo que falta

module.exports = db;