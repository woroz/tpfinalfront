import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  crearArea,
  crearClase,
  crearMateria,
  asociarMateriaProfesor,
  obtenerAreas,
  obtenerMaterias,
  subirMaterialClase,
} from "../services/api";

const MAX_PDF = 4 * 1024 * 1024;

const INITIAL_FORM = {
  idArea: "",
  idMateria: "",
  titulo: "",
  tema: "",
  contenido: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  cupo: "1",
  precio: "",
  tipo: "clase",
  origen: "profesor",
};

export default function CrearClaseProfesor() {
  const [areas, setAreas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [inputPdfKey, setInputPdfKey] = useState(0);
  const [nuevaArea, setNuevaArea] = useState("");
  const [nuevaMateria, setNuevaMateria] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estadoArea, setEstadoArea] = useState("");
  const [estadoMateria, setEstadoMateria] = useState("");

  useEffect(() => {
    Promise.all([obtenerAreas(), obtenerMaterias()])
      .then(([areasResponse, materiasResponse]) => {
        setAreas(areasResponse.areas || []);
        setMaterias(materiasResponse.materias || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setError("");
    setMensaje("");
  }

  function elegirPdf(event) {
    const archivo = event.target.files?.[0] ?? null;
    setError("");
    setMensaje("");
    if (!archivo) {
      setArchivoPdf(null);
      return;
    }
    if (archivo.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF.");
      setArchivoPdf(null);
      setInputPdfKey((k) => k + 1);
      return;
    }
    if (archivo.size > MAX_PDF) {
      setError("El PDF no puede superar los 4 MB.");
      setArchivoPdf(null);
      setInputPdfKey((k) => k + 1);
      return;
    }
    setArchivoPdf(archivo);
  }

  async function guardarArea() {
    const areaNombre = nuevaArea.trim();
    if (!areaNombre) {
      setError("Escribí el nombre del área antes de guardar.");
      setEstadoArea("");
      return;
    }
    setError("");
    setEstadoArea("guardando");
    try {
      const response = await crearArea(areaNombre);
      const area = response.area;
      setAreas((actuales) => [...actuales.filter((item) => item.id_area !== area.id_area), area]);
      cambiar("idArea", area.id_area);
      setNuevaArea("");
      setEstadoArea("ok");
      setMensaje(`Área "${area.nombreArea}" agregada correctamente.`);
    } catch (err) {
      setEstadoArea("error");
      setError(err.message);
    }
  }

  async function guardarMateria() {
    const materiaNombre = nuevaMateria.trim();
    if (!materiaNombre) {
      setError("Escribí el nombre de la materia antes de guardar.");
      setEstadoMateria("");
      return;
    }
    if (!form.idArea) {
      setError("Elegí un área antes de cargar una materia.");
      setEstadoMateria("error");
      return;
    }
    setError("");
    setEstadoMateria("guardando");
    try {
      const response = await crearMateria(materiaNombre, form.idArea);
      const materia = response.materia;
      setMaterias((actuales) => [...actuales.filter((item) => item.id_materia !== materia.id_materia), materia]);
      cambiar("idMateria", materia.id_materia);
      setNuevaMateria("");
      setEstadoMateria("ok");
      setMensaje(`Materia "${materia.nombreMateria}" agregada correctamente.`);
    } catch (err) {
      setEstadoMateria("error");
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    if (!form.titulo.trim()) {
      setError("Ingresá el título de la clase.");
      return;
    }
    if (!form.tema.trim()) {
      setError("Ingresá el tema de la clase.");
      return;
    }
    if (!form.idMateria) {
      setError("Elegí o cargá una materia.");
      return;
    }
    if (!form.fecha) {
      setError("Elegí la fecha de la clase.");
      return;
    }
    if (!form.horaInicio || !form.horaFin) {
      setError("Completá el horario de inicio y de fin.");
      return;
    }
    if (form.horaInicio >= form.horaFin) {
      setError("La hora de fin tiene que ser posterior a la hora de inicio.");
      return;
    }
    if (!form.cupo || Number(form.cupo) < 1) {
      setError("El cupo debe ser de al menos un alumno.");
      return;
    }
    setGuardando(true);
    try {
      await asociarMateriaProfesor(form.idMateria);
      const respuesta = await crearClase({
        id_materia: form.idMateria,
        titulo: form.titulo.trim(),
        tema: form.tema.trim(),
        contenido: form.contenido.trim() || undefined,
        fecha_hora_inicio: `${form.fecha}T${form.horaInicio}`,
        fecha_hora_fin: `${form.fecha}T${form.horaFin}`,
        cupo_maximo: Number(form.cupo),
        precio: form.precio ? Number(form.precio) : 0,
        tipo: form.tipo,
        origen: form.origen,
      });

      const idClase = respuesta?.clase?.id_clase;
      let avisoPdf = "";
      if (archivoPdf && idClase) {
        try {
          await subirMaterialClase(idClase, archivoPdf);
        } catch (errPdf) {
          avisoPdf = ` Pero no se pudo subir el PDF (${errPdf.message}).`;
        }
      }

      setMensaje(`La clase se creó correctamente.${avisoPdf}`);
      setForm(INITIAL_FORM);
      setArchivoPdf(null);
      setInputPdfKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const materiasDelArea = materias.filter(
    (materia) => !form.idArea || materia.id_area_conocimiento === form.idArea,
  );

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor res-centrado crear-clase-page">
        <Link className="res-volver" to="/profesor">Volver a clases programadas</Link>
        <header className="res-encabezado">
          <h1>Crear clase</h1>
          <p>Publicá una clase para que tus alumnos puedan encontrarla y reservarla.</p>
        </header>

        <form className="res-tarjeta crear-clase-form" onSubmit={handleSubmit} noValidate>
          <div className="crear-clase-seccion">
            <h2>Materia y área</h2>
            <div className="crear-clase-panel">
              <label className="res-etiqueta" htmlFor="clase-area">Área de conocimiento</label>
              <select className="res-campo" id="clase-area" value={form.idArea} onChange={(event) => {
                cambiar("idArea", event.target.value);
                cambiar("idMateria", "");
                setEstadoMateria("");
              }} disabled={cargando}>
                <option value="">Elegí un área</option>
                {areas.map((area) => <option key={area.id_area} value={area.id_area}>{area.nombreArea}</option>)}
              </select>
              <div className="crear-clase-inline">
                <input className="res-campo" value={nuevaArea} onChange={(event) => setNuevaArea(event.target.value)} placeholder="Cargar otra área" aria-label="Nombre de la nueva área" />
                <button type="button" className="res-boton-secundario" onClick={guardarArea} disabled={!nuevaArea.trim()}>
                  {estadoArea === "guardando" ? "Guardando…" : "Agregar área"}
                </button>
              </div>
              {estadoArea === "ok" && <p className="crear-clase-feedback crear-clase-feedback-ok" aria-live="polite">Área creada y seleccionada.</p>}
              {estadoArea === "error" && <p className="crear-clase-feedback crear-clase-feedback-error" aria-live="polite">No se pudo guardar el área.</p>}
            </div>

            <div className="crear-clase-panel">
              <label className="res-etiqueta" htmlFor="clase-materia">Materia</label>
              <select className="res-campo" id="clase-materia" value={form.idMateria} onChange={(event) => cambiar("idMateria", event.target.value)} disabled={!form.idArea || cargando}>
                <option value="">Elegí una materia</option>
                {materiasDelArea.map((materia) => <option key={materia.id_materia} value={materia.id_materia}>{materia.nombreMateria}</option>)}
              </select>
              <div className="crear-clase-inline">
                <input className="res-campo" value={nuevaMateria} onChange={(event) => setNuevaMateria(event.target.value)} placeholder="Cargar otra materia" aria-label="Nombre de la nueva materia" disabled={!form.idArea} />
                <button type="button" className="res-boton-secundario" onClick={guardarMateria} disabled={!form.idArea || !nuevaMateria.trim()}>
                  {estadoMateria === "guardando" ? "Guardando…" : "Agregar materia"}
                </button>
              </div>
              {!form.idArea && <p className="crear-clase-ayuda">Primero elegí un área para cargar una materia.</p>}
              {estadoMateria === "ok" && <p className="crear-clase-feedback crear-clase-feedback-ok" aria-live="polite">Materia creada y seleccionada.</p>}
              {estadoMateria === "error" && <p className="crear-clase-feedback crear-clase-feedback-error" aria-live="polite">No se pudo guardar la materia.</p>}
            </div>
          </div>

          <div className="crear-clase-seccion">
            <h2>Datos de la clase</h2>
            <label className="res-etiqueta" htmlFor="clase-titulo">Título</label>
            <input className="res-campo" id="clase-titulo" required maxLength={100} value={form.titulo} onChange={(event) => cambiar("titulo", event.target.value)} placeholder="Ej. Apoyo de álgebra" />
            <label className="res-etiqueta" htmlFor="clase-tema">Tema</label>
            <input className="res-campo" id="clase-tema" required maxLength={200} value={form.tema} onChange={(event) => cambiar("tema", event.target.value)} placeholder="Ej. Ecuaciones de primer grado" />

            <label className="res-etiqueta" htmlFor="clase-contenido">Contenido que se va a dictar</label>
            <textarea className="res-campo" id="clase-contenido" rows={5} maxLength={5000} value={form.contenido} onChange={(event) => cambiar("contenido", event.target.value)} placeholder="Contale al alumno qué va a ver en la clase (temario, objetivos, qué tiene que traer)" />

            <label className="res-etiqueta" htmlFor="clase-pdf">Material en PDF (opcional, máx. 4 MB)</label>
            <label className="file-upload" htmlFor="clase-pdf">
              <span className="file-upload-trigger">Elegir archivo</span>
              <span className="file-upload-name">{archivoPdf ? archivoPdf.name : "No se eligió ningún PDF"}</span>
              <input id="clase-pdf" key={inputPdfKey} type="file" accept="application/pdf" onChange={elegirPdf} />
            </label>

            <div className="crear-clase-dos-columnas">
              <div><label className="res-etiqueta" htmlFor="clase-fecha">Fecha</label><input className="res-campo" id="clase-fecha" type="date" required value={form.fecha} onChange={(event) => cambiar("fecha", event.target.value)} /></div>
              <div><label className="res-etiqueta" htmlFor="clase-cupo">Cupo</label><input className="res-campo" id="clase-cupo" type="number" min="1" required value={form.cupo} onChange={(event) => cambiar("cupo", event.target.value)} /></div>
              <div><label className="res-etiqueta" htmlFor="clase-inicio">Inicio</label><input className="res-campo" id="clase-inicio" type="time" required value={form.horaInicio} onChange={(event) => cambiar("horaInicio", event.target.value)} /></div>
              <div><label className="res-etiqueta" htmlFor="clase-fin">Fin</label><input className="res-campo" id="clase-fin" type="time" required value={form.horaFin} onChange={(event) => cambiar("horaFin", event.target.value)} /></div>
            </div>
            <label className="res-etiqueta" htmlFor="clase-precio">Precio</label>
            <input className="res-campo" id="clase-precio" type="number" min="0" value={form.precio} onChange={(event) => cambiar("precio", event.target.value)} placeholder="Opcional" />
          </div>

          {error && <p className="res-error" role="alert">{error}</p>}
          {mensaje && <p className="res-ok" role="status">{mensaje}</p>}
          <button className="res-boton" type="submit" disabled={guardando || cargando}>{guardando ? "Creando clase..." : "Crear clase"}</button>
        </form>
      </section>
    </main>
  );
}
