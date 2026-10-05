import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { obtenerMisInscripciones, pagarInscripcion } from "../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../utils/fechas";

const ETIQUETAS = {
  confirmada: "Confirmada",
  pendiente_pago: "Pendiente de pago",
  expirada: "Expirada",
  cancelada: "Cancelada",
};

export default function MisClases() {
  const [historial, setHistorial] = useState(false);
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pagando, setPagando] = useState(null);

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

  async function pagar(idInscripcion) {
    setPagando(idInscripcion);
    setError("");
    try {
      const data = await pagarInscripcion(idInscripcion);
      window.location.assign(data.urlPago);
    } catch (err) {
      setError(err.message);
      setPagando(null);
    }
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
          {inscripciones.map((item) => (
            <li key={item.id_inscripcion} className="res-item">
              <div>
                <h2>{item.clase.titulo}</h2>
                <p>Con {item.profesor.nombre}</p>
                <p>{formatearFecha(item.clase.inicio)} · {formatearHora(item.clase.inicio)} a {formatearHora(item.clase.fin)}</p>
                <p>{formatearPrecio(item.clase.precio)}</p>
              </div>
              <div className="res-item-lado">
                <span className={`res-estado ${item.estado}`}>{ETIQUETAS[item.estado] || item.estado}</span>
                {item.estado === "pendiente_pago" && (
                  <>
                    <button type="button" className="res-boton" disabled={pagando === item.id_inscripcion} onClick={() => pagar(item.id_inscripcion)}>
                      {pagando === item.id_inscripcion ? "Redirigiendo…" : "Pagar ahora"}
                    </button>
                    {item.expira_en && (
                      <small>Disponible hasta las {formatearHora(item.expira_en)}</small>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
