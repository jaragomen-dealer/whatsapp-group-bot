# Solución de errores en Railway

## Error actual:
```
error while loading shared libraries: libglib-2.0.so.0: cannot open shared object file
```

## ✅ Solución aplicada

He agregado múltiples archivos para asegurar que las dependencias del sistema se instalen correctamente en Railway:

### Archivos creados:
1. **[build.sh](build.sh)** - Script de instalación de dependencias
2. **[railway.toml](railway.toml)** - Configuración NIXPACKS
3. **[Procfile](Procfile)** - Actualizado para ejecutar build.sh

## 🚀 Pasos para desplegar correctamente:

### Opción 1: Configurar variables de entorno en Railway (Recomendado)

1. **En tu proyecto de Railway:**
   - Ve a la pestaña "Variables"
   - Agrega estas variables:

   ```
   NIXPACKS_PKGS=libglib-2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 libpango-1.0-0 libcairo2 libatspi2.0-0
   ```

2. **Redeploy el proyecto:**
   - Click en "Redeploy" en el dashboard de Railway
   - O usa el botón "New Deployment"

### Opción 2: Usar Railway CLI con configuración manual

1. **Instala Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Configura las variables:**
   ```bash
   railway variables set NIXPACKS_PKGS "libglib-2.0-0 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 libpango-1.0-0 libcairo2 libatspi2.0-0"
   ```

3. **Redeploy:**
   ```bash
   railway up
   ```

## 📋 Lista de dependencias del sistema necesarias:

```
libglib2.0-0         # Bibliotecas GLib (core)
libnss3              # Network Security Services
libatk1.0-0          # ATK toolkit
libatk-bridge2.0-0   # ATK bridge
libcups2             # CUPS printing
libdrm2              # Direct Rendering Manager
libxkbcommon0        # XKB common
libxcomposite1       # X Composite extension
libxdamage1          # X Damage extension
libxfixes3           # X Fixes extension
libxrandr2           # X RandR extension
libgbm1              # Generic Buffer Manager
libasound2           # ALSA sound
libpangocairo-1.0-0  # Pango Cairo
libpango-1.0-0       # Pango
libcairo2            # Cairo graphics
libatspi2.0-0        # AT-SPI
```

## 🔍 Verificar el despliegue:

Después del redeploy, verifica los logs:

1. **Deberías ver:**
   ```
   📦 Instalando dependencias del sistema...
   ✅ Dependencias del sistema instaladas correctamente
   🚀 Servidor corriendo en puerto 8080
   ```

2. **Si ves errores:**
   - Revisa que la variable `NIXPACKS_PKGS` esté correctamente configurada
   - Verifica que no haya espacios extras o saltos de línea

## ⚠️ Nota importante:

Railway puede tardar varios minutos en:
- Instalar las dependencias del sistema
- Descargar Chrome/Chromium
- Inicializar el bot de WhatsApp

Sé paciente y revisa los logs periódicamente.

## 🎯 Endpoint del bot en producción:

```
POST https://tu-app.railway.app/run-automatizacion
```

## 📞 Soporte:

Si sigue sin funcionar, verifica:
1. Logs completos en Railway
2. Que la variable `NIXPACKS_PKGS` esté en una sola línea
3. Que todas las dependencias estén listadas sin comillas

---

**Documentación de referencia:**
- [Railway System Dependencies](https://docs.railway.app/reference/system-dependencies)
- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)
