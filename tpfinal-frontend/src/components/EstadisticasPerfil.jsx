import { useEffect, useState } from "react";
import { obtenerEstadisticas } from "../services/api";
import { formatearPromedio, miembroDesde, plural } from "../utils/estadisticas";

function Estadistica({ titulo, valor, detalle, vacio }) {
  return (
    <div className="mi-perfil-estadistica">
      <span className="mi-perfil-estadistica-titulo">{titulo}</span>
      {vacio ? (
        <span className="mi-perfil-estadistica-vacio">{vacio}</span>
      ) : (
        <strong className="mi-perfil-estadistica-valor">{valor}</strong>
      )}
      {detalle && <span className="mi-perfil-estadistica-detalle">{detalle}</span>}
    </div>
  );
}

export default function EstadisticasPerfil({ rol }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (rol !== "alumno" && rol !== "profesor") return undefined;

    let activo = true;
    obtenerEstadisticas()
      .then((respuesta) => {
        if (activo) {
          setDatos(respuesta);
          setError("");
        }
      })
      .catch((err) => {
        if (activo) setError(err.message || "No pudimos cargar tus estadisticas.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [rol, intento]);

  if (rol !== "alumno" && rol !== "profesor") return null;

  function reintentar() {
    setCargando(true);
    setError("");
    setIntento((n) => n + 1);
  }

  const e = datos?.estadisticas;

  return (
    <section className="res-tarjeta mi-perfil-estadisticas" aria-label="Mis estadísticas">
      <h2>Mis estadisticas</h2>

      {cargando && <p className="res-mensaje">Cargando estadísticas…</p>}

      {!cargando && error && (
        <div>
          <p className="res-error" role="alert">{error}</p>
          <button type="button" className="res-boton" onClick={reintentar}>Reintentar</button>
        </div>
      )}

      {!cargando && !error && e && (
        <>
          <p className="mi-perfil-estadisticas-miembro">Miembro {miembroDesde(datos.miembroDesde)}</p>

          <div className="mi-perfil-estadisticas-grid">
            {rol === "alumno" ? (
              <>
                <Estadistica titulo="Clases tomadas" valor={e.clasesTomadas} />
                <Estadistica
                  titulo="Calificación promedio"
                  valor={formatearPromedio(e.promedioCalificaciones)}
                  vacio={e.promedioCalificaciones == null ? "Sin calificaciones" : null}
                  detalle={
                    e.cantidadCalificaciones > 0
                      ? `${e.cantidadCalificaciones} ${plural(e.cantidadCalificaciones, "calificación", "calificaciones")}`
                      : null
                  }
                />
                <Estadistica titulo="Reseñas dejadas" valor={e.resenasDejadas} />
              </>
            ) : (
              <>
                <Estadistica titulo="Clases dictadas" valor={e.clasesDictadas} />
                <Estadistica
                  titulo="Promedio de reseñas"
                  valor={e.promedioResenas == null ? null : `${formatearPromedio(e.promedioResenas)} de 5`}
                  vacio={e.promedioResenas == null ? "Sin reseñas" : null}
                  detalle={
                    e.cantidadResenas > 0
                      ? `${e.cantidadResenas} ${plural(e.cantidadResenas, "reseña", "reseñas")}`
                      : null
                  }
                />
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}