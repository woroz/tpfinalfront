import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Send, User } from "lucide-react";
import { obtenerMateriasProfesor, obtenerSolicitudesTablon } from "../../services/api";
import { formatearFecha } from "../../utils/fechas";
import { ChipsMaterias, EstadoChip } from "./comunes";
import OfertaModal from "./ofertaModal";

const POR_PAGINA = 20;

export default function TablonProfesor() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [materiasPropias, setMateriasPropias] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ofertando, setOfertando] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([obtenerSolicitudesTablon(1), obtenerMateriasProfesor()])
      .then(([tablon, propias]) => {
        if (!activo) return;
        const lista = tablon.solicitudes || [];
        setSolicitudes(lista);
        setHayMas(lista.length === POR_PAGINA);
        setMateriasPropias(propias.materias || []);
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

  const idsPropios = useMemo(
    () => new Set(materiasPropias.map((materia) => materia.id_materia)),
    [materiasPropias],
  );

  function materiasOfrecibles(solicitud) {
    return (solicitud.solicitudMateria || [])
      .map((item) => item.materia)
      .filter((materia) => materia && idsPropios.has(materia.id_materia));
  }

  async function cargarMas() {
    setCargandoMas(true);
    setError("");
    try {
      const siguiente = pagina + 1;
      const tablon = await obtenerSolicitudesTablon(siguiente);
      const nuevas = tablon.solicitudes || [];
      setSolicitudes((actuales) => {
        const ids = new Set(actuales.map((item) => item.id_solicitud));
        return [...actuales, ...nuevas.filter((item) => !ids.has(item.id_solicitud))];
      });
      setPagina(siguiente);
      setHayMas(nuevas.length === POR_PAGINA);
    } catch (err) {
      setError(err.message || "No se pudieron cargar más solicitudes.");
    } finally {
      setCargandoMas(false);
    }
  }

  function ofertaEnviada(idSolicitud) {
    setSolicitudes((actuales) => actuales.map((item) => (
      item.id_solicitud === idSolicitud ? { ...item, yaOfreciste: true } : item
    )));
    setOfertando(null);
    setAviso("Oferta enviada. El alumno la va a ver en sus solicitudes.");
  }

  if (cargando) return <p className="res-mensaje">Cargando solicitudes…</p>;

  return (
    <>
      {aviso && <p className="tablon-aviso tablon-aviso-ok" role="status">{aviso}</p>}
      {error && <p className="tablon-aviso tablon-aviso-error" role="alert">{error}</p>}

      {!solicitudes.length && !error && (
        <p className="res-mensaje">No hay solicitudes abiertas por ahora. Volvé más tarde.</p>
      )}

      <ul className="tablon-lista">
        {solicitudes.map((solicitud) => {
          const ofrecibles = materiasOfrecibles(solicitud);
          return (
            <li key={solicitud.id_solicitud}>
              <article className="res-tarjeta tablon-card">
                <div className="tablon-card-cabecera">
                  <div>
                    <h3 className="tablon-titulo">{solicitud.titulo}</h3>
                    <p className="tablon-tema">{solicitud.tema}</p>
                  </div>
                  {solicitud.yaOfreciste && <EstadoChip estado="pendiente" />}
                </div>

                <ChipsMaterias solicitud={solicitud} />

                {solicitud.descripcion && <p className="tablon-desc">{solicitud.descripcion}</p>}

                <ul className="tablon-meta">
                  <li><User aria-hidden="true" />{solicitud.nombreAlumno}</li>
                  <li><CalendarDays aria-hidden="true" />Publicada el {formatearFecha(solicitud.createdAt)}</li>
                </ul>

                <div className="tablon-acciones">
                  {solicitud.yaOfreciste ? (
                    <span className="tablon-nota">Ya ofreciste una clase para esta solicitud.</span>
                  ) : ofrecibles.length ? (
                    <button type="button" className="res-boton res-boton-chico" onClick={() => setOfertando(solicitud)}>
                      <Send size={16} aria-hidden="true" />
                      Hacer oferta
                    </button>
                  ) : (
                    <span className="tablon-nota">
                      No dictás ninguna de estas materias. Podés sumarlas en <Link to="/profesor/materias">Mis materias</Link>.
                    </span>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {hayMas && (
        <div className="tablon-mas">
          <button type="button" className="res-boton-secundario" onClick={cargarMas} disabled={cargandoMas}>
            {cargandoMas ? "Cargando..." : "Ver más solicitudes"}
          </button>
        </div>
      )}

      {ofertando && (
        <OfertaModal
          solicitud={ofertando}
          materias={materiasOfrecibles(ofertando)}
          onCerrar={() => setOfertando(null)}
          onEnviada={ofertaEnviada}
        />
      )}
    </>
  );
}