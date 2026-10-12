import { randomBytes } from "node:crypto";
import { argon2Verify, argon2id } from "hash-wasm";

const memorySize = 19456;
const iterations = 2;
const parallelism = 1;
const hashLength = 32;

export async function hashPassword(password: string) {
  return argon2id({
    password,
    salt: randomBytes(16),
    iterations,
    parallelism,
    memorySize,
    hashLength,
    outputType: "encoded",
  });
}

export async function verifyPassword(password: string, hash: string) {
  return argon2Verify({ password, hash });
}
