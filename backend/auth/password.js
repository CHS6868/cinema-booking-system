
const { scrypt, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");

const scryptAsync = promisify(scrypt);

async function verifyPassword(password, storedHash) {
  if (
    typeof password !== "string" ||
    typeof storedHash !== "string"
  ) {
    return false;
  }

  // Stored format:
  // scrypt$N$r$p$salt$hash
  const parts = storedHash.split("$");

  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, nText, rText, pText, saltHex, hashHex] = parts;

  const N = Number(nText);
  const r = Number(rText);
  const p = Number(pText);

  // Parameters used in Phase 5.2
  if (N !== 131072 || r !== 8 || p !== 1) {
    return false;
  }

  if (
    !/^[0-9a-f]{32}$/i.test(saltHex) ||
    !/^[0-9a-f]{128}$/i.test(hashHex)
  ) {
    return false;
  }

  const expectedHash = Buffer.from(hashHex, "hex");

  const actualHash = await scryptAsync(
    password,
    Buffer.from(saltHex, "hex"),
    64,
    {
      N,
      r,
      p,
      maxmem: 256 * 1024 * 1024
    }
  );

  return timingSafeEqual(expectedHash, actualHash);
}

module.exports = { verifyPassword };