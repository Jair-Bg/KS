import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CreatorRoute } from "../CreatorRoute";

const useAuthMock = vi.fn();
const useUserRoleMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => useAuthMock() }));
vi.mock("@/hooks/useUserRole", () => ({ useUserRole: () => useUserRoleMock() }));

function renderRoute(initial = "/create") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route
          path="/create"
          element={
            <CreatorRoute>
              <div>Creator Only Content</div>
            </CreatorRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CreatorRoute access control", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    useUserRoleMock.mockReset();
  });

  it("redirects unauthenticated users to /auth", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    useUserRoleMock.mockReturnValue({ isCreator: false, isAdmin: false, loading: false, roles: [] });
    renderRoute();
    expect(screen.getByText("Auth Page")).toBeInTheDocument();
    expect(screen.queryByText("Creator Only Content")).not.toBeInTheDocument();
  });

  it("blocks signed-in trader accounts and offers a path to become a creator", () => {
    useAuthMock.mockReturnValue({ user: { id: "u1" }, loading: false });
    useUserRoleMock.mockReturnValue({ isCreator: false, isAdmin: false, loading: false, roles: ["user"] });
    renderRoute();

    expect(screen.getByText(/creator account required/i)).toBeInTheDocument();
    expect(screen.queryByText("Creator Only Content")).not.toBeInTheDocument();
    const becomeLink = screen.getByRole("link", { name: /become a creator/i });
    expect(becomeLink).toHaveAttribute("href", "/auth/creator");
  });

  it("renders protected content for creator role", () => {
    useAuthMock.mockReturnValue({ user: { id: "u1" }, loading: false });
    useUserRoleMock.mockReturnValue({ isCreator: true, isAdmin: false, loading: false, roles: ["creator"] });
    renderRoute();
    expect(screen.getByText("Creator Only Content")).toBeInTheDocument();
  });

  it("renders protected content for admin role (admins are also creators)", () => {
    useAuthMock.mockReturnValue({ user: { id: "u1" }, loading: false });
    useUserRoleMock.mockReturnValue({ isCreator: true, isAdmin: true, loading: false, roles: ["admin"] });
    renderRoute();
    expect(screen.getByText("Creator Only Content")).toBeInTheDocument();
  });

  it("shows a loading state while auth/role resolves", () => {
    useAuthMock.mockReturnValue({ user: null, loading: true });
    useUserRoleMock.mockReturnValue({ isCreator: false, isAdmin: false, loading: true, roles: [] });
    const { container } = renderRoute();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
    expect(screen.queryByText("Creator Only Content")).not.toBeInTheDocument();
  });
});
