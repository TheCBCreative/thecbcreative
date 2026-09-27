import { Outlet } from 'react-router';

export default function SiteLayout() {
  return (
    <main id="main-content">
      <Outlet />
    </main>
  );
}
