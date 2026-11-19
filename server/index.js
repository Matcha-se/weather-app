'use strict';

// A tiny REST API for saved places. It uses only Node's built-in modules,
// so there is nothing extra to install. Data is stored in data/places.json.
//
// Endpoints:
//   GET    /api/health       - simple check that the server is running
//   GET    /api/places       - read all places
//   GET    /api/places/:id   - read one place
//   POST   /api/places       - create a place
//   PUT    /api/places/:id   - update a place
//   DELETE /api/places/:id   - delete a place

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const DATA_FILE = path.join(__dirname, 'data', 'places.json');

let places = [];

// ---------- persistence ----------

async function loadData() {
  try {
    const text = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(text);
    places = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      places = [];
      await saveData();
      return;
    }
    throw error;
  }
}

async function saveData() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(places, null, 2)}\n`, 'utf8');
}

// ---------- helpers ----------

function send(res, status, body) {
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function validatePlace(body, requireCoordinates) {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (requireCoordinates && (body.latitude === undefined || body.longitude === undefined)) {
    return null;
  }

  return { name, note, latitude, longitude };
}

// ---------- routing ----------

async function handleRequest(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);

  // Browsers and the Capacitor WebView send this before cross-origin requests.
  if (req.method === 'OPTIONS') {
    send(res, 204);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    send(res, 200, { status: 'ok', count: places.length });
    return;
  }

  if (pathname === '/api/places' && req.method === 'GET') {
    send(res, 200, places);
    return;
  }

  if (pathname === '/api/places' && req.method === 'POST') {
    const body = await readBody(req);
    const data = validatePlace(body, true);
    if (!data) {
      send(res, 400, { error: 'name, latitude and longitude are required' });
      return;
    }

    const created = { id: randomUUID(), ...data };
    places.push(created);
    await saveData();
    send(res, 201, created);
    return;
  }

  const placeMatch = pathname.match(/^\/api\/places\/([^/]+)$/);
  if (placeMatch) {
    const id = decodeURIComponent(placeMatch[1]);
    const index = places.findIndex((place) => place.id === id);

    if (req.method === 'GET') {
      if (index === -1) {
        send(res, 404, { error: 'Place not found' });
        return;
      }
      send(res, 200, places[index]);
      return;
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (index === -1) {
        send(res, 404, { error: 'Place not found' });
        return;
      }
      const body = await readBody(req);
      const data = validatePlace(body, false);
      if (!data) {
        send(res, 400, { error: 'Invalid place data' });
        return;
      }

      const updated = { ...places[index], ...data };
      places[index] = updated;
      await saveData();
      send(res, 200, updated);
      return;
    }

    if (req.method === 'DELETE') {
      if (index === -1) {
        send(res, 404, { error: 'Place not found' });
        return;
      }
      const [removed] = places.splice(index, 1);
      await saveData();
      send(res, 200, { deleted: true, id: removed.id });
      return;
    }
  }

  send(res, 404, { error: 'Not found' });
}

// ---------- start ----------

async function main() {
  await loadData();

  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        send(res, 500, { error: 'Internal server error' });
      } else {
        res.end();
      }
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`Places REST API running at http://${HOST}:${PORT}/api`);
    console.log(`Data file: ${DATA_FILE}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
