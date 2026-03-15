const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

// Variable global para guardar el QR
let currentQR = null;

// 🔥 CLIENTE WHATSAPP con reconexión automática
let client;

function iniciarCliente() {

  const puppeteerConfig = {
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
  };

  // Solo usar executablePath en Linux/Railway
  if (process.platform !== 'win32') {
    puppeteerConfig.executablePath = '/usr/bin/chromium';
  }

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "pastoral-bot"
    }),
    puppeteer: puppeteerConfig
  });

  // 🔹 QR
  client.on('qr', async (qr) => {
    console.log('📲 QR Generado - Ve a: http://localhost:3000/qr');
    currentQR = await qrcode.toDataURL(qr);
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp listo!');
    currentQR = null; // Limpiar QR cuando está listo
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
            ${currentQR === null ? '✅ WhatsApp ya está conectado' : '⏳ Esperando QR...'}
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

    const grupo = chats.find(chat => chat.isGroup);

    if (!grupo) {
      return res.status(404).json({
        error: true,
        message: 'No se encontró ningún grupo'
      });
    }

    await grupo.sendMessage('🔥 Mensaje automático desde la pastoral');

    res.json({
      ok: true,
      message: 'Mensaje enviado correctamente'
    });

  } catch (error) {
    console.error('❌ Error:', error.message);

    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

// 🔹 RUTA INICIO
app.get("/", (req, res) => {
  const isConnected = client && client.info;
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
        <h1>🔥 Bot Pastoral</h1>
        <div class="status ${isConnected ? 'connected' : 'disconnected'}">
          ${isConnected ? '✅ Conectado a WhatsApp' : '⏳ No conectado'}
        </div>
        ${!isConnected ? '<a href="/qr">Escanear QR</a>' : '<a href="/run-automatizacion" onclick="fetch(\'/run-automatizacion\', {method: \'POST\'}).then(r=>r.json()).then(d=>alert(d.message))">Probar Bot</a>'}
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
