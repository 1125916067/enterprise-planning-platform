import { afterEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";

describe("email auth store", () => {
  const originalCwd = process.cwd();
  let tempDir = "";

  afterEach(async () => {
    vi.unstubAllEnvs();
    process.chdir(originalCwd);

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  async function useTempCwd() {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "auth-store-"));
    process.chdir(tempDir);
  }

  it("creates a verification code and signs in a new user", async () => {
    await useTempCwd();
    const { createEmailCode, verifyEmailCode } = await import(
      "../../src/lib/auth/store"
    );

    const codeRecord = await createEmailCode("Founder@Example.com");
    const result = await verifyEmailCode("founder@example.com", codeRecord.code);

    expect(codeRecord.code).toMatch(/^\d{6}$/);
    expect(result.user).toMatchObject({
      email: "founder@example.com",
      role: "user",
      status: "active"
    });
    expect(result.session.token).toEqual(expect.any(String));
  });

  it("marks ADMIN_EMAIL as an admin user", async () => {
    await useTempCwd();
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
    const { createEmailCode, verifyEmailCode } = await import(
      "../../src/lib/auth/store"
    );

    const codeRecord = await createEmailCode("admin@example.com");
    const result = await verifyEmailCode("admin@example.com", codeRecord.code);

    expect(result.user.role).toBe("admin");
  });

  it("rejects an expired or incorrect verification code", async () => {
    await useTempCwd();
    const { createEmailCode, verifyEmailCode } = await import(
      "../../src/lib/auth/store"
    );

    await createEmailCode("user@example.com");

    await expect(
      verifyEmailCode("user@example.com", "000000")
    ).rejects.toThrow("验证码无效或已过期");
  });

  it("expires a verification code after too many failed attempts", async () => {
    await useTempCwd();
    const { createEmailCode, verifyEmailCode } = await import(
      "../../src/lib/auth/store"
    );
    const codeRecord = await createEmailCode("user@example.com");

    for (let index = 0; index < 5; index += 1) {
      await expect(
        verifyEmailCode("user@example.com", "000000")
      ).rejects.toThrow("验证码无效或已过期");
    }

    await expect(
      verifyEmailCode("user@example.com", codeRecord.code)
    ).rejects.toThrow("验证码无效或已过期");
  });
});
