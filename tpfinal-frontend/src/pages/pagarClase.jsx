import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { obtenerInscripcion, pagarInscripcion } from "../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../utils/fechas";

const ESTADOS_PAGO = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  reembolsado: "Reembolsado",
  reembolso_pendiente: "Reembolso en curso",
};

function formatearFechaHora(iso) {
  return `${formatearFecha(iso)} a las ${formatearHora(iso)}`;
}

export default function PagarClase() {
  const { id } = useParams();
  const [inscripcion, setInscripcion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [redirigiendo, setRedirigiendo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerInscripcion(id)
      .then((data) => {
        if (activo) setInscripcion(data.inscripcion);
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
  }, [id]);

  async function pagar() {
    setRedirigiendo(true);
    setError("");
    try {
      const data = await pagarInscripcion(id);
      window.location.assign(data.urlPago);
    } catch (err) {
      setError(err.message);
      setRedirigiendo(false);
    }
  }

  const pago = inscripcion?.pago;
  const estado = inscripcion?.estado;

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor res-centrado">
        <Link className="res-volver" to="/mis-clases">Volver a mis clases</Link>

        {cargando && <p className="res-mensaje">Cargando…</p>}
        {error && <p className="res-error" role="alert">{error}</p>}

        {inscripcion && (
          <div className="res-tarjeta">
            <h1 className="pago-titulo">
              {estado === "confirmada" ? "Clase confirmada" : "Pagar clase"}
            </h1>

            <dl className="pago-detalle">
              <div><dt>Clase</dt><dd>{inscripcion.clase.titulo}</dd></div>
              <div><dt>Profesor</dt><dd>{inscripcion.profesor.nombre}</dd></div>
              <div><dt>Día y hora</dt><dd>{formatearFechaHora(inscripcion.clase.inicio)}</dd></div>
              <div className="pago-total">
                <dt>Importe</dt>
                <dd>{formatearPrecio(inscripcion.clase.precio)}</dd>
              </div>
            </dl>

            {estado === "pendiente_pago" && (
              <>
                {inscripcion.expira_en && (
                  <p className="res-nota">
                    Tu horario está reservado hasta las {formatearHora(inscripcion.expira_en)}. Si no pagás antes, se libera.
                  </p>
                )}
                <button type="button" className="res-boton" disabled={redirigiendo} onClick={pagar}>
                  {redirigiendo ? "Redirigiendo a Mercado Pago…" : "Pagar con Mercado Pago"}
                </button>
                <p className="res-nota">
                  Vas a salir de MentorAr para completar el pago. Cuando se acredite, la clase queda confirmada.
                </p>
              </>
            )}

            {estado === "confirmada" && (
              <>
                {pago ? (
                  <>
                    <h2 className="pago-subtitulo">Comprobante de pago</h2>
                    <dl className="pago-detalle">
                      <div><dt>Estado</dt><dd>{ESTADOS_PAGO[pago.estado] || pago.estado}</dd></div>
                      <div><dt>Monto</dt><dd>{formatearPrecio(pago.monto)}</dd></div>
                      <div><dt>Medio de pago</dt><dd>Mercado Pago</dd></div>
                      {pago.fecha_pago && (
                        <div><dt>Fecha del pago</dt><dd>{formatearFechaHora(pago.fecha_pago)}</dd></div>
                      )}
                      {pago.id_operacion && (
                        <div><dt>Número de operación</dt><dd>{pago.id_operacion}</dd></div>
                      )}
                    </dl>
                  </>
                ) : (
                  <p className="res-nota">Esta clase no requiere pago.</p>
                )}
              </>
            )}

            {(estado === "expirada" || estado === "cancelada") && (
              <>
                <p className="res-error">
                  {estado === "expirada"
                    ? "El tiempo para pagar venció y el horario se liberó."
                    : "Esta reserva fue cancelada."}
                </p>
                <Link className="res-boton res-enlace" to={`/profesores/${inscripcion.profesor.id_profesor}/reservar`}>
                  Elegir otro horario
                </Link>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
