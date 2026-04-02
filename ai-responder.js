const axios = require('axios');

module.exports = function attachAIResponder(client) {

  client.on('message', async msg => {
    try {

      // evitar responder a sí mismo
      if (msg.fromMe) return;

      const prompt = `
Sos un empleado de Solutecno Argentina.

Tu objetivo:
- vender servicios
- responder dudas
- ser amable y profesional
- NO decir que sos una IA

Servicios:
- bots de WhatsApp con IA
- automatización
- sistemas web
- marketing

Mensaje del cliente:
"${msg.body}"

Respondé como humano, breve y claro.
`;

      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'qwen2.5:3b',
        prompt: prompt,
        stream: false
      });

      const reply = response.data.response;

      if (!reply) return;

      await client.sendMessage(msg.from, reply);

    } catch (err) {
      console.log('Error IA:', err.message);
    }
  });

};
