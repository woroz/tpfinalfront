import { useState } from "react";
import { cambiarVisibilidadTranscripcion, obtenerTranscripcion } from "../services/api";

export default function TranscripcionClase({ idClase, esProfesor = false }) {
  const [abierta, setAbierta] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [transcripcion, setTranscripcion] = useState(null);
  const [mensaje, setMensaje] = useState("");

  async function alternar() {
    if (abierta) {
      setAbierta(false);
      return;
    }
    setAbierta(true);
    setCargando(true);
    setMensaje("");
    try {
      const data = await obtenerTranscripcion(idClase);
      setTranscripcion(data.transcripcion);
    } catch (err) {
      setTranscripcion(null);
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
      <button type="button" className="res-boton-secundario" onClick={alternar}>
        {abierta ? "Ocultar transcripcion" : "Ver transcripcion"}
      </button>

      {abierta && (
        <div>
          {cargando && <p className="res-mensaje">Cargando transcripcion…</p>}
          {mensaje && <p className="res-mensaje">{mensaje}</p>}

          {transcripcion && (
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