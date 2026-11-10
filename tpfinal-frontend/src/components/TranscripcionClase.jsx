import { useState } from "react";
import { cambiarVisibilidadTranscripcion, obtenerTranscripcion, resumirTranscripcion } from "../services/api";

export default function TranscripcionClase({ idClase, esProfesor = false }) {
  const [vista, setVista] = useState(null); // null | "transcripcion" | "resumen"
  const [cargando, setCargando] = useState(false);
  const [transcripcion, setTranscripcion] = useState(null);
  const [mensaje, setMensaje] = useState("");

  async function abrir(nuevaVista) {
    if (vista === nuevaVista) {
      setVista(null);
      return;
    }
    setVista(nuevaVista);
    setMensaje("");
    if (nuevaVista === "resumen" && transcripcion?.resumen) return;

    setCargando(true);
    try {
      // el back devuelve el resumen guardado si ya existe, sin volver a generarlo
      const data = nuevaVista === "resumen"
        ? await resumirTranscripcion(idClase)
        : await obtenerTranscripcion(idClase);
      setTranscripcion(data.transcripcion);
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function cambiarVisibilidad() {
    try {
      const data = await cambiarVisibilidadTranscripcion(idClase, !transcripcion.visible_alumnos);
      setTranscripcion(data.transcripcion);
    } catch (err) {
      setMensaje(err.message);
    }
  }

  return (
    <div>
      <button type="button" className="res-boton-secundario" onClick={() => abrir("transcripcion")}>
        {vista === "transcripcion" ? "Ocultar transcripcion" : "Ver transcripcion"}
      </button>{" "}
      <button type="button" className="res-boton-secundario" onClick={() => abrir("resumen")} disabled={cargando}>
        {vista === "resumen" ? "Ocultar resumen" : "Resumir clase"}
      </button>

      {vista && (
        <div>
          {cargando && (
            <p className="res-mensaje">
              {vista === "resumen" ? "Generando resumen…" : "Cargando transcripcion…"}
            </p>
          )}
          {mensaje && <p className="res-mensaje">{mensaje}</p>}

          {!cargando && transcripcion && vista === "resumen" && transcripcion.resumen && (
            <>
              <p className="res-nota">Resumen generado automaticamente a partir de la transcripcion.</p>
              <p style={{ whiteSpace: "pre-wrap" }}>{transcripcion.resumen}</p>
            </>
          )}

          {!cargando && transcripcion && vista === "transcripcion" && (
            <>
              <p className="res-nota">
                Transcripcion automatica: puede contener errores propios del reconocimiento de voz.
              </p>
              <p style={{ whiteSpace: "pre-wrap" }}>
                {transcripcion.contenido || "Todavia no hay texto transcripto."}
              </p>
              {esProfesor && (
                <label>
                  <input
                    type="checkbox"
                    checked={transcripcion.visible_alumnos}
                    onChange={cambiarVisibilidad}
                  />{" "}
                  Compartir con alumnos que no asistieron
                </label>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
