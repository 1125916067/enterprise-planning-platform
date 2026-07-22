import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

type MockResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

function jsonResponse(payload: unknown, ok = true): MockResponse {
  return {
    ok,
    json: async () => payload
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AdminGate", () => {
  it("shows the account login panel before loading admin data when the user is signed out", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/auth/me") {
        return Promise.resolve(jsonResponse({ user: null }));
      }

      return Promise.resolve(jsonResponse({ error: `Unhandled ${url}` }, false));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { AdminGate } = await import("../../src/components/admin/AdminGate");

    render(<AdminGate />);

    expect(await screen.findByText("账号登录")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/admin/users");
  });

  it("shows a permission message when the signed-in user is not an admin", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "/api/auth/me") {
          return Promise.resolve(
            jsonResponse({
              user: {
                id: "user-1",
                email: "user@example.com",
                role: "user",
                status: "active"
              }
            })
          );
        }

        return Promise.resolve(jsonResponse({ error: `Unhandled ${url}` }, false));
      })
    );
    const { AdminGate } = await import("../../src/components/admin/AdminGate");

    render(<AdminGate />);

    expect(await screen.findByText("需要管理员权限")).toBeTruthy();
    expect(screen.getByText(/user@example.com/)).toBeTruthy();
  });
});
