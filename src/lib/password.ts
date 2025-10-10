/**
 * Password hashing utility using Web Crypto API (PBKDF2).
 * Compatible with Node.js, browser, and Cloudflare Workers.
 *
 * PBKDF2 is a standard password hashing algorithm used by 1Password,
 * LastPass, and many enterprise applications. It's part of Web Crypto API
 * and works natively in all JavaScript runtimes.
 */

const ITERATIONS = 100000; // OWASP recommends 100,000+ for PBKDF2-SHA256
const HASH_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits

/**
 * Hash a password using PBKDF2.
 *
 * @param password - Plain text password
 * @returns Hashed password in format: `iterations:salt:hash` (hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Convert password to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import key for PBKDF2
  const key = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, [
    "deriveBits",
  ]);

  // Derive hash using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    key,
    HASH_LENGTH * 8 // bits
  );

  // Convert to hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const saltArray = Array.from(salt);
  const saltHex = saltArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Return format: iterations:salt:hash
  return `${ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash.
 *
 * @param password - Plain text password to verify
 * @param storedHash - Stored hash in format `iterations:salt:hash`
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Parse stored hash
    const [iterationsStr, saltHex, hashHex] = storedHash.split(":");
    const iterations = parseInt(iterationsStr, 10);

    // Convert hex to buffers
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));

    // Convert password to buffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import key
    const key = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, [
      "deriveBits",
    ]);

    // Derive hash with same parameters
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256",
      },
      key,
      HASH_LENGTH * 8
    );

    // Convert to hex
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Constant-time comparison (timing attack resistant)
    return timingSafeEqual(computedHashHex, hashHex);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
