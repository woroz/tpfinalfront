import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authContext";
import Buscar from "./pages/buscar";
import Login from "./pages/login";
import Register from "./pages/register";
import Navbar from "./components/Navbar";

function ProfesorPlaceholder() {
  return (
    <main className="app-page">
      <Navbar />
      <h1>Sesion iniciada</h1>
      <p>El espacio para profesores estara disponible proximamente.</p>
    </main>
  );
}

function PagePlaceholder({ title, description }) {
  return (
    <main className="app-page">
      <Navbar />
      <section className="placeholder-content">
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
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
        path="/inicio"
        element={
          <ProtectedRoute>
            <PagePlaceholder title="Inicio" description="Bienvenido a MentorAr." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tablon"
        element={
          <ProtectedRoute>
            <PagePlaceholder title="Tablon de anuncios" description="Aca vas a poder publicar y consultar anuncios." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/biblioteca"
        element={
          <ProtectedRoute>
            <PagePlaceholder title="Biblioteca" description="Aca vas a encontrar recursos para aprender." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportar"
        element={
          <ProtectedRoute>
            <PagePlaceholder title="Reportar" description="Aca vas a poder informar un problema o enviar una sugerencia." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <PagePlaceholder title="Mi perfil" description="Aca vas a poder consultar y editar tu perfil." />
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
