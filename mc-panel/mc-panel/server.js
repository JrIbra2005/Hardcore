require('dotenv').config();

const express = require('express');
const basicAuth = require('basic-auth');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// =====================================================
// CONFIGURACIÓN
// =====================================================

const PORT = Number(process.env.PANEL_PORT || 8080);

const PANEL_USER = process.env.PANEL_USER || 'admin';
const PANEL_PASSWORD =
  process.env.PANEL_PASSWORD || 'cambia-esta-clave';

const MC_DIR =
  process.env.MC_SERVER_DIR ||
  'C:\\Users\\locur\\Desktop\\server hardcore';

const MC_JAR =
  process.env.MC_SERVER_JAR ||
  'paper-26.2-121.jar';

const MIN_RAM =
  process.env.MC_MIN_RAM || '2G';

const MAX_RAM =
  process.env.MC_MAX_RAM || '6G';

// =====================================================
// ESTADO
// =====================================================

let mcProcess = null;

let state = 'stopped';

let logBuffer = [];

const MAX_LOG_LINES = 300;

// =====================================================
// LOG
// =====================================================

function appendLog(line) {
  if (!line) return;

  const text = String(line).replace(/\r/g, '');

  const lines = text.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    logBuffer.push(line);

    if (logBuffer.length > MAX_LOG_LINES) {
      logBuffer.shift();
    }
  }
}

// =====================================================
// AUTENTICACIÓN
// =====================================================

function auth(req, res, next) {
  const credentials = basicAuth(req);

  if (
    !credentials ||
    credentials.name !== PANEL_USER ||
    credentials.pass !== PANEL_PASSWORD
  ) {
    res.set(
      'WWW-Authenticate',
      'Basic realm="Panel Minecraft"'
    );

    return res.status(401).send('Acceso denegado');
  }

  next();
}

// =====================================================
// EXPRESS
// =====================================================

app.use(auth);

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);

// =====================================================
// ESTADO DEL SERVIDOR
// =====================================================

app.get('/api/status', (req, res) => {
  res.json({
    state: state,
    running: mcProcess !== null,
    log: logBuffer.join('\n')
  });
});

// =====================================================
// ENCENDER
// =====================================================

app.post('/api/start', (req, res) => {

  if (mcProcess) {
    return res.status(400).json({
      error: 'El servidor ya está iniciado.'
    });
  }

  const jarPath = path.join(
    MC_DIR,
    MC_JAR
  );

  console.log('');
  console.log('======================================');
  console.log('     INICIANDO SERVIDOR MINECRAFT');
  console.log('======================================');
  console.log('');

  console.log('Carpeta:');
  console.log(MC_DIR);

  console.log('');

  console.log('Paper:');
  console.log(jarPath);

  console.log('');

  // Comprobar carpeta

  if (!fs.existsSync(MC_DIR)) {

    const error =
      `No existe la carpeta del servidor:\n${MC_DIR}`;

    appendLog('[ERROR] ' + error);

    return res.status(400).json({
      error: error
    });
  }

  // Comprobar Paper

  if (!fs.existsSync(jarPath)) {

    const error =
      `No se encontró ${MC_JAR} dentro de:\n${MC_DIR}`;

    appendLog('[ERROR] ' + error);

    return res.status(400).json({
      error: error
    });
  }

  logBuffer = [];

  state = 'starting';

  appendLog(
    '--- Iniciando servidor de Minecraft ---'
  );

  appendLog(
    `Carpeta: ${MC_DIR}`
  );

  appendLog(
    `Paper: ${MC_JAR}`
  );

  appendLog(
    `RAM: ${MIN_RAM} - ${MAX_RAM}`
  );

  // ===================================================
  // EJECUTAR JAVA
  // ===================================================

  try {

    mcProcess = spawn(
      'java',
      [
        `-Xms${MIN_RAM}`,
        `-Xmx${MAX_RAM}`,
        '-jar',
        MC_JAR,
        'nogui'
      ],
      {
        cwd: MC_DIR,
        windowsHide: false
      }
    );

  } catch (error) {

    appendLog(
      '[ERROR] ' + error.message
    );

    mcProcess = null;

    state = 'stopped';

    return res.status(500).json({
      error: error.message
    });
  }

  // ===================================================
  // SALIDA DE PAPER
  // ===================================================

  mcProcess.stdout.on(
    'data',
    (data) => {

      const text = data.toString();

      appendLog(text);

      console.log(text);

      // Paper está listo

      if (
        text.includes(
          'For help, type "help"'
        )
      ) {

        state = 'running';

        appendLog(
          '--- SERVIDOR LISTO ---'
        );
      }
    }
  );

  // ===================================================
  // ERRORES JAVA
  // ===================================================

  mcProcess.stderr.on(
    'data',
    (data) => {

      const text =
        data.toString();

      appendLog(
        '[JAVA] ' + text
      );

      console.error(text);
    }
  );

  // ===================================================
  // ERROR DEL PROCESO
  // ===================================================

  mcProcess.on(
    'error',
    (error) => {

      appendLog(
        '[ERROR] No se pudo iniciar Java: ' +
        error.message
      );

      console.error(error);

      mcProcess = null;

      state = 'stopped';
    }
  );

  // ===================================================
  // PROCESO TERMINADO
  // ===================================================

  mcProcess.on(
    'exit',
    (code, signal) => {

      appendLog(
        `--- Servidor detenido ---`
      );

      appendLog(
        `Código: ${code}`
      );

      if (signal) {
        appendLog(
          `Señal: ${signal}`
        );
      }

      console.log(
        `Servidor detenido. Código: ${code}`
      );

      mcProcess = null;

      state = 'stopped';
    }
  );

  res.json({
    ok: true,
    message: 'Servidor iniciándose.'
  });
});

// =====================================================
// APAGAR
// =====================================================

app.post('/api/stop', (req, res) => {

  if (!mcProcess) {

    return res.status(400).json({
      error: 'El servidor no está iniciado.'
    });
  }

  state = 'stopping';

  appendLog(
    '--- Enviando comando STOP ---'
  );

  try {

    mcProcess.stdin.write(
      'stop\n'
    );

  } catch (error) {

    appendLog(
      '[ERROR] ' + error.message
    );

    return res.status(500).json({
      error: error.message
    });
  }

  res.json({
    ok: true,
    message: 'Servidor apagándose.'
  });
});

// =====================================================
// SERVIDOR WEB
// =====================================================

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log('');
    console.log(
      '======================================'
    );

    console.log(
      '       PANEL DE MINECRAFT'
    );

    console.log(
      '======================================'
    );

    console.log('');

    console.log(
      `Panel: http://localhost:${PORT}`
    );

    console.log('');

    console.log(
      `Servidor: ${MC_DIR}`
    );

    console.log(
      `Paper: ${MC_JAR}`
    );

    console.log('');

    console.log(
      '======================================'
    );

  }
);