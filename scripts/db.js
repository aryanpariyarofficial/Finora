// Shared Postgres connection for migration tooling.
// Parses DATABASE_URL manually so passwords containing ':' '&' '@' etc.
// work without URL-encoding.
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const file = path.join(__dirname, "..", ".env.local");
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
  return env;
}

function parseConnectionString(url) {
  const rest = url.replace(/^postgres(ql)?:\/\//, "");
  const at = rest.lastIndexOf("@");
  const credentials = rest.slice(0, at);
  const hostPart = rest.slice(at + 1);

  const colon = credentials.indexOf(":");
  const user = credentials.slice(0, colon);
  const password = credentials.slice(colon + 1);

  const [hostPort, database = "postgres"] = hostPart.split("/");
  const [host, port = "5432"] = hostPort.split(":");

  return {
    user,
    password,
    host,
    port: Number(port),
    database: database.split("?")[0],
    ssl: { rejectUnauthorized: false },
  };
}

function getClient() {
  const { Client } = require("pg");
  const env = loadEnv();
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL missing in .env.local");
  return new Client(parseConnectionString(env.DATABASE_URL));
}

module.exports = { getClient };
