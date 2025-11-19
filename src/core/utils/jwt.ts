import { createHmac, timingSafeEqual } from "crypto";

export class JwtVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JwtVerificationError";
  }
}

type JwtHeader = {
  alg: string;
  typ: string;
};

const encoder = new TextEncoder();

const BASE64URL_REGEXP = /^[A-Za-z0-9\-_]+=*$/;

function base64UrlDecode(segment: string): Buffer {
  if (!BASE64URL_REGEXP.test(segment)) {
    throw new JwtVerificationError("Token em formato inválido");
  }

  const rem = segment.length % 4;
  const padded = segment + (rem ? "=".repeat(4 - rem) : "");
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}

function parseJson<T>(buffer: Buffer): T {
  try {
    return JSON.parse(buffer.toString("utf8")) as T;
  } catch {
    throw new JwtVerificationError("Falha ao decodificar conteúdo do token");
  }
}

export type JwtPayload = {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

function verifyAlgorithm(header: JwtHeader) {
  if (header.alg !== "HS256") {
    throw new JwtVerificationError(`Algoritmo ${header.alg} não suportado`);
  }
}

function verifySignature(
  headerSegment: string,
  payloadSegment: string,
  signatureSegment: string,
  secret: string,
) {
  const data = `${headerSegment}.${payloadSegment}`;
  const expected = createHmac("sha256", encoder.encode(secret))
    .update(data)
    .digest();

  const provided = base64UrlDecode(signatureSegment);

  if (expected.length !== provided.length) {
    throw new JwtVerificationError("Assinatura do token inválida");
  }

  if (!timingSafeEqual(expected, provided)) {
    throw new JwtVerificationError("Assinatura do token inválida");
  }
}

function verifyExpiration(payload: JwtPayload) {
  if (typeof payload.exp !== "number") {
    return;
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload.exp <= now) {
    throw new JwtVerificationError("Token expirado");
  }
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function signJwt(payload: JwtPayload, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const headerEncoded = base64UrlEncode(
    Buffer.from(JSON.stringify(header)),
  );
  const payloadEncoded = base64UrlEncode(
    Buffer.from(JSON.stringify(payload)),
  );

  const data = `${headerEncoded}.${payloadEncoded}`;
  const signature = createHmac("sha256", encoder.encode(secret))
    .update(data)
    .digest();
  const signatureEncoded = base64UrlEncode(signature);

  return `${data}.${signatureEncoded}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const segments = token.split(".");

  if (segments.length !== 3) {
    throw new JwtVerificationError("Token em formato inválido");
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;

  const header = parseJson<JwtHeader>(base64UrlDecode(headerSegment));
  verifyAlgorithm(header);

  const payload = parseJson<JwtPayload>(base64UrlDecode(payloadSegment));

  verifySignature(headerSegment, payloadSegment, signatureSegment, secret);
  verifyExpiration(payload);

  return payload;
}

