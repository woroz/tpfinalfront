import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Check, Clock, FileText, Pencil, Plus, Trash2, User, X } from "lucide-react";
import {
  aceptarOfertaTablon,
  cerrarSolicitudTablon,
  crearSolicitudTablon,
  editarSolicitudTablon,
  eliminarSolicitudTablon,
  obtenerMaterias,
  obtenerMisSolicitudes,
} from "../../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../../utils/fechas";
import { ChipsMaterias, EstadoChip } from "./comunes";
import SolicitudForm from "./SolicitudForm";

export default function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [paraPagar, setParaPagar] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([obtenerMisSolicitudes(), obtenerMaterias()])
      .then(([mias, materias]) => {
        if (!activo) return;
        setSolicitudes(mias.solicitudes || []);
        setCatalogo(materias.materias || []);
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

  async function recargar() {
    try {
      const mias = await obtenerMisSolicitudes();
      setSolicitudes(mias.solicitudes || []);
    } catch (err) {
      setError(err.message || "No se pudo actualizar la lista.");
    }
  }

  async function ejecutar(clave, accion, mensajeOk) {
    setTrabajando(clave);
    setError("");
    setAviso("");
    setParaPagar("");
    try {
      const resultado = await accion();
      await recargar();
      if (mensajeOk) setAviso(mensajeOk);
      return resultado;
    } catch (err) {
      setError(err.message || "No se pudo completar la acción.");
      return null;
    } finally {
      setTrabajando("");
    }
  }

  async function publicar(datos) {
    const resultado = await ejecutar("form", () => crearSolicitudTablon(datos), "Solicitud publicada. Los profesores ya pueden verla.");
    if (resultado) setCreando(false);
  }

  async function guardarEdicion(datos) {
    const resultado = await ejecutar(
      "form",
      () => editarSolicitudTablon(editando.id_solicitud, datos),
      "Solicitud actualizada.",
    );
    if (resultado) setEditando(null);
  }

  async function cerrar(solicitud) {
    if (!window.confirm("¿Cerrar la solicitud? Los profesores ya no podran verla y sus ofertas pendientes se rechazan.")) return;
    await ejecutar(`cerrar-${solicitud.id_solicitud}`, () => cerrarSolicitudTablon(solicitud.id_solicitud), "Solicitud cerrada.");
  }

  async function eliminar(solicitud) {
    if (!window.confirm("¿Eliminar la solicitud? Esta accion no se puede deshacer.")) return;
    await ejecutar(`eliminar-${solicitud.id_solicitud}`, () => eliminarSolicitudTablon(solicitud.id_solicitud), "Solicitud eliminada.");
  }

  async function aceptar(solicitud, oferta) {
    const nombre = oferta.profesor?.usuario?.nombre || "este profesor";
    if (!window.confirm(`¿Aceptar la oferta de ${nombre}? Las demas ofertas se van a rechazar.`)) return;
    const resultado = await ejecutar(
      `aceptar-${oferta.id_oferta}`,
      () => aceptarOfertaTablon(solicitud.id_solicitud, oferta.id_oferta),
      "Oferta aceptada.",
    );
    if (resultado?.id_inscripcion) setParaPagar(resultado.id_inscripcion);
  }

  if (cargando) return <p className="res-mensaje">Cargando tus solicitudes…</p>;

  return (
    <>
      <div className="tablon-cabecera-acciones">
        <p className="res-mensaje">Publica lo que necesitas y elegi entre las ofertas que recibas.</p>
        {!creando && !editando && (
          <button
            type="button"
            className="res-boton res-boton-chico"
            onClick={() => {
              setCreando(true);
              setError("");
              setAviso("");
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Nueva solicitud
          </button>
        )}
      </div>

      {aviso && (
        <div className="tablon-aviso tablon-aviso-ok" role="status">
          <span>{aviso}</span>
          {paraPagar && (
            <Link className="res-boton res-boton-chico res-enlace" to={`/mis-clases/${paraPagar}/pagar`}>
              Ir a pagar
            </Link>
          )}
        </div>
      )}
      {error && <p className="tablon-aviso tablon-aviso-error" role="alert">{error}</p>}

      {creando && (
        <SolicitudForm
          catalogo={catalogo}
          guardando={trabajando === "form"}
          onGuardar={publicar}
          onCancelar={() => setCreando(false)}
        />
      )}

      {!solicitudes.length && !creando && (
        <p className="res-mensaje">Todavia no publicaste ninguna solicitud.</p>
      )}

      <ul className="tablon-lista">
        {solicitudes.map((solicitud) => {
          if (editando?.id_solicitud === solicitud.id_solicitud) {
            return (
              <li key={solicitud.id_solicitud}>
                <SolicitudForm
                  catalogo={catalogo}
                  inicial={solicitud}
                  guardando={trabajando === "form"}
                  onGuardar={guardarEdicion}
                  onCancelar={() => setEditando(null)}
                />
              </li>
            );
          }

          const ofertas = solicitud.ofertas || [];
          const sinOfertas = ofertas.length === 0;
          const abierta = solicitud.estado === "abierta" && !solicitud.vencida;
          const estado = solicitud.vencida ? "vencida" : solicitud.estado;

          return (
            <li key={solicitud.id_solicitud}>
              <article className="res-tarjeta tablon-card">
                <div className="tablon-card-cabecera">
                  <div>
                    <h3 className="tablon-titulo">{solicitud.titulo}</h3>
                    <p className="tablon-tema">{solicitud.tema}</p>
                  </div>
                  <EstadoChip estado={estado} />
                </div>

                <ChipsMaterias solicitud={solicitud} />
                {solicitud.descripcion && <p className="tablon-desc">{solicitud.descripcion}</p>}

                <ul className="tablon-meta">
                  <li><CalendarDays aria-hidden="true" />Publicada el {formatearFecha(solicitud.createdAt)}</li>
                </ul>

                {solicitud.vencida && (
                  <p className="tablon-nota">Pasaron 14 días sin que alguien la tome. Podés cerrarla y publicar una nueva.</p>
                )}

                {!sinOfertas && (
                  <section className="tablon-ofertas" aria-label="Ofertas recibidas">
                    <h4>Ofertas recibidas ({ofertas.length})</h4>
                    {ofertas.map((oferta) => (
                      <div key={oferta.id_oferta} className="tablon-oferta">
                        <div className="tablon-card-cabecera">
                          <strong>{oferta.profesor?.usuario?.nombre || "Profesor"}</strong>
                          <EstadoChip estado={oferta.estado} />
                        </div>
                        <ul className="tablon-meta">
                          {oferta.materia && <li><User aria-hidden="true" />{oferta.materia.nombreMateria}</li>}
                          <li><CalendarDays aria-hidden="true" />{formatearFecha(oferta.fecha_hora_inicio)}</li>
                          <li>
                            <Clock aria-hidden="true" />
                            {formatearHora(oferta.fecha_hora_inicio)} a {formatearHora(oferta.fecha_hora_fin)}
                          </li>
                          {oferta.materialNombre && <li><FileText aria-hidden="true" />{oferta.materialNombre}</li>}
                        </ul>
                        {oferta.mensaje && <p className="tablon-desc">{oferta.mensaje}</p>}
                        <div className="tablon-acciones">
                          <strong className="tablon-precio">{formatearPrecio(oferta.precio)}</strong>
                          {abierta && oferta.estado === "pendiente" && (
                            <button
                              type="button"
                              className="res-boton res-boton-chico"
                              onClick={() => aceptar(solicitud, oferta)}
                              disabled={Boolean(trabajando)}
                            >
                              <Check size={16} aria-hidden="true" />
                              Aceptar oferta
                            </button>
                          )}
                          {oferta.estado === "aceptada" && (
                            <Link className="perfil-enlace" to="/mis-clases">Ver en Mis clases</Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                <div className="tablon-acciones">
                  {abierta && sinOfertas && (
                    <button
                      type="button"
                      className="res-boton-secundario"
                      onClick={() => {
                        setEditando(solicitud);
                        setCreando(false);
                        setError("");
                        setAviso("");
                      }}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Editar
                    </button>
                  )}
                  {solicitud.estado === "abierta" && (
                    <button
                      type="button"
                      className="res-boton-secundario"
                      onClick={() => cerrar(solicitud)}
                      disabled={Boolean(trabajando)}
                    >
                      <X size={16} aria-hidden="true" />
                      Cerrar
                    </button>
                  )}
                  {sinOfertas && (
                    <button
                      type="button"
                      className="res-boton-secundario tablon-peligro"
                      onClick={() => eliminar(solicitud)}
                      disabled={Boolean(trabajando)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Eliminar
                    </button>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </>
  );
}