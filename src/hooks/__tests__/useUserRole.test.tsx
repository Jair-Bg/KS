import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserRole } from "../useUserRole";

const useAuthMock = vi.fn();
const eqMock = vi.fn();
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => useAuthMock() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));

describe("useUserRole — role assignment after login", () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    fromMock.mockClear();
    selectMock.mockClear();
    eqMock.mockReset();
  });

  it("returns isCreator=true when the user has the creator role", async () => {
    useAuthMock.mockReturnValue({ user: { id: "user-1" }, loading: false });
    eqMock.mockReturnValue(Promise.resolve({ data: [{ role: "creator" }], error: null }));

    const { result } = renderHook(() => useUserRole());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fromMock).toHaveBeenCalledWith("user_roles");
    expect(eqMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(result.current.roles).toEqual(["creator"]);
    expect(result.current.isCreator).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it("admins are implicitly creators too", async () => {
    useAuthMock.mockReturnValue({ user: { id: "user-admin" }, loading: false });
    eqMock.mockReturnValue(Promise.resolve({ data: [{ role: "admin" }], error: null }));

    const { result } = renderHook(() => useUserRole());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isCreator).toBe(true);
  });

  it("trader-only accounts cannot pass creator checks", async () => {
    useAuthMock.mockReturnValue({ user: { id: "user-2" }, loading: false });
    eqMock.mockReturnValue(Promise.resolve({ data: [{ role: "user" }], error: null }));

    const { result } = renderHook(() => useUserRole());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.roles).toEqual(["user"]);
    expect(result.current.isCreator).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it("returns no roles when there is no signed-in user", async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });

    const { result } = renderHook(() => useUserRole());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fromMock).not.toHaveBeenCalled();
    expect(result.current.roles).toEqual([]);
    expect(result.current.isCreator).toBe(false);
  });
});
