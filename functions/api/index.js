'use strict';

const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const {
  getAllRows,
  getRowsWhere,
  convertBooleanFields,
  toDatastoreDatetime,
  fromDatastoreDatetime,
} = require('./datastore-helpers');
const { RESOURCES } = require('./resources');

const app = express();
app.use(express.json({ limit: '10mb' }));

/**
 * Advanced I/O invocation URLs are https://.../server/api/execute/<path>.
 * Confirmed by deploying and curling before wiring any real route: Catalyst
 * forwards the "/execute/..." segment literally as this Express app's own
 * req.url rather than stripping it — so every route is mounted under
 * "/execute", not "/". (Verified live rather than assumed: an earlier version
 * of this file mounted the same router at both "/" and "/execute", and the
 * "/" mount silently won on every request, swallowing "execute" itself as
 * the :resource param.)
 */
const router = express.Router();

/**
 * CORS for the deployed Slate origin is handled by the platform: the origin
 * is registered as an Authorized Domain with the CORS toggle on (Console ->
 * Authentication -> Whitelisting, or CatalystbyZoho_Create_CORS_Domain via
 * MCP), which is also what makes the gateway answer OPTIONS preflights at
 * all — confirmed live: an OPTIONS request against this function's URL
 * before that domain was registered came back 400 INVALID_REQUEST_METHOD
 * from the gateway itself, never reaching this code. Setting
 * Access-Control-Allow-Origin here too would duplicate the header the
 * gateway already injects for that origin, which browsers reject outright.
 *
 * localhost has no Authorized Domain entry (and generally shouldn't), so it
 * is handled here instead, for local development only.
 */
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

/** DB row (PascalCase columns, system fields) -> API shape (camelCase, id/createdAt/updatedAt). */
function rowToApi(resourceKey, row) {
  const config = RESOURCES[resourceKey];
  const out = {
    id: String(row.ROWID),
    createdAt: fromDatastoreDatetime(row.CREATEDTIME),
    updatedAt: fromDatastoreDatetime(row.MODIFIEDTIME),
  };
  for (const [apiField, column] of Object.entries(config.fields)) {
    const value = row[column];
    const empty = value === undefined || value === '' || value === null;
    out[apiField] = empty
      ? null
      : config.datetimeFields.includes(apiField)
        ? fromDatastoreDatetime(value)
        : value;
  }
  return convertBooleanFields(out, config.booleanFields);
}

/** API payload (camelCase) -> DB row shape (PascalCase columns) for insert/update. */
function apiToRow(resourceKey, payload) {
  const config = RESOURCES[resourceKey];
  const row = {};
  for (const [apiField, column] of Object.entries(config.fields)) {
    if (!(apiField in payload)) continue;
    let value = payload[apiField];
    if (config.booleanFields.includes(apiField)) {
      row[column] = value === true || value === 'true' ? 'true' : 'false';
      continue;
    }
    if (config.datetimeFields.includes(apiField)) {
      // A datetime column rejects '' outright ("datetime value expected"),
      // so clearing one — reopening a resolved request, say — has to send
      // null rather than the empty string every other column type takes.
      row[column] = value ? toDatastoreDatetime(value) : null;
      continue;
    }
    row[column] = value === null ? '' : value;
  }
  return row;
}

function resourceMiddleware(req, res, next) {
  const config = RESOURCES[req.params.resource];
  if (!config) {
    return res.status(404).json({ error: `Unknown resource "${req.params.resource}"` });
  }
  req.resourceKey = req.params.resource;
  req.resourceConfig = config;
  const catalystApp = catalyst.initialize(req, { scope: 'admin' });
  req.table = catalystApp.datastore().table(config.table);
  next();
}

/**
 * Who the caller is, according to Catalyst rather than according to the
 * browser. The Slate origin cannot answer this for itself: the Web SDK builds
 * its session URLs against the page's own domain and Slate proxies
 * "/__catalyst/..." but not "/baas/...", so the SDK's own check always fails
 * there. This function runs on the Catalyst domain, where the session is real.
 */
router.get('/me', async (req, res) => {
  try {
    const userApp = catalyst.initialize(req);
    const user = await userApp.userManagement().getCurrentUser();
    if (!user || !user.user_id) return res.status(200).json({ data: null });
    res.status(200).json({
      data: {
        userId: String(user.user_id),
        email: user.email_id,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (err) {
    console.error(JSON.stringify({ action: 'me', error: err.message }));
    res.status(200).json({ data: null });
  }
});

// GET /:resource — list, with optional exact-match filtering by any mapped
// API field as a query param (e.g. ?dealerId=123&status=active).
router.get('/:resource', resourceMiddleware, async (req, res) => {
  try {
    const filters = Object.entries(req.query).filter(([key]) => key in req.resourceConfig.fields);
    const rows =
      filters.length === 0
        ? await getAllRows(req.table)
        : await getRowsWhere(req.table, (row) =>
            filters.every(([apiField, value]) => String(row[req.resourceConfig.fields[apiField]]) === String(value)),
          );
    res.status(200).json({ data: rows.map((row) => rowToApi(req.resourceKey, row)) });
  } catch (err) {
    console.error(JSON.stringify({ action: 'list', resource: req.params.resource, error: err.message }));
    res.status(500).json({ error: 'Could not read records', detail: err.message });
  }
});

// GET /:resource/:id
router.get('/:resource/:id', resourceMiddleware, async (req, res) => {
  try {
    const row = await req.table.getRow(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.status(200).json({ data: rowToApi(req.resourceKey, row) });
  } catch (err) {
    console.error(JSON.stringify({ action: 'get', resource: req.params.resource, id: req.params.id, error: err.message }));
    res.status(404).json({ error: 'Not found' });
  }
});

// POST /:resource
router.post('/:resource', resourceMiddleware, async (req, res) => {
  try {
    const row = apiToRow(req.resourceKey, req.body || {});
    const created = await req.table.insertRow(row);
    res.status(201).json({ data: rowToApi(req.resourceKey, created) });
  } catch (err) {
    console.error(JSON.stringify({ action: 'create', resource: req.params.resource, error: err.message }));
    res.status(400).json({ error: 'Could not create record', detail: err.message });
  }
});

// PUT /:resource/:id
router.put('/:resource/:id', resourceMiddleware, async (req, res) => {
  try {
    const row = apiToRow(req.resourceKey, req.body || {});
    const updated = await req.table.updateRow({ ROWID: req.params.id, ...row });
    res.status(200).json({ data: rowToApi(req.resourceKey, updated) });
  } catch (err) {
    console.error(JSON.stringify({ action: 'update', resource: req.params.resource, id: req.params.id, error: err.message }));
    res.status(400).json({ error: 'Could not update record', detail: err.message });
  }
});

// DELETE /:resource/:id
router.delete('/:resource/:id', resourceMiddleware, async (req, res) => {
  try {
    await req.table.deleteRow(req.params.id);
    res.status(200).json({ data: { id: req.params.id, deleted: true } });
  } catch (err) {
    console.error(JSON.stringify({ action: 'delete', resource: req.params.resource, id: req.params.id, error: err.message }));
    res.status(400).json({ error: 'Could not delete record', detail: err.message });
  }
});

router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', resources: Object.keys(RESOURCES) });
});

app.use('/execute', router);

module.exports = app;
