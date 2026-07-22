import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("LoginPanel", () => {
  it("registers a password account and passes the authenticated user up", async () => {
    const onAuthenticated = vi.fn();
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/auth/register") {
        return Promise.resolve(
          jsonResponse({
            user: {
              id: "admin-1",
              email: "admin@example.com",
              role: "admin",
              status: "active"
            }
          })
        );
      }

      return Promise.resolve(jsonResponse({ error: `Unhandled ${url}` }, false));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { LoginPanel } = await import("../../src/components/auth/LoginPanel");

    render(<LoginPanel onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "admin@example.com" }
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "secure123" }
    });
    fireEvent.click(screen.getByRole("button", { name: "创建账户" }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "admin@example.com",
          password: "secure123"
        })
      })
    );
  });

  it("shows the duplicate registration message without authenticating", async () => {
    const onAuthenticated = vi.fn();

    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url === "/api/auth/register") {
          return Promise.resolve(
            jsonResponse({ error: "该邮箱已注册，请直接登录。" }, false)
          );
        }

        return Promise.resolve(jsonResponse({ error: `Unhandled ${url}` }, false));
      })
    );
    const { LoginPanel } = await import("../../src/components/auth/LoginPanel");

    render(<LoginPanel onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText("邮箱"), {
      target: { value: "user@example.com" }
    });
    fireEvent.change(screen.getByLabelText("密码"), {
      target: { value: "secure123" }
    });
    fireEvent.click(screen.getByRole("button", { name: "创建账户" }));

    expect(await screen.findByText("该邮箱已注册，请直接登录。")).toBeTruthy();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
