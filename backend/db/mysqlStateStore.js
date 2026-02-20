const STATE_KEY = "teacher_portal";
const TABLE_NAME = "haak_app_state";

let poolPromise = null;

function getDbConfig() {
  return {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    sslMode: (process.env.MYSQL_SSL_MODE || "DISABLED").toUpperCase(),
  };
}

export function isMysqlStateStoreConfigured() {
  const cfg = getDbConfig();
  return Boolean(cfg.host && cfg.user && cfg.password && cfg.database);
}

async function getMysqlModule() {
  try {
    const mod = await import("mysql2/promise");
    return mod.default || mod;
  } catch {
    throw new Error("Missing dependency 'mysql2'. Run `npm install` in backend.");
  }
}

function resolveSslConfig(sslMode) {
  if (sslMode === "REQUIRED") {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

async function createPool() {
  const cfg = getDbConfig();
  const mysql = await getMysqlModule();
  const ssl = resolveSslConfig(cfg.sslMode);
  return mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_MAX || 6),
    queueLimit: 0,
    ...(ssl ? { ssl } : {}),
  });
}

async function getPool() {
  if (!poolPromise) {
    poolPromise = createPool();
  }
  return poolPromise;
}

export async function initMysqlStateStore() {
  const pool = await getPool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      state_key VARCHAR(128) PRIMARY KEY,
      state_json JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function readMysqlTeacherState(defaultState) {
  const pool = await getPool();
  const [rows] = await pool.execute(
    `SELECT state_json FROM ${TABLE_NAME} WHERE state_key = ? LIMIT 1`,
    [STATE_KEY]
  );
  const row = rows?.[0];
  if (row?.state_json) {
    const raw = typeof row.state_json === "string" ? row.state_json : JSON.stringify(row.state_json);
    return JSON.parse(raw);
  }

  const payload = JSON.stringify(defaultState);
  await pool.execute(
    `INSERT INTO ${TABLE_NAME} (state_key, state_json) VALUES (?, CAST(? AS JSON))`,
    [STATE_KEY, payload]
  );
  return defaultState;
}

export async function writeMysqlTeacherState(nextState) {
  const pool = await getPool();
  const payload = JSON.stringify(nextState);
  await pool.execute(
    `INSERT INTO ${TABLE_NAME} (state_key, state_json)
     VALUES (?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_at = CURRENT_TIMESTAMP`,
    [STATE_KEY, payload]
  );
}
