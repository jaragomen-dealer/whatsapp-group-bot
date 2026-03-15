# Bot de WhatsApp con whatsapp-web.js

## Requisitos previos

- Node.js instalado (versión 14 o superior)
- npm o yarn

## Instalación

1. Instalar las dependencias:

```bash
npm install
```

## Uso

1. Iniciar el bot:

```bash
node index.js
```

2. Al iniciar, se mostrará un código QR en la terminal:

```
QR RECEIVED **********
████████████████████
████████████████████
████████████████████
```

3. Escanea el código QR con tu WhatsApp (métodoLinked Devices):
   - Abre WhatsApp en tu teléfono
   - Ve a Menú → Dispositivos vinculados
   - Escanea el código QR

4. Cuando veas "WhatsApp listo!" en la consola, el bot está funcionando.

5. El bot detectará automáticamente el primer grupo de WhatsApp al que tengas acceso.

## Endpoint

### POST /run-automatizacion

Envía un mensaje automático al grupo de WhatsApp.

**Ejemplo de uso:**

```bash
curl -X POST http://localhost:3000/run-automatizacion
```

**Respuesta exitosa:**

```json
{
  "ok": true,
  "message": "Mensaje enviado correctamente"
}
```

El mensaje enviado será:
```
🔥 Mensaje automático desde la pastoral
```

## Características

- ✅ Usa Express en el puerto 3000
- ✅ LocalAuth para guardar sesión automáticamente
- ✅ Detección automática de grupos
- ✅ Manejo de errores robusto
- ✅ Mensajes en consola claros

## Notas

- La primera vez necesitas escanear el QR
- Las sesiones siguientes son automáticas (gracias a LocalAuth)
- Asegúrate de que el bot tenga acceso al menos a un grupo de WhatsApp
- El bot enviará mensajes al primer grupo que detecte

## Solución de problemas

Si no detecta grupos:
1. Asegúrate de que el bot esté en al menos un grupo de WhatsApp
2. Envía un mensaje manual desde tu teléfono al grupo para sincronizar
3. Reinicia el bot
