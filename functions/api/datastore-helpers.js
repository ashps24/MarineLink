'use strict';

/**
 * Data Store helpers, copied into every function that touches it rather than
 * shared from a lib/ — Catalyst functions deploy independently, so a shared
 * import would need its own package or a monorepo build step neither of which
 * is worth it for two small helpers.
 */

/**
 * Reads every row in a table, paginating with getPagedRows (never the
 * deprecated getAllRows, and never a single unbounded call — Data Store
 * pages internally regardless, so this just makes the loop explicit).
 * @param {import('zcatalyst-sdk-node').Table} table
 * @returns {Promise<Record<string, unknown>[]>}
 */
async function getAllRows(table) {
  const rows = [];
  let nextToken;
  do {
    const page = await table.getPagedRows({ nextToken, maxRows: 200 });
    rows.push(...(page.data || []));
    nextToken = page.more_records ? page.next_token : undefined;
  } while (nextToken);
  return rows;
}

/**
 * Client-side filter over a fully-paginated table read. Data Store rows are
 * small in this app (a few hundred at most across all four tables), so a
 * full scan + JS filter is simpler and just as fast as building a ZCQL WHERE
 * clause per query shape, and it sidesteps ZCQL's quoting and 300-row cap
 * entirely.
 * @param {import('zcatalyst-sdk-node').Table} table
 * @param {(row: Record<string, unknown>) => boolean} predicate
 */
async function getRowsWhere(table, predicate) {
  const rows = await getAllRows(table);
  return predicate ? rows.filter(predicate) : rows;
}

/**
 * Data Store boolean columns round-trip as the strings "true"/"false", not
 * JS booleans — "false" is truthy in JS, so this conversion is not optional.
 */
function convertBooleanFields(row, booleanColumns) {
  const result = { ...row };
  for (const col of booleanColumns) {
    if (col in result) {
      result[col] = result[col] === 'true' || result[col] === true;
    }
  }
  return result;
}

/** `datetime` columns want 'YYYY-MM-DD HH:mm:ss' — never a raw ISO string. */
function toDatastoreDatetime(isoOrDate) {
  if (!isoOrDate) return null;
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = { getAllRows, getRowsWhere, convertBooleanFields, toDatastoreDatetime };
