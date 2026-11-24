import { useState } from "react";
import {
  actualizarRegistroActividadAlumno,
  crearRegistroActividadAlumno,
  obtenerActividadAlumnoDeClase,
} from "../services/api";
import { interpretarNota } from "../utils/tareas";

const FORMULARIO_VACIO = {
  id_registro: null,
  id_alumno: "",
  actividad: "",
  calificacion: "",
  nota: "",
};

export default function RegistroActividadClase({ idClase }) {
  const [abierto, setAbierto] = useState(false);
  const [alumnos, setAlumnos] = useState([]);
  const [formulario, setFormulario] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function cargarRegistros() {
    setCargando(true);
    setError("");
    try {
      const data = await obtenerActividadAlumnoDeClase(idClase);
      setAlumnos(data.alumnos);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los registros de los alumnos.");
    } finally {
      setCargando(false);
    }
  }

  function iniciarNuevo(alumno) {
    setError("");
    setFormulario({ ...FORMULARIO_VACIO, id_alumno: alumno.id_alumno });
  }

  function iniciarEdicion(alumno, registro) {
    setError("");
    setFormulario({
      id_registro: registro.id_registro,
      id_alumno: alumno.id_alumno,
      actividad: registro.actividad || "",
      calificacion: registro.calificacion ?? "",
      nota: registro.nota || "",
    });
  }

  async function guardar(event) {
    event.preventDefault();
    const tieneCalificacion = formulario.calificacion !== "";
    const tieneNota = Boolean(formulario.nota.trim());
    if (!tieneCalificacion && !tieneNota) {
      setError("Ingresá una calificación numérica, una nota de texto o ambas.");
      return;
    }

    let calificacion;
    try {
      calificacion = tieneCalificacion ? interpretarNota(String(formulario.calificacion)) : null;
    } catch (err) {
      setError(err.message);
      return;
    }
    const datos = {
      actividad: formulario.actividad.trim() || null,
      calificacion,
      nota: formulario.nota.trim() || null,
    };
    setGuardando(true);
    setError("");
    try {
      if (formulario.id_registro) {
        await actualizarRegistroActividadAlumno(formulario.id_registro, datos);
      } else {
        await crearRegistroActividadAlumno({
          ...datos,
          id_clase: idClase,
          id_alumno: formulario.id_alumno,
        });
      }
      setFormulario(null);
      await cargarRegistros();
    } catch (err) {
      setError(err.message || "No se pudo guardar el registro.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="registro-actividad">
      <button
        type="button"
        className="registro-actividad-toggle"
        aria-expanded={abierto}
        onClick={() => {
          if (!abierto) cargarRegistros();
          setAbierto((actual) => !actual);
        }}
      >
        {abierto ? "Ocultar seguimiento de alumnos" : "Seguimiento de la clase"}
      </button>
      {abierto && (
        <div className="registro-actividad-contenido">
          <p>Este seguimiento es independiente de las tareas y sus notas. Solo vos y el alumno pueden consultarlo.</p>
          {error && <p className="res-error" role="alert">{error}</p>}
          {cargando && <p className="res-mensaje">Cargando alumnos…</p>}
          {!cargando && alumnos.length === 0 && (
            <p className="res-mensaje">No hay alumnos con una inscripción confirmada en esta clase.</p>
          )}
          {!cargando && alumnos.map((alumno) => (
            <article key={alumno.id_alumno} className="registro-actividad-alumno">
              <h3>{alumno.nombre}</h3>
              {alumno.registros.length > 0 ? (
                <ul className="registro-actividad-lista">
                  {alumno.registros.map((registro) => (
                    <li key={registro.id_registro}>
                      <div>
                        <strong>{registro.actividad || "Registro de la clase"}</strong>
                        {registro.calificacion !== null && <span>Calificación: {registro.calificacion}</span>}
                        {registro.nota && <p>{registro.nota}</p>}
                      </div>
                      <button type="button" onClick={() => iniciarEdicion(alumno, registro)}>
                        Modificar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Aún no hay registros para este alumno.</p>
              )}
              <button type="button" className="registro-actividad-nuevo" onClick={() => iniciarNuevo(alumno)}>
                + Agregar seguimiento
              </button>
              {formulario?.id_alumno === alumno.id_alumno && (
                <form className="registro-actividad-form" onSubmit={guardar}>
                  <label>
                    Actividad (opcional)
                    <input
                      type="text"
                      maxLength={120}
                      value={formulario.actividad}
                      onChange={(event) => setFormulario((actual) => ({ ...actual, actividad: event.target.value }))}
                      placeholder="Ej.: Ejercicios de fracciones"
                    />
                  </label>
                  <label>
                    Calificación de la clase (opcional, de 0 a 10)
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="any"
                      value={formulario.calificacion}
                      onChange={(event) => setFormulario((actual) => ({ ...actual, calificacion: event.target.value }))}
                    />
                  </label>
                  <label>
                    Nota sobre el desempeño (opcional)
                    <textarea
                      rows={3}
                      maxLength={5000}
                      value={formulario.nota}
                      onChange={(event) => setFormulario((actual) => ({ ...actual, nota: event.target.value }))}
                    />
                  </label>
                  <div className="registro-actividad-acciones">
                    <button type="submit" disabled={guardando}>
                      {guardando ? "Guardando…" : "Guardar seguimiento"}
                    </button>
                    <button type="button" onClick={() => setFormulario(null)} disabled={guardando}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
