import { useState } from "react";

const MAX_MATERIAS = 5;

export default function SolicitudForm({ catalogo, inicial, guardando, error, onGuardar, onCancelar }) {
  const [titulo, setTitulo] = useState(inicial?.titulo || "");
  const [tema, setTema] = useState(inicial?.tema || "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion || "");
  const [ids, setIds] = useState(
    () => (inicial?.solicitudMateria || []).map((item) => item.materia.id_materia),
  );
  const [errorLocal, setErrorLocal] = useState("");

  function alternarMateria(id) {
    setErrorLocal("");
    if (ids.includes(id)) {
      setIds(ids.filter((actual) => actual !== id));
      return;
    }
    if (ids.length >= MAX_MATERIAS) {
      setErrorLocal(`Podés elegir hasta ${MAX_MATERIAS} materias.`);
      return;
    }
    setIds([...ids, id]);
  }

  function enviar(event) {
    event.preventDefault();
    if (!titulo.trim() || !tema.trim()) {
      setErrorLocal("El título y el tema no pueden quedar vacíos.");
      return;
    }
    if (!ids.length) {
      setErrorLocal("Elegí al menos una materia.");
      return;
    }
    onGuardar({
      titulo: titulo.trim(),
      tema: tema.trim(),
      descripcion: descripcion.trim(),
      ids_materia: ids,
    });
  }

  const mensajeError = errorLocal || error;

  return (
    <form className="res-tarjeta tablon-form" onSubmit={enviar}>
      <h3 className="tablon-titulo">{inicial ? "Editar solicitud" : "Nueva solicitud"}</h3>

      <label className="res-etiqueta" htmlFor="solicitud-titulo">Título</label>
      <input
        className="res-campo"
        id="solicitud-titulo"
        required
        maxLength={100}
        value={titulo}
        onChange={(event) => setTitulo(event.target.value)}
        placeholder="Ej. Necesito ayuda con álgebra"
      />

      <label className="res-etiqueta" htmlFor="solicitud-tema">Tema</label>
      <input
        className="res-campo"
        id="solicitud-tema"
        required
        maxLength={50}
        value={tema}
        onChange={(event) => setTema(event.target.value)}
        placeholder="Ej. Ecuaciones de primer grado"
      />

      <label className="res-etiqueta" htmlFor="solicitud-descripcion">Descripción (opcional)</label>
      <textarea
        className="res-campo"
        id="solicitud-descripcion"
        rows={4}
        maxLength={500}
        value={descripcion}
        onChange={(event) => setDescripcion(event.target.value)}
        placeholder="Contá qué necesitás, para cuándo y qué nivel tenés"
      />

      <fieldset className="tablon-fieldset">
        <legend className="res-etiqueta">Materias (elegí de 1 a {MAX_MATERIAS})</legend>
        <div className="tablon-materias">
          {catalogo.map((materia) => (
            <label key={materia.id_materia} className="tablon-check">
              <input
                type="checkbox"
                checked={ids.includes(materia.id_materia)}
                onChange={() => alternarMateria(materia.id_materia)}
              />
              {materia.nombreMateria}
            </label>
          ))}
        </div>
      </fieldset>

      {mensajeError && <p className="res-error" role="alert">{mensajeError}</p>}

      <div className="tablon-acciones">
        <button type="submit" className="res-boton res-boton-chico" disabled={guardando}>
          {guardando ? "Guardando..." : inicial ? "Guardar cambios" : "Publicar solicitud"}
        </button>
        <button type="button" className="res-boton-secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}