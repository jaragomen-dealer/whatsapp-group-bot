# Despliegue en Railway

## Preparación completa ✅

Tu bot está listo para desplegar en Railway con las siguientes configuraciones:

## Archivos configurados:

### 1. package.json
✅ Script `start` configurado: `node index.js`
✅ Dependencias correctas instaladas

### 2. index.js
✅ Usa `process.env.PORT` para puerto dinámico
✅ Endpoint `/run-automatizacion` funcional
✅ ID del grupo configurado

### 3. Procfile
✅ Creado para Railway

## Pasos para desplegar en Railway:

### Opción 1: Desde GitHub (Recomendado)

1. **Sube tu código a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Bot WhatsApp listo para Railway"
   git push origin main
   ```

2. **En Railway**
   - Ve a [railway.app](https://railway.app/)
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Selecciona tu repositorio
   - Railway detectará automáticamente Node.js

3. **Configuración automática**
   - Railway instalará las dependencias
   - Asignará un puerto automáticamente
   - Tu bot estará en: `https://tu-app.railway.app`

### Opción 2: Desde CLI de Railway

1. **Instala Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login y despliegue**
   ```bash
   railway login
   railway init
   railway up
   ```

## Variables de entorno (Opcionales)

Si necesitas configurar el puerto manualmente, agrega en Railway:

```
PORT=3000
```

## Endpoint del bot en producción:

```
POST https://tu-app.railway.app/run-automatizacion
```

**Ejemplo con curl:**
```bash
curl -X POST https://tu-app.railway.app/run-automatizacion \
  -H "Content-Type: application/json" \
  -d '{"message": "🔥 Mensaje automático desde la pastoral"}'
```

## Características del despliegue:

✅ **Puerto dinámico**: Railway asigna el puerto automáticamente
✅ **Reinicio automático**: Si el bot falla, Railway lo reinicia
✅ **Logs en tiempo real**: Puedes ver los logs desde el dashboard de Railway
✅ **Dominio HTTPS**: Railway proporciona SSL gratis
✅ **Persistencia**: La sesión de WhatsApp se guardará en `.wwebjs_auth`

## Importante - Primera vez en Railway:

1. **Escanea el QR**
   - En Railway, ve a "Logs"
   - Busca el QR que aparece en los logs
   - Escanea el QR con tu WhatsApp (Linked Devices)

2. **Verifica el estado**
   - Deberías ver: "✅ WhatsApp listo!"
   - Y: "🚀 Servidor corriendo en puerto XXXX"

## Solución de problemas:

### El QR no aparece en los logs
- Asegúrate de que el bot esté iniciándose correctamente
- Revisa los logs en el dashboard de Railway

### Error de timeout
- Railway puede tardar unos minutos en iniciar el bot
- Se paciente, el primer arranque toma más tiempo

### La sesión se pierde
- Railway guarda la sesión en `.wwebjs_auth`
- Asegúrate de que la carpeta esté en el `.gitignore`
- La sesión se mantendrá entre reinicios

## Costos:

- Railway tiene un plan gratuito de $5/mes
- Suficiente para desarrollo y uso personal
- Monitorea el uso desde el dashboard de Railway

## ¡Listo para producción! 🚀
