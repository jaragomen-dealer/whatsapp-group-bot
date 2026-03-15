# 🐳 Despliegue en Railway con Dockerfile

## ✅ Configuración completa

He creado un Dockerfile completo que instala todas las dependencias necesarias para que tu bot de WhatsApp funcione correctamente en Railway.

## 🚀 Pasos para desplegar:

### 1. **Ve a tu proyecto en Railway**

### 2. **Configura el proyecto para usar Docker**

En Railway:
- Ve a la pestaña **"Settings"**
- En **"Build Type"**, selecciona **"Dockerfile"**
- O asegúrate que el archivo `railway.toml` tenga `builder = "dockerfile"`

### 3. **Redeploy el proyecto**

Click en **"New Deployment"** o **"Redeploy"**

### 4. **Verifica los logs**

Deberías ver:
```
🚀 Servidor corriendo en puerto 8080
⏳ Inicializando cliente de WhatsApp...
📲 Escanea el QR:
████████████████
████████████████
```

## 📋 Archivos creados:

✅ **[Dockerfile](Dockerfile)** - Imagen Docker completa con dependencias
✅ **[.dockerignore](.dockerignore)** - Excluye archivos innecesarios
✅ **[railway.toml](railway.toml)** - Configuración para usar Docker
✅ **[Procfile](Procfile)** - Comando de inicio actualizado

## 🔧 Qué incluye el Dockerfile:

### Dependencias del sistema:
- `libglib2.0-0` - Bibliotecas GLib
- `libnss3` - Network Security Services
- `libatk1.0-0`, `libatk-bridge2.0-0` - ATK toolkit
- `libcups2` - Soporte de impresión
- `libdrm2`, `libgbm1` - Direct Rendering Manager
- `libxkbcommon0`, `libxcomposite1`, `libxdamage1`, `libxfixes3`, `libxrandr2` - X11
- `libasound2` - ALSA sound
- `libpangocairo-1.0-0`, `libpango-1.0-0`, `libcairo2` - Gráficos
- `libatspi2.0-0` - AT-SPI

### Configuración de Node:
- Node.js 18 (versión estable)
- Directorio de trabajo: `/app`
- Puerto expuesto: 3000 (Railway lo mapeará automáticamente)

## ⏱️ Tiempos de despliegue:

- **Primer despliegue:** 5-10 minutos (construcción de imagen Docker)
- **Redeploys posteriores:** 2-5 minutos

## 🎯 Endpoint del bot en producción:

```
POST https://tu-app.railway.app/run-automatizacion
```

**Ejemplo:**
```bash
curl -X POST https://tu-app.railway.app/run-automatizacion \
  -H "Content-Type: application/json" \
  -d '{"message": "🔥 Mensaje automático desde la pastoral"}'
```

## 🔍 Solución de problemas:

### Si el Docker build falla:
1. Verifica que el `Dockerfile` esté en la raíz del repo
2. Asegúrate que Railway esté usando "Dockerfile" como build type
3. Revisa los logs completos del build

### Si el bot no inicia:
1. Espera 5-10 minutos para la primera construcción
2. Verifica que no hay errores en los logs
3. Asegúrate de escanear el QR cuando aparezca

### Si la sesión se pierde:
- La sesión se guarda en `.wwebjs_auth` dentro del contenedor
- Railway puede perder datos entre reinicios si no usas un volumen
- Considera usar Railway Disk para persistencia

## 💡 Ventajas de usar Dockerfile:

✅ **Reproducibilidad** - Misma dependencias siempre
✅ **Aislamiento** - No depende del sistema de Railway
✅ **Control total** - Sabes exactamente qué está instalado
✅ **Debugging más fácil** - Puedes probar localmente

## 🧪 Probar localmente (opcional):

```bash
# Construir imagen
docker build -t whatsapp-bot .

# Ejecutar contenedor
docker run -p 3000:3000 whatsapp-bot
```

---

¡Tu bot ahora está listo para Railway con Docker! 🎉

El enfoque con Dockerfile es **MÁS confiable** que intentar instalar dependencias del sistema en tiempo de ejecución, porque todas las dependencias se instalan durante la construcción de la imagen Docker.
