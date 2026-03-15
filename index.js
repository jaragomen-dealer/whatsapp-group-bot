const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

// 🔥 CLIENTE WHATSAPP con reconexión automática
let client;

function iniciarCliente() {

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "pastoral-bot"
    }),
    puppeteer: {
      executablePath: '/usr/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  // 🔹 QR
  client.on('qr', async (qr) => {
    console.log('📲 Escanea este link:');
    const qrUrl = await qrcode.toDataURL(qr);
    console.log(qrUrl);
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp listo!');
  });

  client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp desconectado:', reason);
    console.log('🔄 Reconectando...');
    setTimeout(() => {
      iniciarCliente();
    }, 5000);
  });

  client.on('auth_failure', msg => {
    console.error('❌ Error de autenticación:', msg);
  });

  client.initialize();
}

// Iniciar cliente
console.log('⏳ Inicializando bot de WhatsApp...');
iniciarCliente();

// 🔥 ENDPOINT PARA AUTOMATIZACIÓN
app.post('/run-automatizacion', async (req, res) => {
  try {

    if (!client || !client.info) {
      return res.status(500).json({
        error: true,
        message: 'WhatsApp no está listo'
      });
    }

    const chats = await client.getChats();
    const grupo = chats.find(c => c.isGroup);

    if (!grupo) {
      return res.status(404).json({
        error: true,
        message: 'Grupo no encontrado'
      });
    }

    await grupo.sendMessage('🔥 Mensaje automático desde la pastoral');

    res.json({
      ok: true,
      message: 'Mensaje enviado'
    });

  } catch (error) {
    console.error('❌ Error enviando:', error.message);

    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

// 🔹 RUTA TEST
app.get("/", (req, res) => {
  res.send("🔥 Bot Pastoral funcionando correctamente");
});

// 🔹 SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
