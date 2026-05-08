// In demo mode, always allow access — auth is mocked locally.
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
