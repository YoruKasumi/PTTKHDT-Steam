import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { routes } from './routes';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import RouteGuard from './components/RouteGuard';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<Layout />}>
        {routes.map((r) => (
          <Route
            key={r.path}
            path={r.path}
            element={r.allowedRoles
              ? <RouteGuard allowedRoles={r.allowedRoles} allowedPermissions={r.allowedPermissions}>{r.element}</RouteGuard>
              : r.element}
          />
        ))}
      </Route>
    </Routes>
  );
}
