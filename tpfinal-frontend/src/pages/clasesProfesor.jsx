import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  actualizarPerfil,
  cambiarHorarioClase,
  obtenerClasesProgramadas,
  obtenerPerfil,
  eliminarMaterialClase,
  reemplazarMaterialClase,
  subirMaterialClase,
} from "../services/api";
import { formatearFecha, formatearHora, formatearPrecio } from "../utils/fechas";

const MAX_PDF = 4 * 1024 * 1024;
const MAX_PDFS = 3;

function obtenerMaterialesPdf(clase) {
  if (clase.materialesPdf?.length) return clase.materialesPdf;
  return clase.materialUrl
    ? [{ nombre: clase.materialNombre || "Material de la clase", url: clase.materialUrl }]
    : [];
}

function fechaHoraLocal(iso) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return {
    fecha: `${valores.year}-${valores.month}-${valores.day}`,
    hora: `${valores.hour}:${valores.minute}`,
  };
}

function aIsoArgentina(fecha, hora) {
  return new Date(`${fecha}T${hora}:00-03:00`).toISOString();
}

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
  const [claseEditando, setClaseEditando] = useState(null);
  const [nuevoHorario, setNuevoHorario] = useState({ fechaInicio: "", horaInicio: "", fechaFin: "", horaFin: "" });
  const [guardandoHorario, setGuardandoHorario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [subiendoMaterial, setSubiendoMaterial] = useState(null);
  const [actualizandoMaterial, setActualizandoMaterial] = useState(null);
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
    setClaseEditando(null);
    setHistorial(valor);
  }

  function editarHorario(clase) {
    const inicio = fechaHoraLocal(clase.inicio);
    const fin = fechaHoraLocal(clase.fin);
    setClaseEditando(clase.id_clase);
    setNuevoHorario({
      fechaInicio: inicio.fecha,
      horaInicio: inicio.hora,
      fechaFin: fin.fecha,
      horaFin: fin.hora,
    });
    setError("");
    setMensaje("");
  }

  async function guardarHorario(event, clase) {
    event.preventDefault();
    setError("");
    setMensaje("");
    if (!nuevoHorario.fechaInicio || !nuevoHorario.horaInicio || !nuevoHorario.fechaFin || !nuevoHorario.horaFin) {
      setError("Completá la fecha y la hora de inicio y de fin.");
      return;
    }
    const inicio = aIsoArgentina(nuevoHorario.fechaInicio, nuevoHorario.horaInicio);
    const fin = aIsoArgentina(nuevoHorario.fechaFin, nuevoHorario.horaFin);
    if (new Date(inicio) <= new Date()) {
      setError("El nuevo horario debe ser futuro.");
      return;
    }
    if (new Date(inicio) >= new Date(fin)) {
      setError("El horario de fin debe ser posterior al de inicio.");
      return;
    }

    setGuardandoHorario(true);
    try {
      const respuesta = await cambiarHorarioClase(clase.id_clase, inicio, fin);
      const actualizada = respuesta.clase;
      setClases((actuales) => actuales.map((item) => item.id_clase === clase.id_clase
        ? {
          ...item,
          inicio: actualizada.fecha_hora_inicio,
          fin: actualizada.fecha_hora_fin,
        }
        : item));
      setClaseEditando(null);
      setMensaje("Horario actualizado. Los alumnos con reserva confirmada recibirán una notificación y un correo si el servicio está disponible.");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoHorario(false);
    }
  }

  async function subirPdf(event, clase) {
    const input = event.currentTarget;
    const archivo = input.files?.[0];
    input.value = "";
    if (!archivo) return;

    if (archivo.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF.");
      return;
    }
    if (archivo.size > MAX_PDF) {
      setError("Cada PDF puede pesar como máximo 4 MB.");
      return;
    }
    if (obtenerMaterialesPdf(clase).length >= MAX_PDFS) {
      setError("Esta clase ya tiene el máximo de 3 archivos PDF.");
      return;
    }

    setError("");
    setMensaje("");
    setSubiendoMaterial(clase.id_clase);
    try {
      const respuesta = await subirMaterialClase(clase.id_clase, archivo);
      setClases((actuales) => actuales.map((item) => item.id_clase === clase.id_clase
        ? { ...item, materialesPdf: [...obtenerMaterialesPdf(item), respuesta.material] }
        : item));
      setMensaje(`Se agregó "${respuesta.material.nombre}" a la clase.`);
    } catch (err) {
      setError(err.message || "No se pudo subir el PDF.");
    } finally {
      setSubiendoMaterial(null);
    }
  }

  async function reemplazarPdf(event, clase, material) {
    const input = event.currentTarget;
    const archivo = input.files?.[0];
    input.value = "";
    if (!archivo) return;

    if (archivo.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF.");
      return;
    }
    if (archivo.size > MAX_PDF) {
      setError("Cada PDF puede pesar como máximo 4 MB.");
      return;
    }
    if (!window.confirm(`¿Querés reemplazar "${material.nombre}" por "${archivo.name}"?`)) return;

    setError("");
    setMensaje("");
    setActualizandoMaterial(`${clase.id_clase}:${material.id_material}`);
    try {
      const respuesta = await reemplazarMaterialClase(clase.id_clase, material.id_material, archivo);
      setClases((actuales) => actuales.map((item) => item.id_clase === clase.id_clase
        ? {
          ...item,
          materialesPdf: obtenerMaterialesPdf(item).map((actual) => actual.id_material === material.id_material
            ? respuesta.material
            : actual),
        }
        : item));
      setMensaje(respuesta.advertencia || `Se reemplazó "${material.nombre}" por "${respuesta.material.nombre}".`);
    } catch (err) {
      setError(err.message || "No se pudo reemplazar el PDF.");
    } finally {
      setActualizandoMaterial(null);
    }
  }

  async function borrarPdf(clase, material) {
    if (!window.confirm(`¿Querés quitar "${material.nombre}" de esta clase? Los alumnos dejarán de verlo.`)) return;

    setError("");
    setMensaje("");
    setActualizandoMaterial(`${clase.id_clase}:${material.id_material}`);
    try {
      const respuesta = await eliminarMaterialClase(clase.id_clase, material.id_material);
      setClases((actuales) => actuales.map((item) => item.id_clase === clase.id_clase
        ? {
          ...item,
          materialesPdf: obtenerMaterialesPdf(item).filter((actual) => actual.id_material !== material.id_material),
          materialUrl: item.materialUrl === material.url ? null : item.materialUrl,
          materialNombre: item.materialUrl === material.url ? null : item.materialNombre,
        }
        : item));
      setMensaje(respuesta.advertencia || `"${material.nombre}" se quitó de la clase. Los alumnos ya no podrán acceder al PDF.`);
    } catch (err) {
      setError(err.message || "No se pudo quitar el PDF.");
    } finally {
      setActualizandoMaterial(null);
    }
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
        {mensaje && <p className="res-ok" role="status">{mensaje}</p>}
        {cargando && <p className="res-mensaje">Cargando clases…</p>}
        {!cargando && !clases.length && (
          <p className="res-mensaje">No tenés clases {historial ? "registradas" : "próximas"}.</p>
        )}

        <ul className="res-lista">
          {clases.map((clase) => (
            <li key={clase.id_clase} className="res-item clases-profesor-item">
              <div>
                <h2>{clase.titulo}</h2>
                <p>{clase.materia} · {clase.tema}</p>
                <p>{formatearFecha(clase.inicio)} · {formatearHora(clase.inicio)} a {formatearHora(clase.fin)}</p>
                <p>
                  {clase.alumnos.length
                    ? `Alumnos: ${clase.alumnos.map((alumno) => alumno.nombre).join(", ")}`
                    : "Sin alumnos inscriptos"}
                </p>
                <div className="clases-profesor-materiales">
                  <strong>PDF de la clase ({obtenerMaterialesPdf(clase).length}/{MAX_PDFS})</strong>
                  {obtenerMaterialesPdf(clase).length > 0 && (
                    <ul>
                      {obtenerMaterialesPdf(clase).map((material) => (
                        <li key={material.id_material || material.url} className="clases-profesor-material-item">
                          <a href={material.url} target="_blank" rel="noreferrer" className="clases-profesor-material-link">
                            Ver {material.nombre}
                          </a>
                          {material.id_material && (
                            <div className="clases-profesor-material-acciones">
                              <label className="clases-profesor-accion-pdf">
                                {actualizandoMaterial === `${clase.id_clase}:${material.id_material}` ? "Procesando…" : "Reemplazar"}
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(event) => reemplazarPdf(event, clase, material)}
                                  disabled={actualizandoMaterial !== null || subiendoMaterial !== null}
                                />
                              </label>
                              <button
                                type="button"
                                className="clases-profesor-eliminar-pdf"
                                onClick={() => borrarPdf(clase, material)}
                                disabled={actualizandoMaterial !== null || subiendoMaterial !== null}
                              >
                                Quitar
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {obtenerMaterialesPdf(clase).length < MAX_PDFS && (
                    <label className="clases-profesor-subir-pdf">
                      {subiendoMaterial === clase.id_clase ? "Subiendo PDF…" : "+ Agregar PDF"}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(event) => subirPdf(event, clase)}
                        disabled={subiendoMaterial !== null || actualizandoMaterial !== null}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="res-item-lado">
                <span className={`res-estado ${clase.estado}`}>{clase.estado}</span>
                <small>{formatearPrecio(clase.precio)}</small>
                {!historial && (
                  <button
                    type="button"
                    className="res-boton-secundario"
                    onClick={() => claseEditando === clase.id_clase ? setClaseEditando(null) : editarHorario(clase)}
                  >
                    {claseEditando === clase.id_clase ? "Cancelar edición" : "Cambiar horario"}
                  </button>
                )}
              </div>
              {claseEditando === clase.id_clase && (
                <form className="clase-horario-edicion" onSubmit={(event) => guardarHorario(event, clase)}>
                  <header className="clase-horario-encabezado">
                    <span className="clase-horario-paso">EDITAR CLASE</span>
                    <h3>Cambiar fecha y horario</h3>
                    <p>Elegí el nuevo día y horario. Los alumnos confirmados recibirán una notificación.</p>
                  </header>
                  <div className="clase-horario-actual">
                    <span>Horario actual</span>
                    <strong>{formatearFecha(clase.inicio)} · {formatearHora(clase.inicio)} a {formatearHora(clase.fin)}</strong>
                  </div>
                  <h4 className="clase-horario-subtitulo">Nuevo horario</h4>
                  <div className="clase-horario-campos">
                    <label>
                      Fecha de inicio
                      <input
                        className="res-campo"
                        type="date"
                        required
                        value={nuevoHorario.fechaInicio}
                        onChange={(event) => setNuevoHorario((actual) => ({ ...actual, fechaInicio: event.target.value }))}
                      />
                    </label>
                    <label>
                      Hora de inicio
                      <input
                        className="res-campo"
                        type="time"
                        required
                        value={nuevoHorario.horaInicio}
                        onChange={(event) => setNuevoHorario((actual) => ({ ...actual, horaInicio: event.target.value }))}
                      />
                    </label>
                    <label>
                      Fecha de fin
                      <input
                        className="res-campo"
                        type="date"
                        required
                        value={nuevoHorario.fechaFin}
                        onChange={(event) => setNuevoHorario((actual) => ({ ...actual, fechaFin: event.target.value }))}
                      />
                    </label>
                    <label>
                      Hora de fin
                      <input
                        className="res-campo"
                        type="time"
                        required
                        value={nuevoHorario.horaFin}
                        onChange={(event) => setNuevoHorario((actual) => ({ ...actual, horaFin: event.target.value }))}
                      />
                    </label>
                  </div>
                  <p className="clase-horario-aviso">
                    Al confirmar, se actualizará la clase y se enviará un aviso a los alumnos inscriptos.
                  </p>
                  <div className="clase-horario-acciones">
                    <button className="res-boton clase-horario-guardar" type="submit" disabled={guardandoHorario}>
                      {guardandoHorario ? "Guardando cambio…" : "Confirmar cambio de horario"}
                    </button>
                    <button
                      className="res-boton-secundario clase-horario-cancelar"
                      type="button"
                      onClick={() => setClaseEditando(null)}
                      disabled={guardandoHorario}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
