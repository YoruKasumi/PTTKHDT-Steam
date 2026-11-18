import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Header from './Header';

export default function Layout() {
  return (
    <>
      <TopBar />
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}
