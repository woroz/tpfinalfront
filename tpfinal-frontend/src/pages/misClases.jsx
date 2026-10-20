import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { obtenerMisInscripciones } from "../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../utils/fechas";
import ChatClase from "../components/chatClase";
import { useAuth } from "../context/authContext";
import TranscripcionClase from "../components/TranscripcionClase";
import ResenaClase from "../components/ResenaClase";
import "../styles/misClases.css";

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
  const { usuario } = useAuth();
  const [historial, setHistorial] = useState(false);
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [chatClaseAbierto, setChatClaseAbierto] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const inscripcionesVisibles = historial
    ? inscripciones.filter((item) => (
      item.estado === "cancelada"
      || item.estado === "expirada"
      || (
        Number.isFinite(Date.parse(item.clase.fin))
        && Date.parse(item.clase.fin) <= ahora
        && (item.asistio || item.profesor.resenaHecha)
      )
    ))
    : inscripciones;

  useEffect(() => {
    const temporizador = window.setInterval(() => setAhora(Date.now()), 60_000);
    return () => window.clearInterval(temporizador);
  }, []);

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
    <main className="app-page mis-clases-pagina">
      <Navbar />
      <section className="res-contenedor res-contenedor-lista">
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

        {!cargando && !inscripcionesVisibles.length && (
          <p className="res-mensaje">
            {historial ? "Todavía no tenés clases realizadas o canceladas." : "No tenés clases próximas."}{" "}
            <Link to="/buscar">Buscar profesores</Link>
          </p>
        )}

        <ul className="res-lista">
          {inscripcionesVisibles.map((item) => {
           const materialesPdf = obtenerMaterialesPdf(item.clase);
           const claseFinalizada = Number.isFinite(Date.parse(item.clase.fin))
             && Date.parse(item.clase.fin) <= ahora;
           const puedeResenar = historial
             && item.estado === "confirmada"
             && claseFinalizada
             && (item.asistio || item.profesor.resenaHecha);
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
                <p>Con <Link className="mis-clases-profesor-link" to={`/profesores/${item.profesor.id_profesor}`}>{item.profesor.nombre}</Link></p>
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
                <section className="mis-clases-registros">
                  <h3>Seguimiento de tu desempeño</h3>
                  {item.clase.registrosActividad?.length ? (
                    <ul className="registro-actividad-lista">
                      {item.clase.registrosActividad.map((registro) => (
                        <li key={registro.id_registro}>
                          <div>
                            <strong>{registro.actividad || "Registro de la clase"}</strong>
                            {registro.calificacion !== null && <span>Calificación: {registro.calificacion}</span>}
                            {registro.nota && <p>{registro.nota}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Tu profesor todavía no registró calificaciones o notas para esta clase.</p>
                  )}
                </section>
                <br></br>
                <TranscripcionClase idClase={item.clase.id_clase} />
              </div>
              <div className="res-item-lado">
                <span className={`res-estado ${item.estado}`}>{ETIQUETAS[item.estado] || item.estado}</span>
                {puedeResenar && (
                  <div className="mis-clases-resena">
                    <ResenaClase
                      idProfesor={item.profesor.id_profesor}
                      idClase={item.clase.id_clase}
                      resena={item.profesor.resena}
                      onCreada={(resena) => setInscripciones((actuales) => actuales.map((inscripcion) => (
                        inscripcion.profesor.id_profesor === item.profesor.id_profesor
                          ? {
                            ...inscripcion,
                            profesor: { ...inscripcion.profesor, resenaHecha: true, resena }
                          }
                          : inscripcion
                      )))}
                    />
                  </div>
                )}
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
              <button
              type="button"
              className="res-boton res-boton-chico"
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold"
              }}
              onClick={() => setChatClaseAbierto(chatClaseAbierto === item.clase.id_clase ? null : item.clase.id_clase)}
              >
                {chatClaseAbierto === item.clase.id_clase ? "Cerrar Chat ✕" : "💬 Chat de la clase"}</button>
              {item.pago && (
                <Link className="perfil-enlace" to={`/mis-clases/${item.id_inscripcion}/pagar`}>
                  Ver comprobante
                </Link>
              )}
            </div>
          )}
              </div>
              {chatClaseAbierto === item.clase.id_clase && (
                <div style={{ width: "100%", marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed #ccc" }}>
                  <ChatClase 
                    idClase={item.clase.id_clase} 
                    idUsuarioActual={usuario?.id_usuario} 
                  />
                </div>
              )}
            </li>
              );
              })}
        </ul>
      </section>
    </main>
  );
}
