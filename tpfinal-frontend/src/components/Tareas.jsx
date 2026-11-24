import { useEffect, useState } from "react";
import { solicitarTareas } from "../services/api";
import Calendario from "./Calendario";
import "../styles/tareas.css";

const boton = "res-boton res-boton-chico";
const tipos = ["application/pdf", "image/jpeg", "image/png"];
const fecha = valor => new Date(valor).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
function fechaCampo(valor) {
  return valor ? new Date(Date.parse(valor) - 3 * 3600000).toISOString().slice(0, 16) : "";
}

function validarArchivo(archivo) {
  if (!tipos.includes(archivo.type) || archivo.size > 4 * 1024 * 1024) {
    throw new Error("Elegí un PDF, JPG o PNG de hasta 4 MB.");
  }
}

function subirArchivo(ruta, archivo) {
  const datos = new FormData();
  datos.append("archivo", archivo);
  return solicitarTareas(ruta, "POST", datos);
}

function FechaLimite({ inicial }) {
  const hoy = fechaCampo(new Date()).slice(0, 10);
  const [dia, setDia] = useState(inicial.slice(0, 10));
  const [hora, setHora] = useState(inicial.slice(11) || "23:59");
  const [abierto, setAbierto] = useState(false);
  const resumen = dia && new Date(dia + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });

  return <fieldset className="tarea-plazo">
    <legend>Fecha límite</legend>
    <input type="hidden" name="fechaLimite" value={dia ? dia + "T" + hora : ""}/>
    <div className="tarea-plazo-fila">
      <button type="button" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
        {resumen || "Elegir fecha"}
      </button>
      {dia && <label>Hora argentina
        <input className="res-campo" aria-label="Hora argentina, en formato de 24 horas"
          placeholder="HH:MM" pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
          title="Ingresá la hora en formato de 24 horas, por ejemplo 18:30"
          maxLength={5} required value={hora} onChange={e => setHora(e.target.value)}/>
      </label>}
      {dia && <button type="button" onClick={() => { setDia(""); setHora("23:59"); setAbierto(false); }}>Quitar fecha</button>}
    </div>
    {abierto && <Calendario seleccionada={dia || hoy} minimo={inicial && inicial.slice(0, 10) < hoy ? inicial.slice(0, 10) : hoy}
      maximo="9999-12-31" onSeleccionar={setDia}/>}
  </fieldset>;
}

function Editor({ tarea, clase, guardar }) {
  const [reinicio, reiniciar] = useState(0);
  function enviar(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const campos = new FormData(form);
    guardar(async () => {
      const datos = {
        titulo: campos.get("titulo").trim(),
        descripcion: campos.get("descripcion").trim(),
        fechaLimite: campos.get("fechaLimite") || (tarea ? null : undefined),
      };
      if (!datos.titulo) throw new Error("Escribí un título.");
      if (!tarea) {
        datos.id_clase = clase.id_clase;
        datos.id_alumno = campos.getAll("alumno");
        if (!datos.id_alumno.length || datos.id_alumno.length > 50) throw new Error("Elegí entre 1 y 50 alumnos.");
      }
      if (tarea) {
        await solicitarTareas("/" + tarea.id_tarea, "PATCH", datos);
        return;
      }
      const archivos = Array.from(form.elements.adjuntos.files);
      if (archivos.length > 3) throw new Error("Podés adjuntar hasta 3 archivos.");
      archivos.forEach(validarArchivo);

      const { tarea: publicada } = await solicitarTareas("", "POST", datos);
      form.reset();
      reiniciar(n => n + 1);
      const fallidos = [];
      for (const archivo of archivos) {
        try {
          await subirArchivo("/" + publicada.id_tarea + "/adjuntos", archivo);
        } catch (err) {
          fallidos.push(archivo.name + " (" + err.message + ")");
        }
      }
      if (fallidos.length) {
        return "Tarea publicada. Revisá los adjuntos en su tarjeta. Hubo un problema al subir: " + fallidos.join(", ");
      }
    }, tarea ? "Cambios guardados." : "Tarea publicada.");
  }
  return <details className="tarea-editor"><summary>{tarea ? "Editar tarea" : "Nueva tarea"}</summary>
    <form onSubmit={enviar}>
      <label>Título<input className="res-campo" name="titulo" defaultValue={tarea?.titulo} required maxLength={100}/></label>
      <label>Consigna<textarea className="res-campo" name="descripcion" defaultValue={tarea?.descripcion} maxLength={1000}/></label>
      <FechaLimite key={reinicio} inicial={fechaCampo(tarea?.fechaLimite)}/>
      {!tarea && <label className="tarea-adjuntos">Archivos de la consigna <small>Hasta 3 PDF, JPG o PNG de 4 MB cada uno</small>
        <input name="adjuntos" type="file" multiple accept={tipos.join(",")}/>
      </label>}
      {!tarea && <fieldset className="tarea-alumnos"><legend>Asignar a</legend>{clase.alumnos.map(a =>
        <label key={a.id_alumno}><input name="alumno" type="checkbox" value={a.id_alumno}/> {a.nombre}</label>
      )}{!clase.alumnos.length && <p>Todavía no hay alumnos confirmados.</p>}</fieldset>}
      <button className={boton} disabled={!tarea && !clase.alumnos.length}>{tarea ? "Guardar cambios" : "Publicar tarea"}</button>
    </form>
  </details>;
}

function SelectorArchivo({ ruta, guardar, etiqueta }) {
  function adjuntar(e) {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    guardar(() => {
      validarArchivo(archivo);
      return subirArchivo(ruta, archivo);
    }, "Archivo adjuntado.");
  }
  return <label>{etiqueta} (hasta 3 PDF, JPG o PNG de 4 MB cada uno)
    <input type="file" accept={tipos.join(",")} onChange={adjuntar}/>
  </label>;
}

function AdjuntosConsigna({ tarea, profesor, guardar }) {
  const adjuntos = tarea.adjuntos ?? [];
  if (!profesor && !adjuntos.length) return null;
  const ruta = "/" + tarea.id_tarea + "/adjuntos";
  return <section>
    <h4>Archivos de la consigna</h4>
    {adjuntos.map(archivo => <div key={archivo.id_adjunto}>
      <a href={archivo.url} target="_blank" rel="noreferrer">{archivo.nombre}</a>{" "}
      {profesor && <button type="button" aria-label={"Quitar " + archivo.nombre}
        onClick={() => guardar(() => solicitarTareas(ruta + "/" + archivo.id_adjunto, "DELETE"), "Adjunto quitado.")}>
        Quitar
      </button>}
    </div>)}
    {profesor && adjuntos.length < 3 && <SelectorArchivo ruta={ruta} guardar={guardar} etiqueta="Adjuntar a la consigna"/>}
  </section>;
}

function Entrega({ asignacion, profesor, id, guardar }) {
  const { nombre, id_alumno, archivos, entregaTexto, nota, comentario, entregadaEn } = asignacion;
  const editable = !profesor && nota == null;
  const ruta = "/" + id;
  function enviar(e) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    if (profesor) {
      guardar(() => solicitarTareas(ruta + "/alumnos/" + id_alumno + "/nota", "POST", {
        nota: Number(datos.get("nota")), comentario: datos.get("comentario")
      }), "Calificación guardada.");
    } else {
      guardar(() => {
        const texto = datos.get("texto").trim();
        if (!archivos.length && !texto) throw new Error("Escribí una respuesta o adjuntá un archivo.");
        return solicitarTareas(ruta + "/entregar", "POST", { entregaTexto: texto });
      }, "Entrega guardada.");
    }
  }
  return <section>
    {profesor && <h4>{nombre}</h4>}
    <p>{entregadaEn ? "Entregada el " + fecha(entregadaEn) : "Sin entregar"}{nota != null && <strong> · Nota {nota}/10</strong>}</p>
    {comentario && <p>Devolución: {comentario}</p>}
    {!editable && entregaTexto && <p>{entregaTexto}</p>}
    {archivos.map(f => <div key={f.id_archivo}><a href={f.url} target="_blank" rel="noreferrer">{f.nombre}</a>{" "}
      {editable && <button type="button" onClick={() => guardar(() => solicitarTareas(ruta + "/archivos/" + f.id_archivo, "DELETE"), "Archivo quitado.")}>Quitar</button>}</div>)}
    {editable && archivos.length < 3 && <SelectorArchivo ruta={ruta + "/archivos"} guardar={guardar} etiqueta="Adjuntar a tu entrega"/>}
    {(editable || (profesor && entregadaEn)) && <form onSubmit={enviar}>
      {profesor ? <>
        <label>Nota<input className="res-campo" type="number" name="nota" min="0" max="10" step="any" defaultValue={nota} required/></label>
        <label>Devolución<textarea className="res-campo" name="comentario" defaultValue={comentario} maxLength={500}/></label>
      </> : <label>Tu respuesta<textarea className="res-campo" name="texto" defaultValue={entregaTexto} maxLength={5000}/></label>}
      <button className={boton}>{profesor ? "Guardar nota" : entregadaEn ? "Actualizar entrega" : "Entregar tarea"}</button>
    </form>}
  </section>;
}

function Lista({ clase }) {
  const [items, setItems] = useState(null);
  const [pendientes, setPendientes] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [revision, recargar] = useState(0);
  const ruta = clase ? "/clase/" + clase.id_clase : "/misTareas?pendientes=" + pendientes;
  useEffect(() => {
    let vigente = true;
    solicitarTareas(ruta).then(data => {
      if (vigente) setItems(data.tareas ?? data.tarea);
    }).catch(err => { if (vigente) setError(err.message); });
    return () => { vigente = false; };
  }, [ruta, revision]);
  async function guardar(accion, aviso) {
    setError(""); setMensaje(""); setOcupado(true);
    try {
      const resultado = await accion();
      setMensaje(typeof resultado === "string" ? resultado : aviso);
      const data = await solicitarTareas(ruta);
      setItems(data.tareas ?? data.tarea);
    } catch (err) { setError(err.message); }
    finally { setOcupado(false); }
  }
  return <div className="panel-tareas">
    {error && <p className="res-error" role="alert">{error} <button onClick={() => { setError(""); recargar(n => n + 1); }}>Recargar</button></p>}
    {mensaje && <p role="status">{mensaje}</p>}
    <fieldset disabled={ocupado}>
      {clase ? <Editor clase={clase} guardar={guardar}/> : <label><input type="checkbox" checked={pendientes} onChange={e => {
        setPendientes(e.target.checked); setItems(null); setError(""); setMensaje("");
      }}/> Solo pendientes</label>}
      {!items && !error && <p>Cargando tareas…</p>}
      {items?.length === 0 && <p>{pendientes ? "No tenés tareas pendientes." : "Todavía no hay tareas."}</p>}
      {items?.map(item => {
        const tarea = clase ? item : item.tarea;
        return <article key={tarea.id_tarea} className="res-tarjeta">
          {tarea.clase && <small>{tarea.clase.titulo}</small>}
          <h3>{tarea.titulo}</h3>
          {tarea.descripcion && <p>{tarea.descripcion}</p>}
          {tarea.fechaLimite && <p>Fecha límite: {fecha(tarea.fechaLimite)} (Argentina)</p>}
          <AdjuntosConsigna tarea={tarea} profesor={Boolean(clase)} guardar={guardar}/>
          {clase && <Editor tarea={tarea} clase={clase} guardar={guardar}/>}
          {(clase ? tarea.asignaciones : [item]).map(a =>
            <Entrega key={a.id_alumno || tarea.id_tarea} asignacion={a} profesor={Boolean(clase)} id={tarea.id_tarea} guardar={guardar}/>
          )}
        </article>;
      })}
    </fieldset>
  </div>;
}

export default function Tareas({ clase }) {
  const [abierto, setAbierto] = useState(false);
  return <section><button type="button" className={boton} aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
    {clase ? "Tareas de la clase" : "Mis tareas"}
  </button>{abierto && <Lista clase={clase}/>}</section>;
}
