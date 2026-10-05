import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { obtenerClasesProgramadas } from "../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../utils/fechas";

export default function ClasesProfesor() {
  const [historial, setHistorial] = useState(false);
  const [clases, setClases] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerClasesProgramadas(historial)
      .then((data) => {
        if (!activo) return;
        setClases(data.clases);
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
          <h1>Clases programadas</h1>
          <p>
            Estas son las clases que tenés agendadas. Para que los alumnos puedan reservar,
            cargá tus horarios en <Link to="/profesor/disponibilidad">Disponibilidad</Link>.
          </p>
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
        {!cargando && !clases.length && (
          <p className="res-mensaje">No tenés clases {historial ? "registradas" : "próximas"}.</p>
        )}

        <ul className="res-lista">
          {clases.map((clase) => (
            <li key={clase.id_clase} className="res-item">
              <div>
                <h2>{clase.titulo}</h2>
                <p>{clase.materia} · {clase.tema}</p>
                <p>{formatearFecha(clase.inicio)} · {formatearHora(clase.inicio)} a {formatearHora(clase.fin)}</p>
                <p>
                  {clase.alumnos.length
                    ? `Alumnos: ${clase.alumnos.map((alumno) => alumno.nombre).join(", ")}`
                    : "Sin alumnos inscriptos"}
                </p>
              </div>
              <div className="res-item-lado">
                <span className={`res-estado ${clase.estado}`}>{clase.estado}</span>
                <small>{formatearPrecio(clase.precio)}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
