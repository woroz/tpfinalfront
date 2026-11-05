import { useEffect, useState } from "react";
import {
  actualizarEstadoReclamo,
  obtenerEstadisticasAdmin,
  obtenerReclamosAdmin,
  obtenerUsuarios,
} from "../services/api";
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
  const [reclamos, setReclamos] = useState([]);
  const [cargandoReclamos, setCargandoReclamos] = useState(false);
  const [errorReclamos, setErrorReclamos] = useState("");
  const [actualizandoReclamo, setActualizandoReclamo] = useState("");

  useEffect(() => {
    if (seccionActiva !== "reportes") return undefined;
    let activo = true;
    setCargandoReclamos(true);
    obtenerReclamosAdmin()
      .then((data) => {
        if (activo) {
          setReclamos(data.reclamos || []);
          setErrorReclamos("");
        }
      })
      .catch((err) => {
        if (activo) setErrorReclamos(err.message || "No se pudieron cargar los reclamos.");
      })
      .finally(() => {
        if (activo) setCargandoReclamos(false);
      });
    return () => {
      activo = false;
    };
  }, [seccionActiva]);

  async function cambiarEstadoReclamo(idReclamo, estado) {
    setActualizandoReclamo(idReclamo);
    try {
      const data = await actualizarEstadoReclamo(idReclamo, estado);
      setReclamos((actuales) => actuales.map((reclamo) => (
        reclamo.id_reclamo === idReclamo ? { ...reclamo, ...data.reclamo } : reclamo
      )));
    } catch (err) {
      setErrorReclamos(err.message || "No se pudo actualizar el reclamo.");
    } finally {
      setActualizandoReclamo("");
    }
  }

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

        {seccionActiva === "reportes" && (
          <section className="admin-seccion-usuarios admin-reclamos">
            <div className="admin-seccion-encabezado">
              <h2>Reportes y reclamos</h2>
              <p>Revisá los reclamos de clases y actualizá su estado.</p>
            </div>
            {cargandoReclamos && <p>Cargando reclamos...</p>}
            {errorReclamos && <p className="admin-error">{errorReclamos}</p>}
            {!cargandoReclamos && !errorReclamos && !reclamos.length && (
              <p>No hay reclamos registrados.</p>
            )}
            {!!reclamos.length && (
              <div className="admin-tabla-contenedor">
                <table className="admin-tabla">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Clase</th>
                      <th>IDs</th>
                      <th>Alumno</th>
                      <th>Motivo</th>
                      <th>Fecha</th>
                      <th>Asistencia profesor</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reclamos.map((reclamo) => (
                      <tr key={reclamo.id_reclamo}>
                        <td>Reclamo</td>
                        <td>
                          <strong>{reclamo.clase.titulo}</strong>
                          <small className="admin-reclamo-profesor">
                            Profesor: {reclamo.clase.profesor.usuario.nombre}
                          </small>
                        </td>
                        <td className="admin-reclamo-ids">
                          <small>Reclamo: {reclamo.id_reclamo}</small>
                          <small>Clase: {reclamo.id_clase}</small>
                          <small>Profesor: {reclamo.clase.id_profesor}</small>
                        </td>
                        <td>
                          {reclamo.alumno.usuario.nombre}
                          <small className="admin-reclamo-profesor">{reclamo.alumno.usuario.email}</small>
                        </td>
                        <td className="admin-reclamo-motivo">{reclamo.motivo}</td>
                        <td>{new Date(reclamo.createdAt).toLocaleString("es-AR")}</td>
                        <td>
                          <span className={`admin-asistencia ${reclamo.clase.profesorAsistio ? "presente" : "ausente"}`}>
                            {reclamo.clase.profesorAsistio ? "Presente" : "Ausente"}
                          </span>
                          <small className="admin-reclamo-profesor">
                            {reclamo.clase.profesorIngreso
                              ? `Ingreso: ${new Date(reclamo.clase.profesorIngreso).toLocaleString("es-AR")}`
                              : "Sin ingreso registrado"}
                          </small>
                        </td>
                        <td>
                          <select
                            value={reclamo.estado}
                            disabled={
                              actualizandoReclamo === reclamo.id_reclamo
                              || reclamo.estado === "resuelto"
                              || reclamo.estado === "rechazado"
                            }
                            onChange={(event) => cambiarEstadoReclamo(reclamo.id_reclamo, event.target.value)}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_revision">En revisión</option>
                            <option value="resuelto">Resuelto</option>
                            <option value="rechazado">Rechazado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {["perfiles", "clases"].includes(seccionActiva) && (
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