import express from "express";
import { makeWASocket, useMultiFileAuthState, DisconnectReason, delay } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from 'qrcode';

const app = express();
app.use(express.json());

// Variable global para el socket
let sock = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let currentQR = null;

// Función para conectar a WhatsApp
async function connectToWhatsApp() {
  try {
    // Usar múltiples archivos para autenticación
    const { state, saveCreds } = await useMultiFileAuthState('.wwebjs_auth');

    // Crear socket de WhatsApp
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["Pastoral Bot", "Chrome", "1.0.0"]
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
        console.log('✅ WhatsApp conectado!');
        reconnectAttempts = 0;
        currentQR = null;
      }
    });

  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`🔄 Reconectando... (intento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      await delay(5000);
      connectToWhatsApp();
    }
  }
}

// Iniciar conexión
console.log('⏳ Inicializando bot de WhatsApp...');
connectToWhatsApp();

// 🔥 ENDPOINT QR - Muestra el QR visualmente
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

// 🔥 ENDPOINT /send-group - Simplificado y estable
app.post('/send-group', async (req, res) => {
  try {
    // Validar que sock existe y está conectado
    if (!sock) {
      return res.status(500).json({
        error: true,
        message: 'Socket no inicializado'
      });
    }

    // Obtener mensaje del body
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: true,
        message: 'Mensaje es requerido'
      });
    }

    // Obtener todos los grupos
    const groups = await sock.groupFetchAllParticipating();

    // Obtener el primer grupo
    const groupIds = Object.keys(groups);

    if (groupIds.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'No se encontró ningún grupo'
      });
    }

    // Usar el primer grupo
    const groupId = groupIds[0];

    // Enviar mensaje
    await sock.sendMessage(groupId, { text: message });

    res.json({
      ok: true,
      message: 'Mensaje enviado correctamente'
    });

  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.message);

    // Manejar errores específicos de Baileys
    if (error.message.includes('Connection not open') || error.message.includes('socket not open')) {
      return res.status(503).json({
        error: true,
        message: 'WhatsApp no está conectado. Intenta nuevamente en unos segundos.'
      });
    }

    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

// Endpoint legacy /run-automatizacion (redirige a /send-group)
app.post('/run-automatizacion', async (req, res) => {
  try {
    if (!sock) {
      return res.status(500).json({
        error: true,
        message: 'Socket no inicializado'
      });
    }

    const groups = await sock.groupFetchAllParticipating();
    const groupIds = Object.keys(groups);

    if (groupIds.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'No se encontró ningún grupo'
      });
    }

    const groupId = groupIds[0];
    await sock.sendMessage(groupId, { text: '🔥 Mensaje automático desde la pastoral' });

    res.json({
      ok: true,
      message: 'Mensaje enviado correctamente'
    });

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('Connection not open') || error.message.includes('socket not open')) {
      return res.status(503).json({
        error: true,
        message: 'WhatsApp no está conectado'
      });
    }

    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

// 🔹 RUTA INICIO
app.get("/", (req, res) => {
  const isConnected = sock && sock.user;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bot Pastoral</title>
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
        .status {
          font-size: 24px;
          margin: 20px 0;
        }
        .connected {
          color: #10b981;
        }
        .disconnected {
          color: #f59e0b;
        }
        a {
          display: inline-block;
          margin: 10px;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.3s;
        }
        a:hover {
          background: #764ba2;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔥 Bot Pastoral (Baileys)</h1>
        <div class="status ${isConnected ? 'connected' : 'disconnected'}">
          ${isConnected ? '✅ Conectado a WhatsApp' : '⏳ No conectado'}
        </div>
        ${!isConnected ? '<a href="/qr">Escanear QR</a>' : '<a href="#" onclick="fetch(\'/send-group\', {method: \'POST\', headers: {\'Content-Type\': \'application/json\'}, body: JSON.stringify({message: \'🔥 Mensaje de prueba\'})}).then(r=>r.json()).then(d=>alert(d.message))">Probar Bot</a>'}
      </div>
    </body>
    </html>
  `);
});

// 🔹 SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 Ve a: http://localhost:${PORT}/qr para escanear el QR`);
});
