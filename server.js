
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Pool } = require('pg');
const axios = require('axios');

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

// ================= WHATSAPP =================
const client = new Client({
  authStrategy: new LocalAuth({ clientId: "solutecno" }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  }
});

client.on('qr', async (qr) => {
  qrImage = await QRCode.toDataURL(qr);
  ready = false;
  qrcodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
  ready = true;
  qrImage = null;
  console.log("WhatsApp conectado");
});

client.on('disconnected', () => {
  ready = false;
});

// ================= IA =================
async function generarIA(prompt) {
  try {
    const res = await axios.post('http://127.0.0.1:11434/api/generate', {
      model: 'qwen2.5:3b',
      prompt,
      stream: false
    }, { timeout: 20000 });

    return res.data.response;
  } catch {
    return null;
  }
}

// ================= BOT =================
client.on('message', async msg => {

  try {

    // 🔒 SEGURIDAD TOTAL
    if (msg.fromMe) return;
    if (msg.from.includes('@g.us')) return;
    if (msg.from === 'status@broadcast') return;
    if (msg.from.includes('@newsletter')) return;
    if (!msg.from.endsWith('@c.us')) return;

    const text = msg.body.trim();

    console.log("MENSAJE:", text);

    let knowledge = {};
    try {
      const r = await pool.query("SELECT data FROM knowledge WHERE tenant_id = 1");
      knowledge = r.rows[0]?.data || {};
    } catch {}

    const prompt = `
Sos asistente de ${knowledge.empresa || 'Solutecno'}.

Servicios:
${knowledge.servicios || ''}

Respondé claro, humano y profesional.

Mensaje:
${text}
`;

    let respuesta = await generarIA(prompt);

    if (!respuesta || respuesta.length < 5) {
      respuesta = `Gracias por tu mensaje 😊\n\n${knowledge.servicios || 'Contame qué necesitás y te ayudo.'}`;
    }

    return msg.reply(respuesta);

  } catch (err) {
    console.log("ERROR:", err.message);
  }

});

client.initialize();

// ================= API =================
app.get('/api/status', (req, res) => {
  res.json({
    status: ready ? 'connected' : 'disconnected',
    qr: qrImage
  });
});

app.get('/api/qr', (req, res) => {
  if (!qrImage) return res.send("No QR");
  res.send(`<img src="${qrImage}" style="max-width:300px">`);
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto 3000");
});

