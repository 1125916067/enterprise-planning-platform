import { afterEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";

describe("auth and admin API routes", () => {
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
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "auth-api-"));
    process.chdir(tempDir);
  }

  it("requests and verifies an email login code", async () => {
    await useTempCwd();
    const { POST: requestCode } = await import(
      "../../src/app/api/auth/request-code/route"
    );
    const { POST: verifyCode } = await import(
      "../../src/app/api/auth/verify-code/route"
    );

    const requestResponse = await requestCode(
      new Request("http://localhost/api/auth/request-code", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.com" })
      })
    );
    const requestPayload = await requestResponse.json();

    expect(requestResponse.status).toBe(200);
    const codeLedger = JSON.parse(
      await fs.readFile(path.join(tempDir, ".local-data", "email-codes.json"), "utf8")
    );
    const code = codeLedger.codes[0].code;

    expect(requestPayload.devCode).toBe(code);
    expect(requestPayload.message).toContain(code);

    const verifyResponse = await verifyCode(
      new Request("http://localhost/api/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", code })
      })
    );
    const payload = await verifyResponse.json();

    expect(verifyResponse.status).toBe(200);
    expect(payload.user).toMatchObject({
      email: "user@example.com",
      role: "user"
    });
    expect(verifyResponse.headers.get("set-cookie")).toContain("auth_session=");
    expect(verifyResponse.headers.get("set-cookie")).toContain(
      "planning_user_id="
    );
  });

  it("registers a password account, prevents duplicate registration, and logs in", async () => {
    await useTempCwd();
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
    const { POST: register } = await import(
      "../../src/app/api/auth/register/route"
    );
    const { POST: login } = await import("../../src/app/api/auth/login/route");

    const registerResponse = await register(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@example.com",
          password: "secure123"
        })
      })
    );
    const registerPayload = await registerResponse.json();
    const duplicateResponse = await register(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@example.com",
          password: "secure123"
        })
      })
    );
    const loginResponse = await login(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@example.com",
          password: "secure123"
        })
      })
    );
    const loginPayload = await loginResponse.json();

    expect(registerResponse.status).toBe(200);
    expect(registerPayload.user).toMatchObject({
      email: "admin@example.com",
      role: "admin"
    });
    expect(registerResponse.headers.get("set-cookie")).toContain("auth_session=");
    expect(duplicateResponse.status).toBe(409);
    expect(loginResponse.status).toBe(200);
    expect(loginPayload.user).toMatchObject({
      email: "admin@example.com",
      role: "admin"
    });
    expect(loginResponse.headers.get("set-cookie")).toContain("auth_session=");
  });

  it("allows an admin to list and update users", async () => {
    await useTempCwd();
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
    const { createEmailCode, verifyEmailCode } = await import(
      "../../src/lib/auth/store"
    );
    const { getBillingStatus } = await import("../../src/lib/billing/store");
    const { GET, PATCH } = await import("../../src/app/api/admin/users/route");

    const adminCode = await createEmailCode("admin@example.com");
    const admin = await verifyEmailCode("admin@example.com", adminCode.code);
    const userCode = await createEmailCode("user@example.com");
    const user = await verifyEmailCode("user@example.com", userCode.code);
    await getBillingStatus(user.user.id);

    const listResponse = await GET(
      new Request("http://localhost/api/admin/users", {
        headers: { Cookie: `auth_session=${admin.session.token}` }
      })
    );
    const listPayload = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listPayload.users.map((item: { email: string }) => item.email)).toEqual(
      expect.arrayContaining(["admin@example.com", "user@example.com"])
    );

    const patchResponse = await PATCH(
      new Request("http://localhost/api/admin/users", {
        method: "PATCH",
        headers: { Cookie: `auth_session=${admin.session.token}` },
        body: JSON.stringify({
          userId: user.user.id,
          status: "disabled",
          balanceTokens: 1234
        })
      })
    );
    const patchPayload = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patchPayload.user.status).toBe("disabled");
    expect(patchPayload.user.balanceTokens).toBe(1234);
  });

  it("prevents disabling or demoting the last admin", async () => {
    await useTempCwd();
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
    const { createEmailCode, verifyEmailCode } = await import(
      "../../src/lib/auth/store"
    );
    const { PATCH } = await import("../../src/app/api/admin/users/route");

    const adminCode = await createEmailCode("admin@example.com");
    const admin = await verifyEmailCode("admin@example.com", adminCode.code);

    const disableResponse = await PATCH(
      new Request("http://localhost/api/admin/users", {
        method: "PATCH",
        headers: { Cookie: `auth_session=${admin.session.token}` },
        body: JSON.stringify({
          userId: admin.user.id,
          status: "disabled"
        })
      })
    );
    const demoteResponse = await PATCH(
      new Request("http://localhost/api/admin/users", {
        method: "PATCH",
        headers: { Cookie: `auth_session=${admin.session.token}` },
        body: JSON.stringify({
          userId: admin.user.id,
          role: "user"
        })
      })
    );

    expect(disableResponse.status).toBe(400);
    expect(demoteResponse.status).toBe(400);
  });

  it("rejects admin user listing for non-admin sessions", async () => {
    await useTempCwd();
    const { createEmailCode, verifyEmailCode } = await import(
      "../../src/lib/auth/store"
    );
    const { GET } = await import("../../src/app/api/admin/users/route");
    const code = await createEmailCode("user@example.com");
    const user = await verifyEmailCode("user@example.com", code.code);

    const response = await GET(
      new Request("http://localhost/api/admin/users", {
        headers: { Cookie: `auth_session=${user.session.token}` }
      })
    );

    expect(response.status).toBe(403);
  });

  it("requires login for billing status", async () => {
    await useTempCwd();
    const { GET } = await import("../../src/app/api/billing/status/route");

    const response = await GET(
      new Request("http://localhost/api/billing/status")
    );

    expect(response.status).toBe(401);
  });
});
