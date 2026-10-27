import { useEffect, useState } from "react";
import { crearOfertaTablon } from "../../services/api";
import { hoyLocal } from "../../utils/fechas";

const MAX_PDF = 4 * 1024 * 1024;

export default function OfertaModal({ solicitud, materias, onCerrar, onEnviada }) {
  const [form, setForm] = useState({
    idMateria: materias.length === 1 ? materias[0].id_materia : "",
    mensaje: "",
    precio: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
  });
  const [pdf, setPdf] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function alTeclear(event) {
      if (event.key === "Escape" && !enviando) onCerrar();
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [enviando, onCerrar]);

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setError("");
  }

  function elegirPdf(event) {
    const archivo = event.target.files?.[0];
    if (!archivo) {
      setPdf(null);
      return;
    }
    if (archivo.type !== "application/pdf") {
      setError("El material tiene que ser un PDF.");
      event.target.value = "";
      return;
    }
    if (archivo.size > MAX_PDF) {
      setError("El PDF no puede superar los 4 MB.");
      event.target.value = "";
      return;
    }
    setPdf(archivo);
    setError("");
  }

  async function enviar(event) {
    event.preventDefault();
    const precio = Number(form.precio);
    const inicio = new Date(`${form.fecha}T${form.horaInicio}`);
    const fin = new Date(`${form.fecha}T${form.horaFin}`);

    if (!form.idMateria) {
      setError("Elegí la materia de la clase.");
      return;
    }
    if (form.precio === "" || !Number.isInteger(precio) || precio < 0) {
      setError("El precio tiene que ser un número entero mayor o igual a cero.");
      return;
    }
    if (inicio <= new Date()) {
      setError("La clase tiene que ser en el futuro.");
      return;
    }
    if (fin <= inicio) {
      setError("La hora de fin tiene que ser posterior a la de inicio.");
      return;
    }

    const datos = new FormData();
    datos.append("id_materia", form.idMateria);
    if (form.mensaje.trim()) datos.append("mensaje", form.mensaje.trim());
    datos.append("precio", String(precio));
    datos.append("fecha_hora_inicio", `${form.fecha}T${form.horaInicio}`);
    datos.append("fecha_hora_fin", `${form.fecha}T${form.horaFin}`);
    if (pdf) datos.append("material", pdf);

    setEnviando(true);
    try {
      await crearOfertaTablon(solicitud.id_solicitud, datos);
      onEnviada(solicitud.id_solicitud);
    } catch (err) {
      setError(err.message || "No se pudo enviar la oferta.");
      setEnviando(false);
    }
  }

  return (
    <div className="ubicacion-overlay" role="presentation">
      <form
        className="ubicacion-dialog tablon-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oferta-titulo"
        onSubmit={enviar}
      >
        <h2 id="oferta-titulo">Hacer una oferta</h2>
        <p className="tablon-resumen">
          Si el alumno acepta, se crea una clase individual con el título y el tema de su solicitud:{" "}
          <strong>{solicitud.titulo}</strong> · {solicitud.tema}
        </p>

        <label className="res-etiqueta" htmlFor="oferta-materia">Materia</label>
        <select
          className="res-campo"
          id="oferta-materia"
          required
          value={form.idMateria}
          onChange={(event) => cambiar("idMateria", event.target.value)}
        >
          <option value="">Elegí una materia</option>
          {materias.map((materia) => (
            <option key={materia.id_materia} value={materia.id_materia}>{materia.nombreMateria}</option>
          ))}
        </select>

        <label className="res-etiqueta" htmlFor="oferta-mensaje">Descripción de tu propuesta (opcional)</label>
        <textarea
          className="res-campo"
          id="oferta-mensaje"
          rows={4}
          maxLength={500}
          value={form.mensaje}
          onChange={(event) => cambiar("mensaje", event.target.value)}
          placeholder="Contale al alumno cómo vas a ayudarlo y qué va a ver en la clase"
        />

        <label className="res-etiqueta" htmlFor="oferta-pdf">Material en PDF (opcional, máx. 4 MB)</label>
        <label className="file-upload" htmlFor="oferta-pdf">
          <span className="file-upload-trigger">Elegir PDF</span>
          <span className="file-upload-name">{pdf ? pdf.name : "No se eligió ningún PDF"}</span>
          <input id="oferta-pdf" type="file" accept="application/pdf" onChange={elegirPdf} />
        </label>

        <div className="tablon-dos-columnas">
          <div>
            <label className="res-etiqueta" htmlFor="oferta-fecha">Fecha</label>
            <input
              className="res-campo"
              id="oferta-fecha"
              type="date"
              required
              min={hoyLocal()}
              value={form.fecha}
              onChange={(event) => cambiar("fecha", event.target.value)}
            />
          </div>
          <div>
            <label className="res-etiqueta" htmlFor="oferta-precio">Precio (en pesos)</label>
            <input
              className="res-campo"
              id="oferta-precio"
              type="number"
              min="0"
              step="1"
              required
              value={form.precio}
              onChange={(event) => cambiar("precio", event.target.value)}
            />
          </div>
          <div>
            <label className="res-etiqueta" htmlFor="oferta-inicio">Inicio</label>
            <input
              className="res-campo"
              id="oferta-inicio"
              type="time"
              required
              value={form.horaInicio}
              onChange={(event) => cambiar("horaInicio", event.target.value)}
            />
          </div>
          <div>
            <label className="res-etiqueta" htmlFor="oferta-fin">Fin</label>
            <input
              className="res-campo"
              id="oferta-fin"
              type="time"
              required
              value={form.horaFin}
              onChange={(event) => cambiar("horaFin", event.target.value)}
            />
          </div>
        </div>

        {error && <p className="res-error" role="alert">{error}</p>}

        <div className="ubicacion-actions">
          <button type="button" className="ubicacion-secondary" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="ubicacion-primary" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar oferta"}
          </button>
        </div>
      </form>
    </div>
  );
}