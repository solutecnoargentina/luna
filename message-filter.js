module.exports = function shouldProcessMessage(msg, client) {
  try {

    // evitar mensajes propios
    if (msg.fromMe) return false;

    // evitar grupos
    if (msg.from.includes('@g.us')) return false;

    // evitar estados
    if (msg.from === 'status@broadcast') return false;

    // evitar canales/newsletters
    if (msg.from.includes('newsletter')) return false;

    // solo chats privados reales
    if (!msg.from.endsWith('@c.us')) return false;

    // evitar mensajes viejos (más de 60 segundos)
    const now = Math.floor(Date.now() / 1000);
    if (msg.timestamp && (now - msg.timestamp > 60)) return false;

    return true;

  } catch (err) {
    console.log('Error filtro mensaje:', err.message);
    return false;
  }
};
