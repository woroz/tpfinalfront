import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { estadoReclamoLabel } from "../components/ReclamoClase";
import { obtenerMisReclamos } from "../services/api";

export default function MisReclamos() {
  const [reclamos, setReclamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerMisReclamos()
      .then((respuesta) => {
        if (activo) setReclamos(respuesta.reclamos || []);
      })
      .catch((err) => {
        if (activo) setError(err.message || "No se pudo cargar el historial de reclamos.");
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
      <section className="res-contenedor res-contenedor-lista">
        <header className="res-encabezado">
          <h1>Mis reclamos</h1>
          <p>Consultá el estado de los reclamos que realizaste por tus clases.</p>
        </header>
        {cargando && <p className="res-mensaje">Cargando reclamos…</p>}
        {error && <p className="res-error" role="alert">{error}</p>}
        {!cargando && !error && !reclamos.length && (
          <p className="res-mensaje">Todavía no realizaste ningún reclamo.</p>
        )}
        <ul className="res-lista mis-reclamos-lista">
          {reclamos.map((reclamo) => (
            <li className="res-item mis-reclamo-item" key={reclamo.id_reclamo}>
              <div>
                <h2>{reclamo.clase.titulo}</h2>
                <p>
                  Con{" "}
                  {reclamo.clase.profesor?.usuario?.nombre
                    || reclamo.clase.profesor
                    || "Profesor no disponible"}
                </p>
                <p className="mis-reclamo-motivo"><strong>Motivo:</strong> {reclamo.motivo}</p>
                <small>Enviado el {new Date(reclamo.createdAt).toLocaleString("es-AR")}</small>
              </div>
              <span className={`res-estado reclamo-${reclamo.estado}`}>{estadoReclamoLabel(reclamo.estado)}</span>
            </li>
          ))}
        </ul>
        <Link className="res-volver" to="/mis-clases">Volver a mis clases</Link>
      </section>
    </main>
  );
}
