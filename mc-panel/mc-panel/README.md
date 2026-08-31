# Panel web para tu servidor de Minecraft

Esto te deja con una página web privada donde tú y tus amigos pueden pulsar
"Iniciar servidor" o "Detener servidor", con una consola en vivo debajo. Corre
en tu PC junto al servidor de Minecraft, y se comparte con tus amigos a
través de Hamachi (no hace falta abrir puertos en tu router).

Hay tres piezas que montar, en este orden: **1)** el servidor de Minecraft,
**2)** Hamachi, **3)** este panel web.

---

## 1. Servidor de Minecraft

Si ya tienes un servidor de Minecraft funcionando en tu PC, pasa al paso 2.

1. Instala Java (el servidor lo necesita). Descárgalo de
   [adoptium.net](https://adoptium.net) — elige la versión LTS más reciente.
2. Crea una carpeta para el servidor, por ejemplo
   `C:\Users\TuUsuario\Desktop\servidor-minecraft`.
3. Descarga `server.jar` desde la
   [web oficial de Minecraft](https://www.minecraft.net/es-es/download/server)
   y guárdalo en esa carpeta.
4. Abre una terminal (cmd) en esa carpeta y ejecuta una vez:
   ```
   java -jar server.jar nogui
   ```
   Esto falla la primera vez, pero genera un archivo `eula.txt`.
5. Abre `eula.txt` y cambia `eula=false` por `eula=true`. Guarda.
6. Si quieres poner tu mundo actual, copia la carpeta de tu partida (la que
   tiene `level.dat` dentro) a esta carpeta y renómbrala a `world`.
7. (Opcional) Edita `server.properties` para ajustar nombre del mundo,
   dificultad, modo de juego, etc.

No hace falta que arranques el servidor a mano otra vez — eso lo hará el
panel web en el paso 3.

---

## 2. Hamachi (para que tus amigos se conecten sin abrir puertos)

1. Instala Hamachi en tu PC (el que hostea) desde
   [vpn.net](https://vpn.net).
2. Abre Hamachi → **Crear una nueva red** → ponle nombre y contraseña.
3. Anota la **dirección IPv4 de Hamachi** que te asigna (algo como
   `25.xx.xx.xx`) — la verás en la ventana principal de Hamachi.
4. Cada amigo instala Hamachi también, y usa **Unirse a una red existente**
   con el nombre y la contraseña que pusiste.
5. Una vez todos estén dentro de la red, ya se pueden ver entre sí por su IP
   de Hamachi. Esa IP tuya es la que usarán para todo: para el panel web y
   para conectarse a Minecraft.

---

## 3. El panel web

### Requisitos

- [Node.js](https://nodejs.org) instalado en el PC que hostea (versión 18 o
  superior).

### Instalación

1. Copia la carpeta `mc-panel` a tu PC.
2. Abre una terminal dentro de esa carpeta y ejecuta:
   ```
   npm install
   ```
3. Copia `.env.example` y renómbralo a `.env`. Ábrelo y edita:
   - `PANEL_PASSWORD`: pon una contraseña para el panel (la pedirá el
     navegador).
   - `MC_SERVER_DIR`: la ruta completa a la carpeta del servidor de
     Minecraft del paso 1.
   - Revisa `MC_SERVER_JAR` y la RAM (`MC_MIN_RAM` / `MC_MAX_RAM`) si hace
     falta.

### Arrancar el panel

```
npm start
```

Verás algo como `Panel de Minecraft escuchando en el puerto 8080`. Déjalo
corriendo en esa terminal — mientras esté abierta, el panel está disponible.

### Cómo lo usan tus amigos

1. Deben estar conectados a la misma red de Hamachi.
2. Abren en el navegador: `http://TU-IP-DE-HAMACHI:8080` (la IP del paso 2).
3. El navegador pedirá usuario y contraseña: el usuario es `admin` (o el que
   pusiste en `PANEL_USER`) y la contraseña que definiste en `.env`.
4. Pulsan **Iniciar servidor**. La consola de abajo muestra el arranque en
   vivo; cuando el estado cambia a "En línea", el servidor de Minecraft ya
   está listo.
5. En el propio Minecraft, se conectan por **Multijugador → Añadir
   servidor** usando la misma IP de Hamachi y el puerto de Minecraft
   (por defecto `25565`), ej: `TU-IP-DE-HAMACHI:25565`.
6. Cuando terminen de jugar, cualquiera puede pulsar **Detener servidor**
   desde la misma página para apagarlo de forma segura (guarda el mundo
   antes de cerrar).

---

## Notas

- Tu PC tiene que estar encendido para que el panel y el servidor funcionen;
  esto no lo hostea nadie más.
- El panel solo es accesible dentro de tu red de Hamachi, no desde internet
  en general — solo quien tenga Hamachi + la contraseña del panel puede
  usarlo.
- Si Windows pregunta por permisos de red la primera vez que arrancas
  `node server.js` o el servidor de Minecraft, permite el acceso (si no,
  Hamachi no podrá enrutar el tráfico hasta ellos).
- Si quieres que el panel se mantenga corriendo aunque cierres la terminal,
  puedes usar [pm2](https://www.npmjs.com/package/pm2): instala con
  `npm install -g pm2` y arranca con `pm2 start server.js`.
