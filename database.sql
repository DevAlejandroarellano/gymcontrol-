-- ─────────────────────────────────────────────────────────────
-- GymControl — Script de base de datos
-- Ejecutar en phpMyAdmin o consola MySQL
-- ─────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS gymcontrol;
USE gymcontrol;

-- Tabla 1: Usuarios del sistema (administradores)
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255)
);

-- Tabla 2: Miembros del gimnasio
CREATE TABLE miembros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  fecha_registro DATE
);

-- Tabla 3: Planes de membresía
CREATE TABLE planes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  precio DECIMAL(8,2) NOT NULL,
  duracion_dias INT NOT NULL
);

-- Tabla 4: Membresías asignadas a miembros
CREATE TABLE membresias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  miembro_id INT NOT NULL,
  plan_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado ENUM('activa', 'vencida', 'pendiente') NOT NULL DEFAULT 'activa',
  FOREIGN KEY (miembro_id) REFERENCES miembros(id),
  FOREIGN KEY (plan_id) REFERENCES planes(id)
);

-- Tabla 5: Pagos
CREATE TABLE pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  membresia_id INT,
  monto DECIMAL(8,2),
  fecha_pago DATE,
  metodo ENUM('efectivo', 'tarjeta', 'transferencia'),
  FOREIGN KEY (membresia_id) REFERENCES membresias(id)
);

-- ─────────────────────────────────────────────────────────────
-- Datos iniciales — Planes del gimnasio
-- ─────────────────────────────────────────────────────────────
INSERT INTO planes (nombre, precio, duracion_dias) VALUES
('Fit', 300.00, 30),
('Black', 500.00, 30);

-- Usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password) VALUES
('Admin', 'admin@gymcontrol.com', '$2b$10$DRRj40qWxqpPdrB0/HZEWuQLI1YV/52Wsg4ztkzKroOfNIvA/EEGW');