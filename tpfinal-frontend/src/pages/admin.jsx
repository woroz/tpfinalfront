import { useEffect, useState } from "react";
import { obtenerUsuarios, obtenerEstadisticasAdmin } from "../services/api";
import "../styles/Admin.css";
import Navbar from "../components/Navbar";

export default function Admin() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seccionActiva, setSeccionActiva] = useState("dashboard");
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [errorEstadisticas, setErrorEstadisticas] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerUsuarios()
      .then((data) => {
        if (activo) {
          setUsuarios(data.usuarios);
        }
      })
      .catch((err) => {
        if (activo) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
  let activo = true;

  obtenerEstadisticasAdmin()
    .then((data) => {
      if (activo) {
        setEstadisticas(data.estadisticas);
      }
    })
    .catch((err) => {
      if (activo) {
        setErrorEstadisticas(err.message);
      }
    })
    .finally(() => {
      if (activo) {
        setCargandoEstadisticas(false);
      }
    });

  return () => {
    activo = false;
  };
}, []);

  const secciones = [
    { id: "dashboard", nombre: "Dashboard" },
    { id: "usuarios", nombre: "Usuarios" },
    { id: "perfiles", nombre: "Profesores y alumnos" },
    { id: "clases", nombre: "Clases" },
    { id: "reportes", nombre: "Reportes y reclamos" },
  ];

  return (
    <main className="app-page admin-page">
      <Navbar />
      <section className="admin-contenido">
        <header className="admin-encabezado">
          <div>
            <h1>Panel de administración</h1>
            <p>Bienvenido al panel de administración de MentorAr.</p>
          </div>
        </header>

        <nav className="admin-navegacion">
          {secciones.map((seccion) => (
            <button
              key={seccion.id}
              className={`admin-nav-boton ${
                seccionActiva === seccion.id ? "activo" : ""
              }`}
              onClick={() => setSeccionActiva(seccion.id)}
            >
              {seccion.nombre}
            </button>
          ))}
        </nav>

        {seccionActiva === "dashboard" && (
          <section className="admin-dashboard">
            <div className="admin-seccion-encabezado">
              <h2>Dashboard</h2>
              <p>Resumen general de la actividad de MentorAr.</p>
            </div>
            {errorEstadisticas && (
                <p className="admin-error">{errorEstadisticas}</p>
                )}
            <div className="admin-estadisticas">
              <div className="admin-estadistica">
                <span className="admin-tarjeta-icono">👥</span>
                <div>
                  <p>Usuarios registrados</p>
                  <h2>{cargandoEstadisticas ? "..." : estadisticas?.totalUsuarios ?? 0}</h2>
                </div>
              </div>

              <div className="admin-estadistica">
                <span className="admin-tarjeta-icono">🎓</span>
                <div>
                  <p>Alumnos</p>
                  <h2>{cargandoEstadisticas ? "..." : estadisticas?.totalAlumnos ?? 0}</h2>
                </div>
              </div>

              <div className="admin-estadistica">
                <span className="admin-tarjeta-icono">👨‍🏫</span>
                <div>
                  <p>Profesores</p>
                  <h2>{cargandoEstadisticas ? "..." : estadisticas?.totalProfesores ?? 0}</h2>
                </div>
              </div>
            </div>
          </section>
        )}

        {seccionActiva === "usuarios" && (
          <section className="admin-seccion-usuarios">
            <div className="admin-seccion-encabezado">
              <div>
                <h2>Usuarios registrados</h2>
                <p>Listado de usuarios de MentorAr.</p>
              </div>
            </div>

            {cargando && <p>Cargando usuarios...</p>}

            {error && <p className="admin-error">{error}</p>}

            {!cargando && !error && usuarios.length === 0 && (
              <p>No hay usuarios registrados.</p>
            )}

            {!cargando && !error && usuarios.length > 0 && (
              <div className="admin-tabla-contenedor">
                <table className="admin-tabla">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo electrónico</th>
                      <th>Rol</th>
                      <th>Fecha de registro</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id_usuario}>
                        <td className="admin-nombre">{usuario.nombre}</td>
                        <td>{usuario.email}</td>
                        <td>
                          <span
                            className={`admin-rol admin-rol-${usuario.rol}`}
                          >
                            {usuario.rol}
                          </span>
                        </td>
                        <td>
                          {new Date(usuario.createdAt).toLocaleDateString(
                            "es-AR"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {["perfiles", "clases", "reportes"].includes(seccionActiva) && (
          <section className="admin-seccion-usuarios admin-proximamente">
            <h2>
              {secciones.find((seccion) => seccion.id === seccionActiva).nombre}
            </h2>
            <p>Esta sección estará disponible próximamente.</p>
          </section>
        )}
      </section>
    </main>
  );
}