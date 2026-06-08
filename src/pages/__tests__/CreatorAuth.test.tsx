import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreatorAuth from "../CreatorAuth";

const signUp = vi.fn();
const navigateMock = vi.fn();
const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => signUp(...args),
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

vi.mock("@/integrations/lovable", () => ({
  lovable: { auth: { signInWithOAuth: (...a: unknown[]) => signInWithOAuth(...a) } },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

function renderCreatorAuth() {
  return render(
    <MemoryRouter initialEntries={["/auth/creator"]}>
      <CreatorAuth />
    </MemoryRouter>,
  );
}

describe("/auth/creator (creator signup flow)", () => {
  beforeEach(() => {
    signUp.mockReset();
    navigateMock.mockReset();
    signInWithOAuth.mockClear();
    sessionStorage.clear();
  });

  it("submits signup with account_type 'creator' and redirects to /creator-dashboard", async () => {
    signUp.mockResolvedValue({ data: { session: { access_token: "x" } }, error: null });
    const user = userEvent.setup();
    renderCreatorAuth();

    await user.type(screen.getByLabelText(/creator name/i), "Casey Creator");
    await user.type(screen.getByLabelText(/email/i), "casey@example.com");
    await user.type(screen.getByLabelText(/password/i), "verylongpw");
    await user.click(screen.getByRole("button", { name: /create creator account/i }));

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
    const [payload] = signUp.mock.calls[0];
    expect(payload.email).toBe("casey@example.com");
    expect(payload.options.data.account_type).toBe("creator");
    expect(payload.options.data.display_name).toBe("Casey Creator");
    expect(payload.options.emailRedirectTo).toMatch(/\/creator-dashboard$/);

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/creator-dashboard"));
  });

  it("shows 'check your email' when no session is returned (email confirmation required)", async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    const user = userEvent.setup();
    renderCreatorAuth();

    await user.type(screen.getByLabelText(/creator name/i), "Pending");
    await user.type(screen.getByLabelText(/email/i), "pending@example.com");
    await user.type(screen.getByLabelText(/password/i), "verylongpw");
    await user.click(screen.getByRole("button", { name: /create creator account/i }));

    await waitFor(() => expect(signUp).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalledWith("/creator-dashboard");
  });

  it("persists creator intent in sessionStorage before OAuth signup so role can be assigned post-callback", async () => {
    const user = userEvent.setup();
    renderCreatorAuth();
    await user.click(screen.getByRole("button", { name: /sign up with google/i }));

    await waitFor(() => expect(signInWithOAuth).toHaveBeenCalled());
    expect(sessionStorage.getItem("pending_account_type")).toBe("creator");
  });

  it("links back to the trader signup for users who took the wrong path", () => {
    renderCreatorAuth();
    const traderLink = screen.getByRole("link", { name: /create a trader account/i });
    expect(traderLink).toHaveAttribute("href", "/auth");
  });
});
