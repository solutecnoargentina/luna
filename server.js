const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let qrImage = null;
let ready = false;

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "solutecno"
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  }
});

client.on('qr', async (qr) => {
  console.log('QR generado');
  qrImage = await QRCode.toDataURL(qr);
  qrcodeTerminal.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp conectado');
  ready = true;
  qrImage = null;
});

client.on('message', async msg => {
  if (msg.fromMe) return;

  if (msg.body === '!menu') {
    msg.reply('Comandos:\n!menu\n!estado');
  }

  if (msg.body === '!estado') {
    msg.reply(ready ? 'Conectado' : 'Desconectado');
  }
});

client.initialize();

app.get('/api/status', (req, res) => {
  res.json({
    status: ready ? 'connected' : 'disconnected',
    qr: qrImage
  });
});

app.get('/api/qr', (req, res) => {
  if (!qrImage) return res.send('No QR');
  res.send(`<img src="${qrImage}" />`);
});

/* ✅ CORRECCIÓN EXPRESS 5 */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log('Servidor corriendo en puerto 3000');
});
