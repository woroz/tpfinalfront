import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { obtenerInscripcion, verificarPago } from "../services/api";
import { formatearFecha, formatearHora } from "../utils/fechas";

const MAX_INTENTOS = 10;
const ESPERA_MS = 2000;

export default function PagoResultado() {
  const [params] = useSearchParams();
  const idInscripcion = params.get("inscripcion");
  const idPago = params.get("payment_id") || params.get("collection_id");
  const [inscripcion, setInscripcion] = useState(null);
  const [consultando, setConsultando] = useState(Boolean(idInscripcion));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!idInscripcion) return undefined;
    let activo = true;
    let intentos = 0;
    let temporizador;

    async function consultar() {
      try {
        const data = await obtenerInscripcion(idInscripcion);
        if (!activo) return;
        setInscripcion(data.inscripcion);
        if (data.inscripcion.estado === "pendiente_pago" && intentos < MAX_INTENTOS) {
          intentos += 1;
          temporizador = setTimeout(consultar, ESPERA_MS);
        } else {
          setConsultando(false);
        }
      } catch (err) {
        if (!activo) return;
        setError(err.message);
        setConsultando(false);
      }
    }

    async function iniciar() {
      if (idPago) await verificarPago(idPago).catch(() => null);
      if (activo) await consultar();
    }

    iniciar();
    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [idInscripcion, idPago]);

  let titulo = "Estamos verificando tu pago";
  let detalle = "Esto puede demorar unos segundos.";

  if (!idInscripcion) {
    titulo = "No encontramos la reserva";
    detalle = "Revisá tus clases para ver el estado de tus reservas.";
  } else if (inscripcion?.estado === "confirmada") {
    titulo = "¡Pago registrado y clase confirmada!";
    detalle = `Tu clase de ${inscripcion.clase.materia} es el ${formatearFecha(inscripcion.clase.inicio)} a las ${formatearHora(inscripcion.clase.inicio)}.`;
  } else if (inscripcion?.estado === "pendiente_pago" && !consultando) {
    titulo = "Todavía no recibimos el pago";
    detalle = "Si ya pagaste, la confirmación puede tardar unos minutos. Te vamos a avisar cuando se acredite.";
  } else if (inscripcion && inscripcion.estado !== "pendiente_pago") {
    titulo = "No pudimos confirmar la reserva";
    detalle = "El pago no se completó o el tiempo para pagar venció. Podés elegir otro horario.";
  }

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor res-centrado">
        <div className={`res-tarjeta res-resultado ${inscripcion?.estado === "confirmada" ? "res-resultado-exito" : ""}`}>
          {inscripcion?.estado === "confirmada" && (
            <div className="res-resultado-icono" aria-hidden="true">✓</div>
          )}
          <h1>{titulo}</h1>
          <p className="res-resultado-detalle">{detalle}</p>
          {error && <p className="res-error" role="alert">{error}</p>}
          {idInscripcion && (
            <div className="res-resultado-acciones">
              <Link className="res-boton res-enlace" to={`/mis-clases/${idInscripcion}/pagar`}>
                {inscripcion?.estado === "confirmada" ? "Ver comprobante" : "Ver estado del pago"}
              </Link>
              <Link className="res-resultado-secundario" to="/mis-clases">Ir a mis clases</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
