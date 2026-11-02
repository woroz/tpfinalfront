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

export default function TarjetaEstadisticas({ titulo = "Estadísticas", rol, fechaAlta, estadisticas: e }) {
  if (!e) return null;

  return (
    <section className="res-tarjeta mi-perfil-estadisticas" aria-label={titulo}>
      <h2>{titulo}</h2>
      {fechaAlta && <p className="mi-perfil-estadisticas-miembro">Miembro {miembroDesde(fechaAlta)}</p>}

      <div className={`mi-perfil-estadisticas-grid${rol === "profesor" ? " mi-perfil-estadisticas-grid--dos" : ""}`}>
        {rol === "alumno" ? (
          <>
            <Estadistica titulo="Clases tomadas" valor={e.clasesTomadas} />
            <Estadistica
              titulo="Calificación promedio"
              valor={formatearPromedio(e.promedioCalificaciones)}
              vacio={e.promedioCalificaciones == null ? "Sin calificaciones" : null}
              detalle={e.cantidadCalificaciones > 0
                ? `${e.cantidadCalificaciones} ${plural(e.cantidadCalificaciones, "calificación", "calificaciones")}`
                : null}
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
              detalle={e.cantidadResenas > 0
                ? `${e.cantidadResenas} ${plural(e.cantidadResenas, "reseña", "reseñas")}`
                : null}
            />
          </>
        )}
      </div>
    </section>
  );
}