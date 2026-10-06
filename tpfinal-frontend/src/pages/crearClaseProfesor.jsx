import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  crearArea,
  crearClase,
  crearMateria,
  obtenerAreas,
  obtenerMaterias,
} from "../services/api";

const INITIAL_FORM = {
  idArea: "",
  idMateria: "",
  titulo: "",
  tema: "",
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
  const [nuevaArea, setNuevaArea] = useState("");
  const [nuevaMateria, setNuevaMateria] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

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

  async function guardarArea() {
    if (!nuevaArea.trim()) return;
    try {
      const response = await crearArea(nuevaArea.trim());
      const area = response.area;
      setAreas((actuales) => [...actuales.filter((item) => item.id_area !== area.id_area), area]);
      cambiar("idArea", area.id_area);
      setNuevaArea("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarMateria() {
    if (!nuevaMateria.trim() || !form.idArea) {
      setError("Elegí un área antes de cargar una materia.");
      return;
    }
    try {
      const response = await crearMateria(nuevaMateria.trim(), form.idArea);
      const materia = response.materia;
      setMaterias((actuales) => [...actuales.filter((item) => item.id_materia !== materia.id_materia), materia]);
      cambiar("idMateria", materia.id_materia);
      setNuevaMateria("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    if (!form.idMateria) {
      setError("Elegí o cargá una materia.");
      return;
    }
    setGuardando(true);
    try {
      await crearClase({
        id_materia: form.idMateria,
        titulo: form.titulo.trim(),
        tema: form.tema.trim(),
        fecha_hora_inicio: `${form.fecha}T${form.horaInicio}`,
        fecha_hora_fin: `${form.fecha}T${form.horaFin}`,
        cupo_maximo: Number(form.cupo),
        precio: form.precio ? Number(form.precio) : 0,
        tipo: form.tipo,
        origen: form.origen,
      });
      setMensaje("La clase se creó correctamente.");
      setForm(INITIAL_FORM);
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

        <form className="res-tarjeta crear-clase-form" onSubmit={handleSubmit}>
          <div className="crear-clase-seccion">
            <h2>Materia y área</h2>
            <label className="res-etiqueta" htmlFor="clase-area">Área de conocimiento</label>
            <select className="res-campo" id="clase-area" value={form.idArea} onChange={(event) => {
              cambiar("idArea", event.target.value);
              cambiar("idMateria", "");
            }} disabled={cargando}>
              <option value="">Elegí un área</option>
              {areas.map((area) => <option key={area.id_area} value={area.id_area}>{area.nombreArea}</option>)}
            </select>
            <div className="crear-clase-inline">
              <input className="res-campo" value={nuevaArea} onChange={(event) => setNuevaArea(event.target.value)} placeholder="Cargar otra área" />
              <button type="button" className="res-boton-secundario" onClick={guardarArea}>Agregar área</button>
            </div>

            <label className="res-etiqueta" htmlFor="clase-materia">Materia</label>
            <select className="res-campo" id="clase-materia" value={form.idMateria} onChange={(event) => cambiar("idMateria", event.target.value)} disabled={!form.idArea || cargando}>
              <option value="">Elegí una materia</option>
              {materiasDelArea.map((materia) => <option key={materia.id_materia} value={materia.id_materia}>{materia.nombreMateria}</option>)}
            </select>
            <div className="crear-clase-inline">
              <input className="res-campo" value={nuevaMateria} onChange={(event) => setNuevaMateria(event.target.value)} placeholder="Cargar otra materia" />
              <button type="button" className="res-boton-secundario" onClick={guardarMateria}>Agregar materia</button>
            </div>
          </div>

          <div className="crear-clase-seccion">
            <h2>Datos de la clase</h2>
            <label className="res-etiqueta" htmlFor="clase-titulo">Título</label>
            <input className="res-campo" id="clase-titulo" required maxLength={100} value={form.titulo} onChange={(event) => cambiar("titulo", event.target.value)} placeholder="Ej. Apoyo de álgebra" />
            <label className="res-etiqueta" htmlFor="clase-tema">Tema</label>
            <input className="res-campo" id="clase-tema" required maxLength={200} value={form.tema} onChange={(event) => cambiar("tema", event.target.value)} placeholder="Ej. Ecuaciones de primer grado" />
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
