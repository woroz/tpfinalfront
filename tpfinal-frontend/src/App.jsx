import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authContext";
import { TemaProvider } from "./context/temaContext";
import Inicio from "./pages/inicio";

import Login from "./pages/login";

import Navbar from "./components/Navbar";

import "./styles/reservas.css";
import "./styles/layout.css";
import "./styles/perfil.css"
import "./styles/menu.css";
import "./styles/tema.css";


const ReservarClase = lazy(() => import("./pages/reservarClase"));
const PagoResultado = lazy(() => import("./pages/pagoResultado"));
const MisClases = lazy(() => import("./pages/misClases"));
const Tareas = lazy(() => import("./pages/tareas"));
const MisReclamos = lazy(() => import("./pages/misReclamos"));
const ClasesProfesor = lazy(() => import("./pages/clasesProfesor"));
const DisponibilidadProfesor = lazy(() => import("./pages/disponibilidadProfesor"));
const PerfilProfesor = lazy(() => import("./pages/perfilProfesor"));
const PagarClase = lazy(() => import("./pages/pagarClase"));
const MisPagos = lazy(() => import("./pages/misPagos"));
const CrearClaseProfesor = lazy(() => import("./pages/crearClaseProfesor"));
const DetalleClase = lazy(() => import("./pages/detalleClase"));
const MateriasProfesor = lazy(() => import("./pages/materiasProfesor"));
const MiPerfil = lazy(() => import("./pages/miPerfil"));
const Admin = lazy(() => import("./pages/admin"));
const Tablon = lazy(() => import("./pages/tablon"));
const Biblioteca = lazy(() => import("./pages/biblioteca"));
const Register = lazy(() => import("./pages/register"));
const ClaseVirtual = lazy(() => import("./pages/ClaseVirtual").then(modulo => ({ default: modulo.ClaseVirtual })));
const Buscar = lazy(() => import("./pages/buscar"));

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
            <Inicio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tablon"
        element={
          <ProtectedRoute roles={["alumno", "profesor"]}>
            <Tablon />
          </ProtectedRoute>
        }
      />
      <Route
        path="/biblioteca"
        element={
          <ProtectedRoute roles={["alumno", "profesor"]}>
            <Biblioteca />
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
        path="/tareas"
        element={
          <ProtectedRoute roles={["alumno"]}>
            <Tareas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-reclamos"
        element={
          <ProtectedRoute roles={["alumno"]}>
            <MisReclamos />
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
      <Route
      path="/admin"
      element={
      <ProtectedRoute roles={["admin"]}>
        <Admin />
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
      <TemaProvider>
        <AuthProvider>
          <Suspense fallback={<p className="res-mensaje" role="status">Cargando…</p>}><AppRoutes /></Suspense>
        </AuthProvider>
      </TemaProvider>
    </BrowserRouter>
  );
}
