import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { obtenerMisInscripciones } from "../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../utils/fechas";

const ETIQUETAS = {
  confirmada: "Confirmada",
  pendiente_pago: "Pendiente de pago",
  expirada: "Expirada",
  cancelada: "Cancelada",
};

function obtenerMaterialesPdf(clase) {
  if (clase.materialesPdf?.length) return clase.materialesPdf;
  return clase.materialUrl
    ? [{ nombre: clase.materialNombre || "Material de la clase", url: clase.materialUrl }]
    : [];
}

export default function MisClases() {
  const [historial, setHistorial] = useState(false);
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    obtenerMisInscripciones(historial)
      .then((data) => {
        if (!activo) return;
        setInscripciones(data.inscripciones);
        setError("");
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [historial]);

  function cambiarVista(valor) {
    if (valor === historial) return;
    setCargando(true);
    setHistorial(valor);
  }

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor">
        <header className="res-encabezado">
          <h1>Mis clases</h1>
          <p>Consultá tus clases agendadas y completá los pagos pendientes.</p>
        </header>

        <div className="res-pestanias" role="tablist">
          <button type="button" role="tab" aria-selected={!historial} className={!historial ? "activo" : ""} onClick={() => cambiarVista(false)}>
            Próximas
          </button>
          <button type="button" role="tab" aria-selected={historial} className={historial ? "activo" : ""} onClick={() => cambiarVista(true)}>
            Historial
          </button>
        </div>

        {error && <p className="res-error" role="alert">{error}</p>}
        {cargando && <p className="res-mensaje">Cargando clases…</p>}

        {!cargando && !inscripciones.length && (
          <p className="res-mensaje">
            No tenés clases {historial ? "registradas" : "próximas"}. <Link to="/buscar">Buscar profesores</Link>
          </p>
        )}

        <ul className="res-lista">
          {inscripciones.map((item) => {
           const materialesPdf = obtenerMaterialesPdf(item.clase);
           //const ahora = new Date();
           //const inicioClase = new Date(item.clase.inicio);
           //const finClase = new Date(item.clase.fin);
           //const ventanaEntrada = new Date(inicioClase.getTime() - 10 * 60 * 1000);
           //const claseEstaActiva = ahora >= ventanaEntrada && ahora <= finClase;
           const claseEstaActiva = true;
           return (
            <li key={item.id_inscripcion} className="res-item">
              <div>
                <h2>{item.clase.titulo}</h2>
                <p>Con {item.profesor.nombre}</p>
                <p>{formatearFecha(item.clase.inicio)}, de {formatearHora(item.clase.inicio)} a {formatearHora(item.clase.fin)}</p>
                <p>{formatearPrecio(item.clase.precio)}</p>
                <details className="mis-clases-detalle">
                  <summary>Ver más información</summary>
                  <div className="mis-clases-detalle-contenido">
                    {item.clase.materia && <p><strong>Materia:</strong> {item.clase.materia}</p>}
                    {item.clase.tema && <p><strong>Tema:</strong> {item.clase.tema}</p>}
                    <p>
                      <strong>Descripción:</strong>{" "}
                      {item.clase.contenido || "El profesor no agregó una descripción."}
                    </p>
                    {materialesPdf.length ? (
                      <ul className="mis-clases-pdf-lista">
                        {materialesPdf.map((material) => (
                          <li key={material.url}>
                            <a href={material.url} target="_blank" rel="noreferrer">
                              Ver PDF: {material.nombre}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>El profesor todavía no subió material en PDF.</p>
                    )}
                  </div>
                </details>
              </div>
              <div className="res-item-lado">
                <span className={`res-estado ${item.estado}`}>{ETIQUETAS[item.estado] || item.estado}</span>
                {item.estado === "pendiente_pago" && (
                  <>
                    <Link className="res-boton res-enlace res-boton-chico" to={`/mis-clases/${item.id_inscripcion}/pagar`}>
                      Pagar clase
                    </Link>
                    {item.expira_en && (
                      <small>Disponible hasta las {formatearHora(item.expira_en)}</small>
                    )}
                  </>
                )}
                {item.estado === "confirmada" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
              <button
                disabled={!claseEstaActiva}
                onClick={() => navigate(`/clase-virtual/${item.clase.id_clase}`)}
                className={`res-boton res-boton-chico`}
                style={{
                  backgroundColor: claseEstaActiva ? "#28a745" : "#6c757d",
                  color: "white",
                  border: "none",
                  cursor: claseEstaActiva ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                  opacity: claseEstaActiva ? 1 : 0.7
                }}
              >
                {claseEstaActiva ? "Unirse a Videollamada" : "Videollamada inactiva"}
              </button>
              {item.pago && (
                <Link className="perfil-enlace" to={`/mis-clases/${item.id_inscripcion}/pagar`}>
                  Ver comprobante
                </Link>
              )}
            </div>
          )}
              </div>
            </li>
              );
              })}
        </ul>
      </section>
    </main>
  );
}
