const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

// 🔥 PON AQUÍ EL ID DEL GRUPO (cuando lo saques)
let grupoId = "120363424015495900@g.us";

// 🔥 CLIENTE WHATSAPP
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "pastoral-bot"
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process' // Importante para Railway
    ],
  }
});

// 🔹 QR
client.on('qr', async (qr) => {
  console.log('📲 Escanea este link:');
  const qrUrl = await qrcode.toDataURL(qr);
  console.log(qrUrl);
});

// 🔹 READY
client.on("ready", () => {
  console.log("✅ WhatsApp listo!");
});

// 🔥 ESCUCHAR MENSAJES (para obtener ID del grupo)
client.on("message", (msg) => {
  console.log("📩 Mensaje recibido de:", msg.from);
  console.log("💬 Texto:", msg.body);
});

// 🔹 ERROR HANDLING
client.on('auth_failure', msg => {
  console.error('❌ Error de autenticación:', msg);
});

client.on("disconnected", (reason) => {
  console.log("❌ Cliente desconectado:", reason);
});

// 🔹 INICIALIZAR
console.log("⏳ Inicializando cliente de WhatsApp...");
client.initialize().catch((err) => {
  console.error("❌ Error al inicializar:", err.message);
  // No matar el proceso, solo loggear el error
});


// 🔥 ENDPOINT PARA n8n
app.post("/run-automatizacion", async (req, res) => {
  try {

    const message = req.body.message;

    if (!grupoId) {
      return res.status(400).json({
        error: true,
        message: "❌ Aún no has puesto el ID del grupo"
      });
    }

    if (!message) {
      return res.status(400).json({
        error: true,
        message: "❌ Falta el mensaje"
      });
    }

    await client.sendMessage(grupoId, message);

    console.log("✅ Mensaje enviado:", message);

    res.json({
      ok: true,
      message: "Mensaje enviado correctamente"
    });

  } catch (error) {
    console.log("❌ Error:", error.message);

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
