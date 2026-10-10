import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { crearInscripcion } from "../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../utils/fechas";
import { useState } from "react";

function obtenerMaterialesPdf(clase) {
  if (clase.materialesPdf?.length) return clase.materialesPdf;
  return clase.materialUrl
    ? [{ nombre: clase.materialNombre || "Material de la clase", url: clase.materialUrl }]
    : [];
}

export default function DetalleClase() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const clase = state?.clase;
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function reservarCupo() {
    if (!clase || enviando) return;
    setEnviando(true);
    setError("");
    try {
      const respuesta = await crearInscripcion({
        id_clase: clase.id_clase,
        plataforma: "web",
      });
      if (respuesta.urlPago) {
        window.location.assign(respuesta.urlPago);
        return;
      }
      navigate("/mis-clases", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo reservar el cupo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor res-centrado">
        <Link className="res-volver" to="/buscar">Volver a buscar clases</Link>

        {!clase ? (
          <div className="res-tarjeta">
            <h1 className="detalle-clase-titulo">No pudimos cargar esta clase</h1>
            <p className="res-mensaje">
              Volvé al buscador y seleccioná la clase nuevamente.
            </p>
            <Link className="res-boton res-enlace" to="/buscar">Ir al buscador</Link>
          </div>
        ) : (
          <>
            <header className="res-encabezado">
              <h1>{clase.titulo}</h1>
              <p>Clase programada · {formatearPrecio(clase.precio)}</p>
            </header>

            <div className="res-tarjeta detalle-clase">
              <div className="detalle-clase-cabecera">
                <div>
                  <span className="detalle-clase-etiqueta">Materia</span>
                  <h2>{clase.materia?.nombre}</h2>
                </div>
                <span className="res-estado disponible detalle-clase-cupos">
                  {clase.cupos_disponibles} {clase.cupos_disponibles === 1 ? "cupo disponible" : "cupos disponibles"}
                </span>
              </div>

              <dl className="detalle-clase-datos">
                <div>
                  <dt>Tema</dt>
                  <dd>{clase.tema}</dd>
                </div>
                <div>
                  <dt>Profesor</dt>
                  <dd>{clase.profesor?.nombre}</dd>
                </div>
                <div>
                  <dt>Fecha</dt>
                  <dd>{formatearFecha(clase.inicio)}</dd>
                </div>
                <div>
                  <dt>Horario</dt>
                  <dd>{formatearHora(clase.inicio)} a {formatearHora(clase.fin)}</dd>
                </div>
                <div>
                  <dt>Área</dt>
                  <dd>{clase.materia?.area}</dd>
                </div>
                <div>
                  <dt>Distancia</dt>
                  <dd>{clase.distancia_km} km</dd>
                </div>
              </dl>

              <div className="detalle-clase-material">
                <h2>Materiales de la clase</h2>
                {obtenerMaterialesPdf(clase).length ? (
                  <ul className="detalle-clase-pdf-lista">
                    {obtenerMaterialesPdf(clase).map((material) => (
                      <li key={material.url}>
                        <a href={material.url} target="_blank" rel="noreferrer">
                          Ver PDF: {material.nombre}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>El profesor todavía no cargó el material.</p>
                )}
              </div>

              {clase.contenido && (
                <div className="detalle-clase-material">
                  <h2>Descripción de la clase</h2>
                  <p>{clase.contenido}</p>
                </div>
              )}

              <div className="detalle-clase-reserva">
                <h2>Reserva de cupo</h2>
                {error && <p className="res-error" role="alert">{error}</p>}
                <p>
                  Esta clase tiene una fecha y un horario definidos. No tenés que elegir
                  otro horario como en una clase particular.
                </p>
                <button
                  type="button"
                  className="res-boton"
                  disabled={enviando || !clase.cupos_disponibles}
                  onClick={reservarCupo}
                >
                  {enviando
                    ? "Procesando..."
                    : clase.cupos_disponibles
                      ? "Reservar cupo"
                      : "No hay cupos disponibles"}
                </button>
                <small>
                  {clase.precio > 0
                    ? "Vas a ser redirigido a Mercado Pago para completar la reserva."
                    : "La reserva es gratuita y se confirmará inmediatamente."}
                </small>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
