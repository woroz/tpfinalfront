import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { obtenerPagos } from "../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../utils/fechas";

const ETIQUETAS = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  reembolsado: "Reembolsado",
  reembolso_pendiente: "Reembolso en curso",
};

export default function MisPagos() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerPagos()
      .then((data) => {
        if (activo) setPagos(data.pagos);
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
  }, []);

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor">
        <header className="res-encabezado">
          <h1>Mis pagos</h1>
          <p>Acá queda el registro de cada operación asociada a tus clases.</p>
        </header>

        {error && <p className="res-error" role="alert">{error}</p>}
        {cargando && <p className="res-mensaje">Cargando pagos…</p>}
        {!cargando && !pagos.length && !error && (
          <p className="res-mensaje">
            Todavía no tenés pagos registrados. <Link to="/buscar">Buscar profesores</Link>
          </p>
        )}

        <ul className="res-lista">
          {pagos.map((pago) => (
            <li key={pago.id_pago} className="res-item">
              <div>
                <h2>{pago.clase.titulo}</h2>
                <p>Con {pago.profesor.nombre}</p>
                <p>
                  Clase del {formatearFecha(pago.clase.inicio)} a las {formatearHora(pago.clase.inicio)}
                </p>
                {pago.id_operacion && <p className="pago-operacion">Operación {pago.id_operacion}</p>}
              </div>
              <div className="res-item-lado">
                <span className={`res-estado ${pago.estado}`}>{ETIQUETAS[pago.estado] || pago.estado}</span>
                <strong>{formatearPrecio(pago.monto)}</strong>
                <Link className="perfil-enlace" to={`/mis-clases/${pago.id_inscripcion}/pagar`}>
                  Ver detalle
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
