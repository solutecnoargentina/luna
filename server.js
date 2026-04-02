const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: 'solutecno',
  host: 'localhost',
  database: 'solutecno_db',
  password: 'Solu1234!',
  port: 5432,
});

let qrImage = null;
let ready = false;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "solutecno" }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  }
});

client.on('qr', async (qr) => {
  qrImage = await QRCode.toDataURL(qr);
  qrcodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
  ready = true;
  qrImage = null;
});

client.on('message_create', async msg => {
  if (msg.fromMe) return;

  const text = msg.body.toLowerCase();

  if (text === '!menu') {
    return msg.reply('Comandos:\n!menu\n!estado');
  }

  if (text === '!estado') {
    return msg.reply('Bot activo');
  }

  if (text.includes('hola')) {
    return msg.reply('Hola 😊 soy Solutecno Bot');
  }

  return msg.reply('Recibí tu mensaje 👍');
});

client.initialize();

// ================= GUARDAR CONFIG =================
app.post('/api/config', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO bot_configs (tenant_id, config)
       VALUES (1, $1)
       ON CONFLICT (tenant_id)
       DO UPDATE SET config = $1`,
      [req.body]
    );

    res.json({ ok: true, message: "Guardado en DB" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

// ================= GUARDAR KNOWLEDGE =================
app.post('/api/knowledge', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO knowledge (tenant_id, data)
       VALUES (1, $1)
       ON CONFLICT (tenant_id)
       DO UPDATE SET data = $1`,
      [req.body]
    );

    res.json({ ok: true, message: "Guardado en DB" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

// ================= LEER TODO =================
app.get('/api/status', async (req, res) => {
  try {
    const config = await pool.query(
      `SELECT config FROM bot_configs WHERE tenant_id = 1`
    );

    const knowledge = await pool.query(
      `SELECT data FROM knowledge WHERE tenant_id = 1`
    );

    res.json({
      status: ready ? 'connected' : 'disconnected',
      qr: qrImage,
      config: config.rows[0]?.config || {},
      knowledge: knowledge.rows[0]?.data || {}
    });

  } catch (err) {
    console.error(err);
    res.json({
      status: 'error'
    });
  }
});

app.get('/api/qr', (req, res) => {
  if (!qrImage) return res.send('No QR');
  res.send(`<img src="${qrImage}" />`);
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log('Servidor corriendo en puerto 3000');
});
