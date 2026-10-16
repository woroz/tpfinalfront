import { useState } from "react";
import { actualizarResenaProfesor, crearResenaProfesor } from "../services/api";
import Estrellas from "./Estrellas";

export default function ResenaClase({ idProfesor, idClase, resena, onCreada }) {
  const [resenaActual, setResenaActual] = useState(resena);
  const [editando, setEditando] = useState(!resena);
  const [puntaje, setPuntaje] = useState(Number(resena?.puntaje || 5));
  const [comentario, setComentario] = useState(resena?.comentario || "");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviarResena(event) {
    event.preventDefault();
    setEnviando(true);
    setError("");
    const datos = {
      id_clase: resenaActual?.id_clase || idClase,
      puntaje,
      comentario: comentario.trim() || undefined,
    };
    try {
      const respuesta = resenaActual
        ? await actualizarResenaProfesor(idProfesor, datos)
        : await crearResenaProfesor(idProfesor, datos);
      setResenaActual(respuesta.resena);
      setEditando(false);
      onCreada(respuesta.resena);
    } catch (err) {
      setError(err.message || "No se pudo guardar la reseña.");
    } finally {
      setEnviando(false);
    }
  }

  if (resenaActual && !editando) {
    return (
      <div className="mis-clases-resena-actual">
        <p className="mis-clases-resena-lista">
          Tu reseña: {resenaActual.puntaje} de 5
          {resenaActual.comentario ? ` · ${resenaActual.comentario}` : ""}
        </p>
        <button
          type="button"
          className="perfil-enlace mis-clases-resena-editar"
          onClick={() => {
            setPuntaje(Number(resenaActual.puntaje));
            setComentario(resenaActual.comentario || "");
            setError("");
            setEditando(true);
          }}
        >
          Modificar reseña
        </button>
      </div>
    );
  }

  return (
    <form className="mis-clases-resena-form" onSubmit={enviarResena}>
      <label>
        Tu valoración
        <Estrellas puntaje={puntaje} onChange={setPuntaje} disabled={enviando} />
        <span className="mis-clases-resena-valor">{puntaje.toFixed(1).replace(".", ",")} de 5</span>
      </label>
      <label>
        Reseña (opcional)
        <textarea
          value={comentario}
          onChange={(event) => setComentario(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Contá cómo fue tu experiencia con el profesor."
        />
      </label>
      {error && <p className="mis-clases-resena-error" role="alert">{error}</p>}
      <div className="mis-clases-resena-acciones">
        <button type="submit" className="res-boton res-boton-chico" disabled={enviando}>
          {enviando ? "Guardando…" : resenaActual ? "Guardar cambios" : "Enviar reseña"}
        </button>
        {resenaActual && (
          <button type="button" className="perfil-enlace mis-clases-resena-editar" onClick={() => setEditando(false)} disabled={enviando}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
