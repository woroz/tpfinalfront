import { useEffect, useState } from "react";
import { obtenerLogros } from "../services/api";

function estadoLabel(estado) {
  if (estado === "obtenido") return "Obtenido";
  if (estado === "en_progreso") return "En progreso";
  return "Pendiente";
}

export default function LogrosPerfil({ rol }) {
  const [logros, setLogros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (rol !== "alumno" && rol !== "profesor") return undefined;

    let activo = true;
    setCargando(true);
    obtenerLogros()
      .then((respuesta) => {
        if (!activo) return;
        setLogros(respuesta.logros || []);
        setError("");
      })
      .catch((err) => {
        if (activo) setError(err.message || "No pudimos cargar tus logros.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [rol, intento]);

  if (rol !== "alumno" && rol !== "profesor") return null;

  const obtenidos = logros.filter((logro) => logro.estado === "obtenido");

  return (
    <section className="res-tarjeta mi-perfil-logros" aria-label="Mis logros">
      <div className="mi-perfil-logros-cabecera">
        <div>
          <h2>Mis logros</h2>
          <p>Completá desafíos y seguí tu progreso en MentorAr.</p>
        </div>
        {!cargando && !error && (
          <span className="mi-perfil-logros-contador">{obtenidos.length}/{logros.length}</span>
        )}
      </div>

      {cargando && <p className="res-mensaje">Cargando logros…</p>}

      {!cargando && error && (
        <div>
          <p className="res-error" role="alert">{error}</p>
          <button type="button" className="res-boton" onClick={() => setIntento((actual) => actual + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && !logros.length && (
        <p className="res-mensaje">Todavía no hay logros disponibles para tu perfil.</p>
      )}

      {!cargando && !error && logros.length > 0 && (
        <div className="mi-perfil-logros-grid">
          {logros.map((logro) => {
            const porcentaje = Math.min(100, Math.max(0, Number(logro.progreso?.porcentaje) || 0));
            return (
              <article className={`mi-perfil-logro mi-perfil-logro-${logro.estado}`} key={logro.id_logro}>
                <div className="mi-perfil-logro-icono" aria-hidden="true">★</div>
                <div className="mi-perfil-logro-contenido">
                  <div className="mi-perfil-logro-titulo">
                    <h3>{logro.nombre}</h3>
                    <span>{estadoLabel(logro.estado)}</span>
                  </div>
                  <p>{logro.descripcion}</p>
                  <div className="mi-perfil-logro-progreso" aria-label={`Progreso: ${logro.progreso?.texto || "0"}`}>
                    <span style={{ width: `${porcentaje}%` }} />
                  </div>
                  <div className="mi-perfil-logro-meta">
                    <span>{logro.progreso?.texto || "Sin progreso"}</span>
                    {logro.progreso?.textoRestante && <span>{logro.progreso.textoRestante}</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
