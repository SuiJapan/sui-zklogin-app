// Simple Bun server that verifies a JWT and returns HKDF output
import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose";

type JwtPayload = {
  iss: string;
  sub: string;
  aud: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  [key: string]: unknown;
};

const textEncoder = new TextEncoder();

function base64urlDecode(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  const padded = normalized + "=".repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// base64urlEncode is no longer needed for jose path; keep only decode helper

function parseJwtUnverifiedForIss(token: string): JwtPayload {
  // jose ? decode ???????iss ?????????????
  const payload = decodeJwt(token) as JwtPayload;
  if (!payload.iss) throw new Error("JWT iss missing");
  return payload;
}

async function fetchJwksUri(issuer: string): Promise<string> {
  // Normalize issuer (ensure no trailing slash duplication)
  const iss = issuer.replace(/\/$/, "");
  const configUrls = [
    `${iss}/.well-known/openid-configuration`,
    `${iss}/.well-known/oauth-authorization-server`,
  ];
  for (const url of configUrls) {
    const res = await fetch(url);
    if (res.ok) {
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "jwks_uri" in data &&
        typeof (data as { jwks_uri?: unknown }).jwks_uri === "string"
      ) {
        return (data as { jwks_uri: string }).jwks_uri;
      }
    }
  }
  throw new Error("Unable to discover jwks_uri from issuer");
}

async function verifyJwt(token: string): Promise<JwtPayload> {
  const unverified = parseJwtUnverifiedForIss(token);
  const jwksUri = await fetchJwksUri(unverified.iss);
  const key = createRemoteJWKSet(new URL(jwksUri));

  const options: Parameters<typeof jwtVerify>[2] = {
    clockTolerance: 300, // 5 min skew
  };
  if (Bun.env.EXPECTED_ISS) options.issuer = Bun.env.EXPECTED_ISS.split(",").map((s) => s.trim()).filter(Boolean);
  if (Bun.env.EXPECTED_AUD) options.audience = Bun.env.EXPECTED_AUD.split(",").map((s) => s.trim()).filter(Boolean);

  const { payload } = await jwtVerify(token, key, options);
  return payload as JwtPayload;
}

function concatUtf8(a: string, b: string | string[]): Uint8Array {
  const bStr = Array.isArray(b) ? b.join(",") : b; // normalize array aud
  const aBytes = textEncoder.encode(a);
  const bBytes = textEncoder.encode(bStr);
  const out = new Uint8Array(aBytes.length + bBytes.length);
  out.set(aBytes, 0);
  out.set(bBytes, aBytes.length);
  return out;
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveHkdfSalt(seedBytes: Uint8Array, saltBytes: Uint8Array, infoBytes: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", seedBytes, "HKDF", false, ["deriveBits"]);
  // Use 128 bits (16 bytes) because prover expects 16-byte salt
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: saltBytes,
      info: infoBytes,
    },
    key,
    128,
  );
  // Interpret as big-endian 16-byte unsigned integer and return decimal string (no bit forcing)
  const sixteen = bits instanceof Uint8Array ? bits : new Uint8Array(bits);
  const hex = toHex(sixteen);
  const decimal = BigInt("0x" + hex).toString();
  return decimal;
}

function getSeedFromEnv(): Uint8Array {
  const seed = Bun.env.SEED;
  if (!seed) throw new Error("SEED env is required (hex or base64url)");
  // Try hex
  const hexMatch = /^[0-9a-fA-F]+$/;
  if (hexMatch.test(seed) && seed.length % 2 === 0) {
    const bytes = new Uint8Array(seed.length / 2);
    for (let i = 0; i < seed.length; i += 2) bytes[i / 2] = parseInt(seed.slice(i, i + 2), 16);
    return bytes;
  }
  // Fallback to base64url/base64
  try {
    return base64urlDecode(seed);
  } catch {
    throw new Error("SEED must be hex or base64url/base64 encoded");
  }
}

async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return new Response("Not Found", { status: 404 });
    const url = new URL(req.url);
    if (url.pathname !== "/hkdf") return new Response("Not Found", { status: 404 });

    if (!req.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Content-Type must be application/json" }, { status: 400 });
    }

    const body = (await req.json()) as { token?: string };
    const token = body?.token;
    if (!token) return Response.json({ error: "token is required" }, { status: 400 });

    const payload = await verifyJwt(token);

    const seedBytes = getSeedFromEnv();
    const saltBytes = concatUtf8(payload.iss, payload.aud);
    const infoBytes = textEncoder.encode(payload.sub);
    const saltHex = await deriveHkdfSalt(seedBytes, saltBytes, infoBytes);

    return Response.json({ salt: saltHex });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("Not Found") ? 404 : message.includes("Invalid JWT") || message.includes("expired") ? 401 : 400;
    return Response.json({ error: message }, { status });
  }
}

Bun.serve({
  port: Bun.env.PORT ? Number(Bun.env.PORT) : 3001,
  fetch: handler,
});

console.log(`HKDF server listening on :${Bun.env.PORT ?? 3001}`);
