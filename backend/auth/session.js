
const { randomBytes, createHash } = require("node:crypto");
const db = require("../database/db");

const COOKIE_NAME = "cinema_sid";
const SESSION_AGE = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

function hashToken(token) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function getToken(req) {
  const cookieHeader = req.headers.cookie || "";

  const item = cookieHeader
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${COOKIE_NAME}=`));

  if (!item) return null;

  const token = item.slice(COOKIE_NAME.length + 1);

  return /^[a-f0-9]{64}$/.test(token)
    ? token
    : null;
}

// Create a new session after successful login
function createSession(res, userId) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const expiresAt = new Date(
    Date.now() + SESSION_AGE
  ).toISOString();

  db.prepare(`
    INSERT INTO auth_sessions
      (token_hash, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(tokenHash, userId, expiresAt);

  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: SESSION_AGE
  });
}

// Find logged-in user
function getSessionUser(req) {
  const token = getToken(req);

  if (!token) return null;

  const tokenHash = hashToken(token);

  return db.prepare(`
    SELECT
      u.id,
      u.email
    FROM auth_sessions AS s
    JOIN users AS u
      ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.expires_at > ?
  `).get(tokenHash, new Date().toISOString()) || null;
}

// Middleware for protected APIs
function requireAuth(req, res, next) {
  try {
    const user = getSessionUser(req);

    if (!user) {
      return res.status(401).json({
        message: "Please log in first"
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Unable to verify session"
    });
  }
}

// Delete session on logout
function destroySession(req, res) {
  const token = getToken(req);

  if (token) {
    db.prepare(`
      DELETE FROM auth_sessions
      WHERE token_hash = ?
    `).run(hashToken(token));
  }

  res.clearCookie(COOKIE_NAME, cookieOptions);
}

module.exports = {
  createSession,
  requireAuth,
  destroySession
};

