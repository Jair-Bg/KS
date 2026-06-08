import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Auth from "../Auth";

const signUp = vi.fn();
const signInWithPassword = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUp(...args),
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

vi.mock("@/integrations/lovable", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) } },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

function renderAuth(initial = "/auth") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/creator" element={<div>Creator Signup Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("/auth (trader signup flow)", () => {
  beforeEach(() => {
    signUp.mockReset();
    signInWithPassword.mockReset();
    navigateMock.mockReset();
  });

  it("signs up as a trader and assigns account_type 'user'", async () => {
    signUp.mockResolvedValue({ data: { session: { access_token: "x" } }, error: null });
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole("button", { name: /sign up/i }));
    await user.type(screen.getByLabelText(/display name/i), "Alice");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/password/i), "supersecret");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    const [payload] = signUp.mock.calls[0];
    expect(payload.email).toBe("alice@example.com");
    expect(payload.options.data.account_type).toBe("user");
    expect(payload.options.data.display_name).toBe("Alice");
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/markets"));
  });

  it("links to the dedicated creator signup and never sets account_type=creator from this page", async () => {
    const user = userEvent.setup();
    renderAuth();
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    const creatorLink = screen.getByRole("link", { name: /sign up as a creator/i });
    expect(creatorLink).toHaveAttribute("href", "/auth/creator");
  });

  it("redirects to /auth/creator when visited with ?type=creator", async () => {
    renderAuth("/auth?type=creator");
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/auth/creator", { replace: true }),
    );
  });

  it("signs in existing users with email/password", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: null });
    const user = userEvent.setup();
    renderAuth();

    await user.type(screen.getByLabelText(/email/i), "bob@example.com");
    await user.type(screen.getByLabelText(/password/i), "hunter22");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledTimes(1));
    expect(signInWithPassword.mock.calls[0][0]).toEqual({
      email: "bob@example.com",
      password: "hunter22",
    });
  });
});
