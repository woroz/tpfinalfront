import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authContext";
import Buscar from "./pages/buscar";
import Login from "./pages/login";
import Register from "./pages/register";
import Navbar from "./components/Navbar";
import ReservarClase from "./pages/reservarClase";
import PagoResultado from "./pages/pagoResultado";
import MisClases from "./pages/misClases";
import ClasesProfesor from "./pages/clasesProfesor";
import DisponibilidadProfesor from "./pages/disponibilidadProfesor";
import PerfilProfesor from "./pages/perfilProfesor";
import PagarClase from "./pages/pagarClase";
import MisPagos from "./pages/misPagos";
import CrearClaseProfesor from "./pages/crearClaseProfesor";
import DetalleClase from "./pages/detalleClase";
import MateriasProfesor from "./pages/materiasProfesor";
import MiPerfil from "./pages/miPerfil";
import { ClaseVirtual } from "./pages/ClaseVirtual";
import "./styles/reservas.css";

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

function ProtectedRoute({ children, roles }) {
  const { estaAutenticado, usuario } = useAuth();
  if (!estaAutenticado) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario?.rol)) {
    return <Navigate to={usuario?.rol === "profesor" ? "/profesor" : "/buscar"} replace />;
  }
  return children;
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
          <ProtectedRoute roles={["profesor", "alumno"]}>
            <MiPerfil />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesor"
        element={
          <ProtectedRoute roles={["profesor"]}>
            <ClasesProfesor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesor/disponibilidad"
        element={
          <ProtectedRoute roles={["profesor"]}>
            <DisponibilidadProfesor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesor/materias"
        element={
          <ProtectedRoute roles={["profesor"]}>
            <MateriasProfesor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesor/crear-clase"
        element={
          <ProtectedRoute roles={["profesor"]}>
            <CrearClaseProfesor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesores/:id"
        element={
          <ProtectedRoute>
            <PerfilProfesor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesores/:id/reservar"
        element={
          <ProtectedRoute roles={["alumno"]}>
            <ReservarClase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clases/:id"
        element={
          <ProtectedRoute roles={["alumno"]}>
            <DetalleClase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-clases"
        element={
          <ProtectedRoute roles={["alumno"]}>
            <MisClases />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-clases/:id/pagar"
        element={
          <ProtectedRoute roles={["alumno"]}>
            <PagarClase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-pagos"
        element={
          <ProtectedRoute roles={["alumno"]}>
            <MisPagos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pago/resultado"
        element={
          <ProtectedRoute roles={["alumno"]}>
            <PagoResultado />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clase-virtual/:id_clase"
        element={
          <ProtectedRoute roles={["alumno", "profesor"]}>
            <ClaseVirtual />
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
