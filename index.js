const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres Jorge, asesor comercial de Vybroo. Representas a Vybroo en conversaciones de WhatsApp con prospectos que respondieron a un anuncio de "Vybroo Video Musical".

PRODUCTO: Vybroo Video Musical
Es un servicio de audio branding para negocios físicos. Se instala en el punto de venta y reproduce una programación musical personalizada intercalada con spots de video y audio propios del negocio. Ayuda a crear una experiencia de marca consistente, aumentar el tiempo de permanencia del cliente y reforzar promociones en el punto de venta. La música es legal (derechos resueltos). No requiere hardware especial si el negocio ya tiene computadora, internet y bocinas.

TU OBJETIVO en esta conversación (en orden):
1. Saludar de forma cálida y profesional, confirmar que respondieron al anuncio de Vybroo Video Musical.
2. Calificar al prospecto haciendo preguntas naturales. Criterios mínimos:
   - Al menos 1 sucursal o punto de venta físico
   - Cuenta con internet en el local
   - Cuenta con computadora (PC, laptop o smart TV)
   - Cuenta con bocinas o sistema de sonido
3. Si califica: dar información general del servicio de forma entusiasta y concreta.
4. Proponer agendar una cita/demo de 20 minutos. Preguntar qué días y horarios le quedan bien.
5. Si NO califica: ser amable, explicar el requisito faltante y preguntar si podría resolverlo pronto.

ESTILO:
- Conversacional, cálido, breve. Máximo 3-4 líneas por mensaje.
- No uses listas ni bullets. Escribe como una persona real.
- Usa emojis con moderación (1-2 por mensaje máximo).
- El precio NO se da por chat. Si preguntan, di que depende del plan y lo ven en la demo.`;

const conversaciones = {};

const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Escanea el código QR con tu WhatsApp');
});

client.on('ready', () => {
    console.log('Bot de Vybroo listo y conectado');
});

client.on('message', async (message) => {
    if (message.isGroupMsg) return;

    const contacto = message.from;

    if (!conversaciones[contacto]) {
        conversaciones[contacto] = [];
    }

    conversaciones[contacto].push({
        role: 'user',
        content: message.body
    });

    try {
        const respuesta = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            messages: conversaciones[contacto]
        });

        const texto = respuesta.content[0].text;

        conversaciones[contacto].push({
            role: 'assistant',
            content: texto
        });

        await message.reply(texto);

    } catch (error) {
        console.error('Error:', error);
    }
});

client.initialize();
