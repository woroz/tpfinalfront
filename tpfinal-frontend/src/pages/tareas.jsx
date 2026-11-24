import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { TareaAlumno } from "../components/TareasClase";
import { obtenerMisTareas } from "../services/api";
import { validarMisTareas } from "../utils/tareas";

async function consultarTareas() {
  const resultado = await obtenerMisTareas();
  validarMisTareas(resultado.tareas);
  return resultado.tareas;
}

export default function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const montado = useRef(false);

  const actualizar = useCallback(async () => {
    setCargando(true);
    try {
      const resultado = await consultarTareas();
      if (montado.current) {
        setTareas(resultado);
        setError("");
      }
    } catch (err) {
      if (montado.current) setError(`${err.message || "No se pudieron cargar las tareas."} Los datos mostrados pueden estar desactualizados.`);
    } finally {
      if (montado.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    let activo = true;
    consultarTareas().then((resultado) => {
      if (activo) setTareas(resultado);
    }).catch((err) => {
      if (activo) setError(err.message || "No se pudieron cargar las tareas.");
    }).finally(() => {
      if (activo) setCargando(false);
    });
    return () => { activo = false; montado.current = false; };
  }, []);

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor">
        <header className="res-encabezado">
          <h1>Mis tareas</h1>
          <p>Consultá y entregá las tareas de todas tus clases.</p>
        </header>
        <div className="tareas-clase tareas-contenido">
          <button type="button" className="tareas-boton-secundario" disabled={cargando} onClick={() => void actualizar()}>Actualizar tareas</button>
          {cargando && <p role="status">Cargando tareas…</p>}
          {error && <p className="res-error" role="alert">{error}</p>}
          {!cargando && !error && !tareas.length && <p>No tenés tareas asignadas.</p>}
          {tareas.map((item) => (
            <div key={item.tarea.id_tarea} className="tareas-grupo">
              <h2>{item.tarea.clase.titulo}</h2>
              <TareaAlumno item={item} actualizar={actualizar} deshabilitado={cargando || Boolean(error)} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
