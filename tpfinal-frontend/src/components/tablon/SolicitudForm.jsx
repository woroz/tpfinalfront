import { temasDeSeleccion } from "../../utils/temasTablon";
import { useState } from "react";

export default function SolicitudForm({ catalogo, inicial, guardando, error, onGuardar, onCancelar }) {
  const [titulo, setTitulo] = useState(inicial?.titulo || "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion || "");
  const materiasAnteriores = inicial?.solicitudMateria ?? [];
  const [idMateria, setIdMateria] = useState(
    materiasAnteriores.length === 1 ? materiasAnteriores[0].materia.id_materia : "",
  );
  const opciones = temasDeSeleccion(catalogo, [idMateria]);
  const [tema, setTema] = useState(inicial?.tema || "");
  const [personalizado, setPersonalizado] = useState(Boolean(inicial?.tema && !opciones.includes(inicial.tema)));
  const [errorLocal, setErrorLocal] = useState("");

  function elegirMateria(id) {
    setIdMateria(id);
    setErrorLocal("");
    setTema("");
    setPersonalizado(false);
  }

  function enviar(event) {
    event.preventDefault();
    if (!titulo.trim() || !tema.trim()) {
      setErrorLocal("El título y el tema no pueden quedar vacíos.");
      return;
    }
    if (!idMateria) {
      setErrorLocal("Elegí una materia.");
      return;
    }
    onGuardar({
      titulo: titulo.trim(),
      tema: tema.trim(),
      descripcion: descripcion.trim(),
      ids_materia: [idMateria],
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

      <fieldset className="tablon-fieldset">
        <legend className="res-etiqueta">Materia (elegí una)</legend>
        {materiasAnteriores.length > 1 && <p>Esta solicitud tenía varias materias. Elegí cuál conservar al guardar.</p>}
        <div className="tablon-materias">
          {catalogo.map((materia) => (
            <label key={materia.id_materia} className="tablon-check">
              <input
                type="radio"
                name="materia"
                required
                checked={idMateria === materia.id_materia}
                onChange={() => elegirMateria(materia.id_materia)}
              />
              {materia.nombreMateria}
            </label>
          ))}
        </div>
      </fieldset>

      {idMateria && <fieldset className="tablon-fieldset">
        <legend className="res-etiqueta">Tema (elegí uno)</legend>
        <div className="tablon-materias">
          {opciones.map(opcion => (
            <label className="tablon-check" key={opcion}>
              <input type="radio" name="tema" required checked={!personalizado && tema === opcion}
                onChange={() => { setPersonalizado(false); setTema(opcion); }} />
              {opcion}
            </label>
          ))}
          <label className="tablon-check">
            <input type="radio" name="tema" required checked={personalizado}
              onChange={() => { setPersonalizado(true); setTema(""); }} />
            Otro tema
          </label>
        </div>
        {personalizado && <label className="res-etiqueta">Tema para esta solicitud
          <input className="res-campo" required maxLength={50} value={tema}
            onChange={event => setTema(event.target.value)} />
        </label>}
      </fieldset>}

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

      {mensajeError && <p className="res-error" role="alert">{mensajeError}</p>}

      <div className="tablon-acciones">
        <button type="submit" className="res-boton res-boton-chico" disabled={guardando || !idMateria || !tema.trim()}>
          {guardando ? "Guardando..." : inicial ? "Guardar cambios" : "Publicar solicitud"}
        </button>
        <button type="button" className="res-boton-secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}