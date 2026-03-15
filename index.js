const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const app = express();
app.use(express.json());

// 🔥 PON AQUÍ EL ID DEL GRUPO (cuando lo saques)
let grupoId = "120363424015495900@g.us";

// 🔥 CLIENTE WHATSAPP
const client = new Client({
  authStrategy: new LocalAuth()
});

// 🔹 QR
client.on("qr", (qr) => {
  console.log("📲 Escanea el QR:");
  qrcode.generate(qr, { small: true });
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

// 🔹 INICIALIZAR
client.initialize();


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