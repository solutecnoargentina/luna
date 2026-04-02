module.exports = function attachLeadAlert(client) {

  const KEYWORDS = [
    'precio',
    'cuanto',
    'cuánto',
    'info',
    'informacion',
    'me interesa',
    'consulta',
    'hola'
  ];

  client.on('message', async msg => {
    try {
      const text = msg.body.toLowerCase();

      const isLead = KEYWORDS.some(k => text.includes(k));
      if (!isLead) return;

      const admin = client.info?.wid?._serialized;
      if (!admin) return;

      if (msg.from === admin) return;

      const alerta = `🔥 NUEVO LEAD\n\n📱 ${msg.from}\n💬 ${msg.body}`;

      await client.sendMessage(admin, alerta);

    } catch (err) {
      console.log('Error alerta lead:', err.message);
    }
  });

};
