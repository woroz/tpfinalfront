import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { actualizarPerfil, obtenerClasesProgramadas, obtenerPerfil } from "../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../utils/fechas";

function SolicitudUbicacionProfesor({ onComplete }) {
  const [visible, setVisible] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerPerfil()
      .then((data) => {
        if (!activo) return;
        const profesor = data.perfil?.profesor;
        const tieneUbicacion = Number.isFinite(Number(profesor?.latitud_prof))
          && Number.isFinite(Number(profesor?.longitud_prof));
        setVisible(!tieneUbicacion);
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

  function cerrar() {
    setVisible(false);
    onComplete();
  }

  function guardarUbicacion() {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite obtener la ubicacion.");
      return;
    }

    setGuardando(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await actualizarPerfil({
            latitud_prof: coords.latitude,
            longitud_prof: coords.longitude,
          });
          cerrar();
        } catch (err) {
          setError(err.message);
        } finally {
          setGuardando(false);
        }
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Necesitamos permiso de ubicacion para mostrarte en el mapa."
            : "No pudimos obtener tu ubicacion. Intenta nuevamente.",
        );
        setGuardando(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  if (cargando || !visible) return null;

  return (
    <div className="ubicacion-overlay" role="presentation">
      <section className="ubicacion-dialog" role="dialog" aria-modal="true" aria-labelledby="ubicacion-titulo">
        <h2 id="ubicacion-titulo">Agrega tu ubicacion</h2>
        <p>
          Necesitamos tu ubicacion actual para que los alumnos puedan encontrarte en el mapa.
          Solo se guardaran tus coordenadas.
        </p>
        {error && <p className="res-error" role="alert">{error}</p>}
        <div className="ubicacion-actions">
          <button type="button" className="ubicacion-secondary" onClick={cerrar} disabled={guardando}>
            Ahora no
          </button>
          <button type="button" className="ubicacion-primary" onClick={guardarUbicacion} disabled={guardando}>
            {guardando ? "Guardando..." : "Usar mi ubicacion"}
          </button>
        </div>
      </section>
    </div>
  );
}

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
      <SolicitudUbicacionProfesor onComplete={() => {}} />
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
