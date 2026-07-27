import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve('db');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const OLD_DB_FILE = path.resolve('socio.db');
const DB_FILE = path.join(DB_DIR, 'socio.db');

// Migrar la base de datos automáticamente si existe en la raíz
if (fs.existsSync(OLD_DB_FILE) && !fs.existsSync(DB_FILE)) {
  try {
    fs.renameSync(OLD_DB_FILE, DB_FILE);
    console.log('Base de datos migrada exitosamente a la carpeta db/');
  } catch (err) {
    console.error('Error al migrar la base de datos a db/:', err);
  }
}

const db = new sqlite3.Database(DB_FILE);
db.run('PRAGMA foreign_keys = ON;');

// Promisificar métodos de sqlite3
export const query = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Inicializar la base de datos
export async function initDb() {
  // Crear tablas
  await query.exec(`
    CREATE TABLE IF NOT EXISTS allowed_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo_url TEXT,
      sector_id INTEGER REFERENCES sectors(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, -- Hashed with bcrypt
      role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email TEXT,
      name TEXT,
      role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      avatar_url TEXT,
      expiration_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      vigencia TEXT,
      tipo_descuento TEXT,
      discount_amount TEXT NOT NULL DEFAULT 'XXXX',
      discount_label TEXT NOT NULL DEFAULT 'DE DESCUENTO',
      code_label TEXT NOT NULL DEFAULT 'Usando el código',
      discount_code TEXT NOT NULL DEFAULT 'XXXXXXXXXX',
      benefit_text TEXT,
      terms TEXT,
      active BOOLEAN NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL
    );
  `);

  // Limpiar perfiles huérfanos acumulados por desactivación temporal de foreign keys
  await query.exec('DELETE FROM profiles WHERE id NOT IN (SELECT id FROM users);');

  // Asegurar que exista el sector 'Otro'
  const otroSector = await query.get("SELECT id FROM sectors WHERE LOWER(name) = 'otro'");
  if (!otroSector) {
    await query.run("INSERT INTO sectors (name) VALUES ('Otro')");
  }

  // Sembrar datos iniciales si está vacío
  const countDomains = await query.get('SELECT COUNT(*) as count FROM allowed_domains');
  if (countDomains.count === 0) {
    console.log('Sembrando datos iniciales en la base de datos...');

    // 1. Dominios
    await query.run("INSERT INTO allowed_domains (id, domain) VALUES (1, 'oberstaff.com'), (4, 'gmail.com')");

    // 2. Sectores
    await query.run("INSERT INTO sectors (id, name) VALUES (1, 'Salud'), (2, 'Turismo'), (3, 'Gastronomía'), (4, 'Servicios'), (5, 'Tecnología')");

    // 3. Empresas
    const companies = [
      [1, 'Sociedad Española de Auxilio Mutuo y Beneficencia de Puerto Rico', '/logo-auxilio.webp', 1],
      [2, 'VIAJA CON ÁLVARO', '/logo-viaja.webp', 2],
      [3, 'FOOBESPAIN AMERICAN LLC', '/logo-foobespain.webp', 3],
      [4, 'Pharma-Bio Serv, Inc.', '/logo-pharma.webp', 4],
      [5, 'McDreamy Promotions', '/logo-dreamy.webp', 4],
      [6, 'Ponchar.com', '/logo-ponchar.webp', 5], // logo_url local
      [7, 'Smart Solutions & Services LLC.', '/logo-smart.webp', 5],
      [8, 'Oberstaff', '/logo-oberstaff.webp', 4],
      [9, 'Sky Media Enterprises', '/logo-sky.webp', 4]
    ];
    for (const c of companies) {
      await query.run("INSERT INTO companies (id, name, logo_url, sector_id) VALUES (?, ?, ?, ?)", c);
    }

    // 4. Usuarios del Auth (Mapeados desde datos.sql)
    const users = [
      ['f579d855-0c9a-4155-af0e-8ef4492e4849', 'admin1@oberstaff.com', '$2a$10$M1vzlFCAmMTb5VlpQ1Cmce4xgc7cIS40fqFm2vDjW4nRtwksiU73e', 'admin'],
      ['6f37951c-cbc8-4574-a6e8-fb79511c2527', 'test34@oberstaff.com', '$2a$06$Irq30NcE18ChQ3MnkLFTN.qUiR.VlQ4cHg/soIzQ7JiAzdkTvCsH6', 'user'],
      ['8fc79001-062f-495a-96c0-874fc7d75494', 'como@oberstaff.com', '$2a$10$Yl49vrcn2BkGAdoNbbwwPuSyLTFd0m7V6p7GVWTKInrn3IGQwXZey', 'user'],
      ['28ae139a-89c0-4cd7-bfb8-743874aa27c6', 'hola@oberstaff.com', '$2a$10$pRlvvqOTKpFGUowSWeHZ5uN8HPiv3BUZs1Ma66XlWQKswrKni..Je', 'user'],
      ['c77bdab5-5f7a-4083-b197-0439062924fd', 'prueba@oberstaff.com', '$2a$10$DXZFagi9unJhK87NgXwAjeB3Z7MJ7VBY1b70LbTNBUkY1XWg.wxSK', 'user'],
      ['d0c07b96-4d15-419c-b6c5-19a9bb5007cc', 'test@oberstaff.com', '$2a$10$VKigIllqWkjnxg1Y9Gu9uenApoNVzJYTGyWhwF5X7rUTvth8.lL5.', 'user'],
      ['9fdcff80-342c-4806-97f9-1ea14a69f006', 'test88@oberstaff.com', '$2a$06$s772ELRDeoxRceIG8KPSyOyAB8mNzbo3kwgXZvYeFtJ3u4PDSSzCO', 'user'],
      ['16d61d37-b8d3-4356-87f0-44d506607d14', 'panel8@oberstaff.com', '$2a$10$9vK2pN28Vi5fvUPMSJxd..zRowbk/TS5/ouK5k88qfVcsWOgCcy8C', 'user']
    ];
    for (const u of users) {
      await query.run("INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)", u);
    }

    // 5. Perfiles (Mapeados desde datos.sql)
    const profiles = [
      ['f579d855-0c9a-4155-af0e-8ef4492e4849', 'admin1@oberstaff.com', 'Lorena Moujalli', 'admin', null],
      ['16d61d37-b8d3-4356-87f0-44d506607d14', 'panel8@oberstaff.com', 'test panel', 'user', null],
      ['c77bdab5-5f7a-4083-b197-0439062924fd', 'prueba@oberstaff.com', 'prueba', 'user', null],
      ['d0c07b96-4d15-419c-b6c5-19a9bb5007cc', 'test@oberstaff.com', 'test 2', 'user', null],
      ['6f37951c-cbc8-4574-a6e8-fb79511c2527', 'test34@oberstaff.com', 'test 33', 'user', null],
      ['28ae139a-89c0-4cd7-bfb8-743874aa27c6', 'hola@oberstaff.com', 'hola', 'user', null],
      ['8fc79001-062f-495a-96c0-874fc7d75494', 'como@oberstaff.com', 'como ', 'user', null],
      ['9fdcff80-342c-4806-97f9-1ea14a69f006', 'test88@oberstaff.com', 'test 88', 'user', null]
    ];
    for (const p of profiles) {
      await query.run("INSERT INTO profiles (id, email, name, role, company_id) VALUES (?, ?, ?, ?, ?)", p);
    }

    // 6. Cupones (Mapeados desde datos.sql)
    const coupons = [
      [2, 2, "Vamos Pa' España", "Ofrezco un descuento en todos los servicios de Tours que damos en España, ya sea para trabajadores de empresas socios de la cámara, como familiares.", "16/04/26 - 31/12/26", "Descuento porcentual", "10%", "DE DESCUENTO", "Usando el código", "CAMARACONALVARO", "", "No aplica en billetes de tren y otros transportes, transfers, entradas de monumentos o shows.", 1, 2],
      [3, 3, "DESCUENTOS EN PARTICIPACIO DE TALLERES Y CATAS EN SHOW ROOM Y DESCUENTO PARA SOCIOS EN COMPRAS DIRECTAS DE VINOS", "DESCUENTO DEL 5% EN COMPRAS DE VINO Y TALLERES DE SHOW ROOM DE FOOBESPAIN AMERICAN - WINE & WONDER PARA SOCIOS DE LA CAMARA", "04/01/26 - No especificado", "No especificado", "5%", "DE DESCUENTO", "Usando el código", "CAMARAESPAÑAPR", "Beneficio para los Miembros de la Cámara Comercio de España en PR que se hagan socio.", "( Se necesita más información por parte de la empresa).", 1, 3],
      [4, 4, "Primera hora gratis y descuentos variables en los servicios", "Ofrecemos servicios como \"US Agents\" para el registro de plantas de fabricación de productos de alimentación, farmacéuticos, biológicos y de productos sanitarios, así como el listado de los productos.<br/><br/>Además de eso ofrecemos servicios de preparación de registros para todos los productos regulados por la FDA en los EEUU.<br/><br/>Los beneficios explicados abajo.", "16/03/26 - 31/12/27", "Otro", "XXXX", "DE DESCUENTO", "Usando la identificación de", "Socio de la Cámara Oficial de Comercio de España en PR", "Ofrecemos servicios como \"US Agents\" para el registro de plantas de fabricación de productos de alimentación, farmacéuticos, biológicos y de productos sanitarios, así como el listado de los productos.<br/><br/>Además de eso ofrecemos servicios de preparación de registros para todos los productos regulados por la FDA en los EEUU.", "Primera hora de consulta por videoconferencia gratis. Registro de planta 1.000€, listado de productos 500€/producto. Descuento de 10% en todos los servicios con facturación superior a 75.000€.", 1, 4],
      [5, 5, "INVITACION AL SHOW DE ARTICULOS PROMOCIONALES", "McDreamy Promotions ofrece CINCO INVITACIONES –sin costo– para igual cantidad de socios que estén interesados en asistir. Más información en el flyer que se adjunta.", "09/03/26 - 30/03/26", "Otro", "XXXX", "DE DESCUENTO", "Usando el código", "INVSAS", "Invitación pagada por McDreamy Promotions a la asociación regional. SIN COSTO para el invitado", "Contactar en el período de tiempo arriba indicado.", 1, 5],
      [6, 6, "Ponchar.com te ofrece un descuento en los ponchadores para el control de asistencia de empleados", "Ofrecemos 5% de descuento en los ponchadores para los miembros de la Cámara Oficial de Comercio de España en Puerto Rico.", "01/02/26 - 30/04/26", "Descuento porcentual", "5%", "DE DESCUENTO EN LOS PONCHADORES", "Usando el código", "COCEPR", "Beneficio para los Miembros de la Cámara Comercio de España en PR que se hagan socio.", "Beneficio para los Miembros de la Cámara Comercio de España en PR, que se hagan socio. Los participantes que requieran pasar por el examen físico requerido para el ingreso al Plan de Socios, este será libre de costo. Los servicios recibidos en la clínica exclusiva de Socio el copago será $10.00.", 1, 6],
      [8, 8, "Crédito de $300 para Contratación de Talento con Oberstaff", "Los socios de la Cámara Oficial de Comercio de España en Puerto Rico reciben un crédito de $300 al contratar profesionales a tiempo completo con Oberstaff.<br/><br/>Este crédito se aplica automáticamente a la tercera factura mensual, ayudando a reducir el costo operativo inicial mientras el equipo ya está en marcha.", "01/01/26 - 31/12/26", "Otro", "10%", "DE CRÉDITO FIJO", "Usando el código", "XXXXXX", "", "Válido únicamente para socios activos de la Cámara de Comercio de España en Puerto Rico. No es transferible, no es canjeable por efectivo y no puede combinarse con otras promociones u ofertas. El crédito de $300 se aplica exclusivamente a la tercera factura mensual de cada suscripción contratada con Oberstaff. El cliente debe mantener la suscripción activa y al día hasta la tercera facturación para que el crédito sea aplicable. Aplica solo para nuevas suscripciones contratadas.", 1, 8],
      [9, 9, "PRIMERA CONSULTA GRATUITA EN MERCADEO", "En Sky Media Enterprises te ofrecemos tu primera consulta gratuita en mercadeo, diseñada para evaluar de manera estratégica las necesidades de tu negocio, marca o proyecto. Durante esta consulta analizamos oportunidades de crecimiento y desarrollo estratégico para tu empresa.", "01/02/26 - 29/11/26", "Otro", "XXXXXX", "DE DESCUENTO", "Usando el código", "XXXXX", "Beneficio para los Miembros de la Cámara Comercio de España en PR que se hagan socio.", "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", 1, 9],
      [1, 1, "Plan de Socios", "El Plan de Socios es un programa de salud sin fines de lucro. Está financiado con fondos que se disponen de la cuota que pagan sus Socios. Actualmente brinda sus servicios bajo el modelo que se conoce como un plan de cuidado dirigido, donde su proveedor primario es el Hospital Auxilio Mutuo. Por disposición de ley, el mismo no está regido por el Código de Seguros de Puerto Rico.", "Marzo 2026 - No especificado", "No especificado", "XXXX", "DE DESCUENTO", "Usando el código", "XXXXXXXXXX", "Beneficio para los Miembros de la Cámara Comercio de España en PR que se hagan socio.", "Beneficio para los Miembros de la Cámara Comercio de España en PR, que se hagan socio. Los participantes que requieran pasar por el examen físico requerido para el ingreso al Plan de Socios, este será libre de costo. Los servicios recibidos en la clínica exclusiva de Socio el copago será $10.00.", 1, 1],
      [7, 7, "Smart Compliance SC365®", "Somos el socio idóneo para fomentar una estrategia de transformación digital holística y segura que potencia su éxito en un entorno cibernético cada vez más complejo, dinámico, y regulado. Nuestros servicios consultivos y soluciones de software son especializados en el fortalecer la gobernanza empresarial integrando controles de riesgo, ciberseguridad y cumplimiento en los procesos de reclutamiento, contratación, y administración de IT. Ofrecemos cursos especializados de ciberseguridad para promover una cultura organizacional de resiliencia cibernética. Además, contamos con un equipo de analistas programadores expertos en el desarrollo de sistemas, sitios web y aplicaciones para facilitar la automatización de procesos con la integración de codificación y algoritmos de inteligencia de negocio (BI) e inteligencia artificial (AI). Nos distinguimos por nuestra sólida reputación al exceder consistentemente las expectativas de nuestros clientes.", "01/02/26 - 01/04/26", "Descuento porcentual", "20%", "DE DESCUENTO", "Usando el código", "SC365#CCEPR", "", "Esta oferta de descuento es aplicable exclusivamente para empresas que son socios de la Cámara Oficial de Comercio de España en Puerto Rico que contraten servicios y/o soluciones previo a la fecha de finalización de esta promoción. No aplica en combinación con otras ofertas o promociones. De estar interesado en coordinar una cita o para obtener más información, favor de contactarnos enviando email a info@smartcompliance365.com o visitar www.smartcompliance365.com.", 1, 7]
    ];
    for (const cp of coupons) {
      await query.run(
        `INSERT INTO coupons (id, company_id, title, description, vigencia, tipo_descuento, discount_amount, discount_label, code_label, discount_code, benefit_text, terms, active, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        cp
      );
    }

    console.log('Base de datos inicializada y sembrada con éxito.');
  }
}

// Ejecutar inicialización al cargar el módulo
initDb().catch(console.error);
