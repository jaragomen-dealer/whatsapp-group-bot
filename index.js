import express from "express";
import { makeWASocket, useMultiFileAuthState, DisconnectReason, delay } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from 'qrcode';

const app = express();
app.use(express.json());

// ============================================
// VARIABLES GLOBALES
// ============================================
let sock = null;
let reconnectAttempts = 0;
let isDetachedFrameIgnored = false;
const MAX_RECONNECT_ATTEMPTS = 5;
let currentQR = null;

// ============================================
// MANEJO GLOBAL DE ERRORES
// ============================================
// Ignorar específicamente errores de "detached frame"
process.on("uncaughtException", (err) => {
  if (err.message && err.message.includes("detached frame")) {
    isDetachedFrameIgnored = true;
    return; // Ignorar este error
  }
  console.error("❌ Uncaught Exception:", err.message);
});

process.on("unhandledRejection", (reason, promise) => {
  if (reason instanceof Error && reason.message && reason.message.includes("detached frame")) {
    isDetachedFrameIgnored = true;
    return; // Ignorar este error
  }
  console.error("❌ Unhandled Rejection:", reason);
});

// ============================================
// FUNCIÓN DE CONEXIÓN A WHATSAPP
// ============================================
async function connectToWhatsApp() {
  try {
    // Usar múltiples archivos para autenticación
    const { state, saveCreds } = await useMultiFileAuthState('.wwebjs_auth');

    // Crear socket de WhatsApp
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["Pastoral Bot", "Chrome", "1.0.0"],
      defaultQueryTimeoutMs: undefined,
      keepAliveIntervalMs: 30000
    });

    // Guardar credenciales cuando se actualicen
    sock.ev.on('creds.update', saveCreds);

    // Manejar actualizaciones de conexión
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📲 QR Generado - Ve a: http://localhost:3000/qr');
        try {
          currentQR = await qrcode.toDataURL(qr);
        } catch (err) {
          console.error('Error generando QR:', err.message);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error instanceof Boom &&
          lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

        const isDetachedFrame = lastDisconnect?.error?.message?.includes('detached frame');

        if (isDetachedFrame) {
          console.log('⚠️ Detached frame detectado (ignorado)');
          return; // No reconectar por detached frame
        }

        console.log('❌ Conexión cerrada:', lastDisconnect?.error?.message);

        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`🔄 Reconectando... (intento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          await delay(5000);
          connectToWhatsApp();
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.log('❌ Máximo de intentos de reconexión alcanzados');
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp listo!');
        reconnectAttempts = 0;
        currentQR = null;
      }
    });

  } catch (error) {
    // Ignorar errores de detached frame
    if (error.message && error.message.includes("detached frame")) {
      console.log('⚠️ Detached frame en inicialización (ignorado)');
      return;
    }

    console.error('❌ Error al conectar:', error.message);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`🔄 Reconectando... (intento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      await delay(5000);
      connectToWhatsApp();
    }
  }
}

// ============================================
// INICIAR CONEXIÓN
// ============================================
console.log('⏳ Inicializando bot de WhatsApp...');
connectToWhatsApp();

// ============================================
// ENDPOINT GET / - Texto simple
// ============================================
app.get("/", (req, res) => {
  res.send("Bot WhatsApp funcionando");
});

// ============================================
// ENDPOINT GET /status - Estado de conexión
// ============================================
app.get("/status", (req, res) => {
  const conectado = !!(sock && sock.user);
  res.json({ conectado });
});

// ============================================
// ENDPOINT GET /qr - Visualización del QR
// ============================================
app.get('/qr', (req, res) => {
  if (!currentQR) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bot Pastoral - QR</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
          }
          h1 {
            color: #667eea;
            margin-bottom: 20px;
          }
          .message {
            color: #666;
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔥 Bot Pastoral</h1>
          <p class="message">
            ${sock && sock.user ? '✅ WhatsApp ya está conectado' : '⏳ Esperando QR...'}
          </p>
          <p class="message" style="font-size: 14px; margin-top: 20px;">
            <a href="/" style="color: #667eea;">Volver al inicio</a>
          </p>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bot Pastoral - Escanear QR</title>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          text-align: center;
        }
        h1 {
          color: #667eea;
          margin-bottom: 20px;
        }
        .qr-image {
          margin: 20px 0;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 10px;
          display: inline-block;
        }
        .instructions {
          color: #666;
          margin-top: 20px;
        }
        .refresh {
          margin-top: 20px;
        }
        a {
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔥 Bot Pastoral - WhatsApp</h1>
        <p class="instructions">
          <strong>Paso 1:</strong> Abre WhatsApp en tu teléfono<br>
          <strong>Paso 2:</strong> Ve a Menú → Dispositivos vinculados<br>
          <strong>Paso 3:</strong> Escanea este código QR
        </p>
        <div class="qr-image">
          <img src="${currentQR}" alt="QR Code" style="width: 300px; height: 300px;">
        </div>
        <p class="instructions">
          El código expira en 30 segundos
        </p>
        <div class="refresh">
          <a href="/">Volver al inicio</a> |
          <a href="/qr" onclick="location.reload()">Actualizar</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ============================================
// ENDPOINT POST /send-group - Envío a grupos con retry
// ============================================
async function sendWithRetry(groupId, message, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sock.sendMessage(groupId, { text: message });
      return { success: true };
    } catch (error) {
      // Ignorar detached frame
      if (error.message && error.message.includes("detached frame")) {
        console.log(`⚠️ Detached frame en intento ${attempt}/${maxRetries} (ignorado)`);
        if (attempt < maxRetries) {
          await delay(1000);
          continue;
        }
        return { success: false, error: "Detached frame" };
      }

      if (attempt === maxRetries) {
        throw error;
      }

      console.log(`⚠️ Intento ${attempt}/${maxRetries} falló, reintentando...`);
      await delay(1000);
    }
  }
  return { success: false, error: "Max retries reached" };
}

app.post('/send-group', async (req, res) => {
  try {
    // Validar que sock existe
    if (!sock) {
      return res.status(500).json({
        success: false,
        error: 'Socket no inicializado'
      });
    }

    // Obtener mensaje del body
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Mensaje es requerido'
      });
    }

    // Obtener todos los grupos
    const groups = await sock.groupFetchAllParticipating();

    // Obtener el primer grupo
    const groupIds = Object.keys(groups);

    if (groupIds.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró ningún grupo'
      });
    }

    // Usar el primer grupo
    const groupId = groupIds[0];

    // Enviar mensaje con retry
    const result = await sendWithRetry(groupId, message, 2);

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Error al enviar mensaje'
      });
    }

  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.message);

    // Ignorar detached frame
    if (error.message && error.message.includes("detached frame")) {
      return res.status(503).json({
        success: false,
        error: 'Detached frame detectado, reintentando...'
      });
    }

    // Manejar errores específicos de Baileys
    if (error.message.includes('Connection not open') || error.message.includes('socket not open')) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp no está conectado. Intenta nuevamente en unos segundos.'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ENDPOINT LEGACY /run-automatizacion
// ============================================
app.post('/run-automatizacion', async (req, res) => {
  try {
    if (!sock) {
      return res.status(500).json({
        ok: false,
        message: 'Socket no inicializado'
      });
    }

    const groups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(groups);

    if (groupIds.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'No se encontró ningún grupo'
      });
    }

    const groupId = groupIds[0];
    const result = await sendWithRetry(groupId, '🔥 Mensaje automático desde la pastoral', 2);

    if (result.success) {
      res.json({
        ok: true,
        message: 'Mensaje enviado correctamente'
      });
    } else {
      res.status(500).json({
        ok: false,
        message: result.error || 'Error al enviar mensaje'
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message && error.message.includes("detached frame")) {
      return res.status(503).json({
        ok: false,
        message: 'Detached frame detectado'
      });
    }

    if (error.message.includes('Connection not open') || error.message.includes('socket not open')) {
      return res.status(503).json({
        ok: false,
        message: 'WhatsApp no está conectado'
      });
    }

    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

// ============================================
// SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 Ve a: http://localhost:${PORT}/qr para escanear el QR`);
});
