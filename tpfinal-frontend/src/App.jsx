import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authContext";
import Buscar from "./pages/buscar";
import Login from "./pages/login";
import Register from "./pages/register";

function ProfesorPlaceholder() {
  return (
    <main className="pending-page">
      <h1>Sesión iniciada</h1>
      <p>El espacio para profesores estará disponible próximamente.</p>
    </main>
  );
}

function ProtectedRoute({ children }) {
  const { estaAutenticado } = useAuth();
  return estaAutenticado ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/buscar"
        element={
          <ProtectedRoute>
            <Buscar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesor"
        element={
          <ProtectedRoute>
            <ProfesorPlaceholder />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
