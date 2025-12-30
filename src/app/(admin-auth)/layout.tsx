/**
 * Admin Auth Layout
 * 
 * This layout is for admin authentication pages (login).
 * It provides a minimal wrapper without the main admin layout's
 * authentication check, allowing unauthenticated users to access
 * the login page.
 */
export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
