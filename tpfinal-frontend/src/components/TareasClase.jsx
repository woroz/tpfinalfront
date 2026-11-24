import { useRef, useState } from "react";
import {
  calificarTarea,
  crearTarea,
  entregarTarea,
  obtenerTareasClase,
  quitarArchivoEntrega,
  subirArchivoTarea,
} from "../services/api";
import { interpretarNota, prepararEntrega, prepararTarea, validarArchivos, validarListaTareas } from "../utils/tareas";
import "../styles/tareasClase.css";

export default function TareasClase({ idClase, esProfesor = false, alumnos = [] }) {
  const [abierto, setAbierto] = useState(false);
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function actualizar() {
    setCargando(true);
    try {
      const resultado = await obtenerTareasClase(idClase);
      validarListaTareas(resultado.tarea, esProfesor);
      setTareas(resultado.tarea);
      setError("");
    } catch (err) {
      setError(`${err.message || "No se pudieron cargar las tareas."} Los datos mostrados pueden estar desactualizados.`);
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="tareas-clase">
      <button type="button" className="tareas-boton" aria-expanded={abierto} onClick={() => {
        if (!abierto) void actualizar();
        setAbierto((valor) => !valor);
      }}>
        {abierto ? "Ocultar tareas" : esProfesor ? "Tareas y entregas de la clase" : "Ver mis tareas"}
      </button>
      {abierto && (
        <div className="tareas-contenido">
          <h3>Tareas de la clase</h3>
          <p>{esProfesor ? "Asigná tareas y calificá las entregas de tus alumnos." : "Consultá tus tareas, entregá tus respuestas y revisá tus notas."}</p>
          {error && <p className="res-error" role="alert">{error}</p>}
          {cargando && <p role="status">Actualizando tareas…</p>}
          <button type="button" className="tareas-boton-secundario" disabled={cargando} onClick={() => void actualizar()}>Actualizar tareas</button>
          {esProfesor && <NuevaTarea idClase={idClase} alumnos={alumnos} actualizar={actualizar} existe={tareas.length > 0} deshabilitado={cargando || Boolean(error)} />}
          {!cargando && !error && !tareas.length && <p>{esProfesor ? "Todavía no asignaste tareas en esta clase." : "No tenés tareas asignadas en esta clase."}</p>}
          {tareas.map((item) => esProfesor
            ? <TareaProfesor key={item.id_tarea} tarea={item} actualizar={actualizar} deshabilitado={cargando || Boolean(error)} />
            : <TareaAlumno key={item.tarea.id_tarea} item={item} actualizar={actualizar} deshabilitado={cargando || Boolean(error)} />)}
        </div>
      )}
    </section>
  );
}

function NuevaTarea({ idClase, alumnos, actualizar, deshabilitado, existe }) {
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [publicada, setPublicada] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const bloqueo = useRef(false);

  async function subirPendientes(id, pendientes) {
    const fallidos = [];
    for (const archivo of pendientes) {
      try {
        await subirArchivoTarea(id, archivo, "adjuntos");
      } catch (err) {
        fallidos.push({ archivo, error: err.message || "No se pudo subir el archivo." });
      }
    }
    await actualizar();
    if (fallidos.length) {
      setPublicada({ id, pendientes: fallidos });
      setError("La tarea ya fue publicada, pero algunos archivos no se pudieron subir.");
    } else {
      setPublicada(null);
      setTitulo("");
      setDescripcion("");
      setFecha("");
      setSeleccionados([]);
      setArchivos([]);
      setAviso("La tarea fue publicada para los alumnos seleccionados.");
      setAbierto(false);
    }
  }

  async function publicar(event) {
    event.preventDefault();
    if (bloqueo.current || deshabilitado) return;
    try {
      const datos = prepararTarea(idClase, titulo, descripcion, seleccionados, fecha);
      validarArchivos(archivos);
      bloqueo.current = true;
      setOcupado(true);
      setError("");
      setAviso("");
      const existentes = (await obtenerTareasClase(idClase)).tarea;
      validarListaTareas(existentes, true);
      if (existentes.length) {
        await actualizar();
        throw new Error("Esta clase ya tiene una tarea asignada.");
      }
      const respuesta = await crearTarea(datos);
      const id = respuesta.tarea?.id_tarea;
      setPublicada({ id: id || null, pendientes: [] });
      await actualizar();
      if (!id) throw new Error("La tarea fue aceptada, pero falta su identificador. Revisá la lista antes de crearla nuevamente.");
      await subirPendientes(id, archivos);
    } catch (err) {
      setError(`${err.message || "No se pudo publicar la tarea."} Si se interrumpió la conexión, revisá la lista antes de volver a enviarla.`);
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  async function reintentar() {
    if (!publicada?.id || bloqueo.current || deshabilitado) return;
    bloqueo.current = true;
    setOcupado(true);
    setError("");
    try {
      await subirPendientes(publicada.id, publicada.pendientes.map((item) => item.archivo));
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  return (
    <div className="tareas-nueva">
      {aviso && <p className="res-ok" role="status">{aviso}</p>}
      {!abierto ? existe ? <p>Esta clase ya tiene una tarea asignada.</p> : <button type="button" className="tareas-boton" disabled={deshabilitado} onClick={() => { setAviso(""); setAbierto(true); }}>Crear tarea</button> : (
        <div>
          <h4>Nueva tarea</h4>
          {error && <p className="res-error" role="alert">{error}</p>}
          {publicada ? (
            <>
              {publicada.pendientes.length > 0 && <p>Un archivo podría haberse subido antes de interrumpirse la conexión. Revisá la tarea antes de reintentar.</p>}
              {publicada.pendientes.map(({ archivo, error: detalle }, indice) => <p key={`${archivo.name}-${indice}`}>{archivo.name}: {detalle}</p>)}
              {publicada.id && publicada.pendientes.length > 0 && <button type="button" className="tareas-boton" disabled={ocupado || deshabilitado} onClick={() => void reintentar()}>Reintentar archivos pendientes</button>}
              <button type="button" className="tareas-boton-secundario" disabled={ocupado} onClick={() => {
                setPublicada(null); setAbierto(false); setTitulo(""); setDescripcion(""); setFecha(""); setSeleccionados([]); setArchivos([]); setError("");
              }}>Terminar</button>
            </>
          ) : (
            <form className="tareas-form" onSubmit={publicar}>
              <label>Título<input value={titulo} onChange={(event) => setTitulo(event.target.value)} maxLength={100} required /></label>
              <label>Consigna (opcional)<textarea value={descripcion} onChange={(event) => setDescripcion(event.target.value)} maxLength={1000} rows={3} /></label>
              <label>Fecha límite (opcional)<input type="datetime-local" value={fecha} onChange={(event) => setFecha(event.target.value)} /></label>
              <fieldset><legend>Alumnos confirmados</legend>
                {!alumnos.length && <p>No hay alumnos confirmados en esta clase.</p>}
                {alumnos.length > 0 && <button type="button" className="tareas-boton-secundario" disabled={ocupado} onClick={() => {
                  if (alumnos.length > 50) { setError("Solo se pueden seleccionar hasta 50 alumnos por tarea."); return; }
                  setError("");
                  setSeleccionados((actual) => actual.length === alumnos.length ? [] : alumnos.map((alumno) => alumno.id_alumno));
                }}>{seleccionados.length === alumnos.length ? "Desmarcar todos" : "Seleccionar todos"}</button>}
                {alumnos.map((alumno) => <label className="tareas-check" key={alumno.id_alumno}>
                  <input type="checkbox" checked={seleccionados.includes(alumno.id_alumno)} onChange={(event) => {
                    const seleccionado = event.target.checked;
                    setSeleccionados((actual) => seleccionado
                      ? [...actual, alumno.id_alumno] : actual.filter((id) => id !== alumno.id_alumno));
                  }} /> {alumno.nombre}
                </label>)}
              </fieldset>
              <div className="tareas-campo-archivo"><span>Adjuntos (opcional)</span><label className="tareas-selector-archivo"><span className="tareas-selector-boton">Elegir archivos</span><span className="tareas-selector-nombre">{archivos.length ? archivos.map((archivo) => archivo.name).join(", ") : "Ningún archivo seleccionado"}</span><input aria-label="Adjuntos (opcional)" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple disabled={ocupado} onChange={(event) => {
                try { setArchivos(validarArchivos(Array.from(event.target.files))); setError(""); }
                catch (err) { setArchivos([]); event.target.value = ""; setError(err.message); }
              }} /></label></div>
              <small>Hasta 3 archivos PDF, JPG o PNG de 4 MB cada uno.</small>
              <div className="tareas-acciones"><button className="tareas-boton" type="submit" disabled={ocupado || deshabilitado || existe || !alumnos.length}>{ocupado ? "Publicando…" : "Publicar tarea"}</button>
                <button className="tareas-boton-secundario" type="button" disabled={ocupado} onClick={() => setAbierto(false)}>Cerrar</button></div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function Archivos({ archivos, etiqueta, quitar, deshabilitado }) {
  return archivos.map((archivo, indice) => (
    <div className="tareas-archivo" key={archivo.id_adjunto || archivo.id_archivo || indice}>
      {typeof archivo.url === "string" && /^https:\/\//i.test(archivo.url)
        ? <a href={archivo.url} target="_blank" rel="noopener noreferrer">{etiqueta}: {archivo.nombre}</a>
        : <span>El archivo {archivo.nombre} no tiene una dirección segura.</span>}
      {quitar && <button type="button" className="tareas-boton-secundario" disabled={deshabilitado} onClick={() => quitar(archivo)}>Quitar archivo</button>}
    </div>
  ));
}

function TareaProfesor({ tarea, actualizar, deshabilitado }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <article className="tareas-tarjeta">
      <button type="button" className="tareas-desplegable" aria-expanded={abierta} onClick={() => setAbierta((valor) => !valor)}>
        {tarea.titulo} {abierta ? "▴" : "▾"}<span>{tarea.asignaciones.filter((entrega) => entrega.entregadaEn).length} de {tarea.asignaciones.length} entregadas</span>
      </button>
      {abierta && <>
      {tarea.descripcion && <p>{tarea.descripcion}</p>}
      {tarea.fechaLimite && <p>Fecha límite: {new Date(tarea.fechaLimite).toLocaleString("es-AR")}</p>}
      <Archivos archivos={tarea.adjuntos} etiqueta="Consigna" />
      {!tarea.asignaciones.length && <p>No hay alumnos asignados.</p>}
      {tarea.asignaciones.map((entrega) => <CalificarEntrega key={entrega.id_alumno} idTarea={tarea.id_tarea} entrega={entrega} actualizar={actualizar} deshabilitado={deshabilitado} />)}
      </>}
    </article>
  );
}

function CalificarEntrega({ idTarea, entrega, actualizar, deshabilitado }) {
  const [editando, setEditando] = useState(false);
  const [nota, setNota] = useState("");
  const [comentario, setComentario] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const bloqueo = useRef(false);
  async function guardar(event) {
    event.preventDefault();
    if (bloqueo.current || deshabilitado) return;
    let enviada = false;
    try {
      if (!entrega.entregadaEn) throw new Error("El alumno debe entregar la tarea antes de recibir una nota.");
      const valor = interpretarNota(nota);
      if (comentario.trim().length > 500) throw new Error("La devolución puede tener hasta 500 caracteres.");
      bloqueo.current = true; setOcupado(true); setError(""); enviada = true;
      await calificarTarea(idTarea, entrega.id_alumno, valor, comentario.trim());
      setEditando(false);
      await actualizar();
    } catch (err) {
      setError(`${err.message || "No se pudo guardar la nota."}${enviada ? " Revisá la nota antes de reintentar si se interrumpió la conexión." : ""}`);
      if (enviada) await actualizar();
    } finally {
      bloqueo.current = false; setOcupado(false);
    }
  }
  return (
    <div className="tareas-entrega">
      <strong>{entrega.nombre}</strong>
      <p>Estado: {entrega.nota != null ? "Calificada" : entrega.entregadaEn ? "Entregada" : "Sin entregar"}</p>
      {entrega.entregaTexto && <p className="tareas-respuesta">Respuesta: {entrega.entregaTexto}</p>}
      <Archivos archivos={entrega.archivos} etiqueta="Entrega" />
      {entrega.nota != null && <p className="tareas-nota">Nota: {entrega.nota}/10</p>}
      {entrega.comentario && <p>Devolución: {entrega.comentario}</p>}
      {error && <p className="res-error" role="alert">{error}</p>}
      {!entrega.entregadaEn ? <p>Podrás calificar cuando el alumno entregue la tarea.</p> : editando ? (
        <form className="tareas-form" onSubmit={guardar}>
          <label>Nota (0 a 10)<input type="number" min="0" max="10" step="any" value={nota} onChange={(event) => setNota(event.target.value)} required /></label>
          <label>Devolución (opcional)<textarea value={comentario} onChange={(event) => setComentario(event.target.value)} maxLength={500} /></label>
          <div className="tareas-acciones"><button className="tareas-boton" disabled={ocupado || deshabilitado}>Guardar nota</button>
            <button type="button" className="tareas-boton-secundario" disabled={ocupado} onClick={() => setEditando(false)}>Cancelar</button></div>
        </form>
      ) : <button type="button" className="tareas-boton-secundario" disabled={deshabilitado} onClick={() => {
        setNota(entrega.nota == null ? "" : String(entrega.nota)); setComentario(entrega.comentario || ""); setError(""); setEditando(true);
      }}>{entrega.nota == null ? "Calificar entrega" : "Modificar nota"}</button>}
    </div>
  );
}

export function TareaAlumno({ item, actualizar, deshabilitado }) {
  const [abierta, setAbierta] = useState(!item.entregadaEn);
  const [texto, setTexto] = useState("");
  const [editado, setEditado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const bloqueo = useRef(false);
  const id = item.tarea.id_tarea;

  async function ejecutar(accion, mensaje) {
    if (bloqueo.current || deshabilitado) return;
    bloqueo.current = true; setOcupado(true); setError(""); setAviso("");
    try {
      await accion();
      setAviso(mensaje);
      await actualizar();
    } catch (err) {
      setError(`${err.message || "No se pudo completar la operación."} Si se interrumpió la conexión, revisá la tarea antes de reintentar.`);
      await actualizar();
    } finally {
      bloqueo.current = false; setOcupado(false);
    }
  }

  return (
    <article className="tareas-tarjeta">
      <button type="button" className="tareas-desplegable" aria-expanded={abierta} onClick={() => setAbierta((valor) => !valor)}>
        {item.tarea.titulo} {abierta ? "▴" : "▾"}<span>Estado: {item.nota != null ? "Calificada" : item.entregadaEn ? "Entregada" : "Sin entregar"}</span>
      </button>
      {item.nota != null && <p className="tareas-nota">Nota: {item.nota}/10</p>}
      {aviso && <p className="res-ok" role="status">{aviso}</p>}
      {abierta && <>
      {item.tarea.descripcion && <p>{item.tarea.descripcion}</p>}
      {item.tarea.fechaLimite && <p>Fecha límite: {new Date(item.tarea.fechaLimite).toLocaleString("es-AR")}</p>}
      <Archivos archivos={item.tarea.adjuntos} etiqueta="Consigna" />
      {item.comentario && <p>Devolución: {item.comentario}</p>}
      {error && <p className="res-error" role="alert">{error}</p>}
      {item.nota == null ? (
        <div className="tareas-form">
          <label>Tu respuesta<textarea maxLength={5000} value={editado ? texto : item.entregaTexto || ""} disabled={ocupado || deshabilitado} onChange={(event) => { setTexto(event.target.value); setEditado(true); }} /></label>
          <Archivos archivos={item.archivos} etiqueta="Tu archivo" deshabilitado={ocupado || deshabilitado} quitar={(archivo) => {
            if (!archivo.id_archivo) { setError("No se puede identificar el archivo."); return; }
            if (item.entregadaEn && !item.entregaTexto?.trim() && item.archivos.length === 1) {
              setError("Para quitar el último archivo, primero actualizá la entrega con una respuesta o adjuntá otro archivo."); return;
            }
            if (window.confirm(`¿Querés quitar ${archivo.nombre} de tu entrega?`)) void ejecutar(() => quitarArchivoEntrega(id, archivo.id_archivo), "Archivo quitado.");
          }} />
          {item.archivos.length < 3 && <div className="tareas-campo-archivo"><span>Adjuntar archivo</span><label className="tareas-selector-archivo"><span className="tareas-selector-boton">Elegir archivo</span><span className="tareas-selector-nombre">PDF, JPG o PNG</span><input aria-label="Adjuntar archivo" type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={ocupado || deshabilitado} onChange={(event) => {
            const archivo = event.target.files[0]; event.target.value = "";
            if (!archivo) return;
            void ejecutar(async () => { validarArchivos([archivo]); await subirArchivoTarea(id, archivo, "archivos"); },
              item.entregadaEn ? "Archivo adjuntado a tu entrega." : "Archivo adjuntado. Para completar la entrega, tocá Entregar tarea.");
          }} /></label></div>}
          <small>Hasta 3 archivos PDF, JPG o PNG de 4 MB cada uno.</small>
          <button type="button" className="tareas-boton" disabled={ocupado || deshabilitado} onClick={() => void ejecutar(async () => {
            const respuesta = prepararEntrega(editado ? texto : item.entregaTexto || "", item.archivos.length);
            await entregarTarea(id, respuesta); setEditado(false); setAbierta(false);
          }, "Tu tarea fue entregada.")}>{ocupado ? "Procesando…" : item.entregadaEn ? "Actualizar entrega" : "Entregar tarea"}</button>
        </div>
      ) : (
        <>{item.entregaTexto && <p className="tareas-respuesta">Tu respuesta: {item.entregaTexto}</p>}<Archivos archivos={item.archivos} etiqueta="Tu archivo" /><p>La entrega ya fue calificada y no se puede modificar.</p></>
      )}
      </>}
    </article>
  );
}
