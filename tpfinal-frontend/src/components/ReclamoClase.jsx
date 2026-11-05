import { useEffect, useState } from "react";
import { crearReclamo } from "../services/api";

const ETIQUETAS = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelto: "Resuelto",
  rechazado: "Rechazado",
};

export function estadoReclamoLabel(estado) {
  return ETIQUETAS[estado] || estado;
}

export default function ReclamoClase({ idClase, reclamo, onCreado }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) return undefined;
    function cerrarConEscape(event) {
      if (event.key === "Escape" && !enviando) setAbierto(false);
    }
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [abierto, enviando]);

  async function enviar(event) {
    event.preventDefault();
    if (motivo.trim().length < 10) {
      setError("Contanos un poco más sobre lo ocurrido (mínimo 10 caracteres).");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const respuesta = await crearReclamo({ id_clase: idClase, motivo: motivo.trim() });
      onCreado(respuesta.reclamo);
      setAbierto(false);
      setMotivo("");
    } catch (err) {
      setError(err.message || "No se pudo enviar el reclamo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mis-clases-reclamo">
      {reclamo ? (
        <div className="mis-clases-reclamo-estado">
          Reclamo: <strong>{estadoReclamoLabel(reclamo.estado)}</strong>
        </div>
      ) : (
        <button type="button" className="mis-clases-reclamo-boton" onClick={() => setAbierto(true)}>
          Reclamar clase
        </button>
      )}
      {abierto && (
        <div className="mis-clases-reclamo-modal" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !enviando) setAbierto(false);
        }}>
          <form onSubmit={enviar} className="mis-clases-reclamo-form" role="dialog" aria-modal="true" aria-labelledby={`titulo-reclamo-${idClase}`}>
            <div className="mis-clases-reclamo-modal-encabezado">
              <h2 id={`titulo-reclamo-${idClase}`}>Reclamar clase</h2>
              <button type="button" className="mis-clases-reclamo-cerrar" onClick={() => setAbierto(false)} disabled={enviando} aria-label="Cerrar">
                ×
              </button>
            </div>
            <label htmlFor={`motivo-reclamo-${idClase}`}>¿Qué ocurrió con la clase?</label>
            <textarea
              id={`motivo-reclamo-${idClase}`}
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Por ejemplo: el profesor no ingresó a la videollamada."
              maxLength={2000}
              rows={5}
              disabled={enviando}
              autoFocus
            />
            {error && <p className="mis-clases-reclamo-error" role="alert">{error}</p>}
            <div className="mis-clases-reclamo-acciones">
              <button type="submit" className="res-boton" disabled={enviando}>
                {enviando ? "Enviando…" : "Enviar reclamo"}
              </button>
              <button type="button" className="perfil-enlace" onClick={() => setAbierto(false)} disabled={enviando}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
