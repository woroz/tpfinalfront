import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  asociarMateriaProfesor,
  guardarMiDisponibilidad,
  obtenerMaterias,
  obtenerMateriasProfesor,
  obtenerMiDisponibilidad,
} from "../services/api";

const DIAS = [
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miércoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sábado" },
  { valor: 0, nombre: "Domingo" },
];

export default function DisponibilidadProfesor() {
  const [franjas, setFranjas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [catalogoMaterias, setCatalogoMaterias] = useState([]);
  const [materiaParaAgregar, setMateriaParaAgregar] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [asociandoMateria, setAsociandoMateria] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([obtenerMiDisponibilidad(), obtenerMateriasProfesor(), obtenerMaterias()])
      .then(([disponibilidad, materiasProfesor, catalogo]) => {
        if (!activo) return;
        setFranjas(disponibilidad.franjas.map((franja) => ({ ...franja, id_materia: franja.id_materia || "" })));
        setMaterias(materiasProfesor.materias || []);
        setCatalogoMaterias(catalogo.materias || []);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  function agregar(diaSemana) {
    setMensaje("");
    setFranjas((actuales) => [...actuales, { diaSemana, desde: "09:00", hasta: "13:00", id_materia: "" }]);
  }

  function actualizar(indice, campo, valor) {
    setMensaje("");
    setFranjas((actuales) => actuales.map((franja, i) => (i === indice ? { ...franja, [campo]: valor } : franja)));
  }

  function quitar(indice) {
    setMensaje("");
    setFranjas((actuales) => actuales.filter((_, i) => i !== indice));
  }

  async function guardar() {
    const haySolapamiento = franjas.some((franja, indice) =>
      franjas.slice(0, indice).some((anterior) =>
        anterior.diaSemana === franja.diaSemana
        && franja.desde < anterior.hasta
        && anterior.desde < franja.hasta
        && (!anterior.id_materia || !franja.id_materia || anterior.id_materia === franja.id_materia)
      )
    );
    if (haySolapamiento) {
      setError("Hay franjas superpuestas para la misma materia. Revisá los días y horarios.");
      setMensaje("");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const data = await guardarMiDisponibilidad(franjas.map((franja) => ({
        ...franja,
        id_materia: franja.id_materia || null,
      })));
      setFranjas(data.franjas.map((franja) => ({ ...franja, id_materia: franja.id_materia || "" })));
      setMensaje("Disponibilidad guardada");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function agregarMateria() {
    if (!materiaParaAgregar) return;
    setAsociandoMateria(true);
    setError("");
    setMensaje("");
    try {
      await asociarMateriaProfesor(materiaParaAgregar);
      const materia = catalogoMaterias.find((item) => item.id_materia === materiaParaAgregar);
      if (materia) setMaterias((actuales) => [...actuales, materia]);
      setMateriaParaAgregar("");
      setMensaje(materia ? `${materia.nombreMateria} se agregó a tus materias.` : "Materia agregada correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setAsociandoMateria(false);
    }
  }

  const materiasParaAgregar = catalogoMaterias.filter(
    (materia) => !materias.some((propia) => propia.id_materia === materia.id_materia),
  );

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor">
        <header className="res-encabezado">
          <h1>Mi disponibilidad</h1>
          <p>Definí en qué franjas semanales podés dar clases. Los alumnos solo verán estos horarios.</p>
        </header>

        {cargando && <p className="res-mensaje">Cargando…</p>}

        {!cargando && (
          <div className="res-tarjeta">
            <section className="disponibilidad-materias">
              <div>
                <h2>Materias que dictás</h2>
                <p>Elegí las materias que querés ofrecer para que puedas asignarles horarios.</p>
              </div>
              <div className="disponibilidad-materias-agregar">
                <select
                  className="res-campo"
                  aria-label="Seleccionar materia para agregar"
                  value={materiaParaAgregar}
                  onChange={(event) => setMateriaParaAgregar(event.target.value)}
                  disabled={!materiasParaAgregar.length || asociandoMateria}
                >
                  <option value="">
                    {materiasParaAgregar.length ? "Elegí una materia" : "Ya agregaste todas las materias"}
                  </option>
                  {materiasParaAgregar.map((materia) => (
                    <option key={materia.id_materia} value={materia.id_materia}>
                      {materia.nombreMateria}{materia.areaConocimiento?.nombreArea ? ` · ${materia.areaConocimiento.nombreArea}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="res-boton-secundario"
                  onClick={agregarMateria}
                  disabled={!materiaParaAgregar || asociandoMateria}
                >
                  {asociandoMateria ? "Agregando…" : "Agregar materia"}
                </button>
              </div>
              {materias.length > 0 ? (
                <ul className="disponibilidad-materias-lista">
                  {materias.map((materia) => <li key={materia.id_materia}>{materia.nombreMateria}</li>)}
                </ul>
              ) : (
                <p className="res-nota">
                  Todavía no tenés materias asociadas. Agregalas desde{" "}
                  <Link to="/profesor/materias">Mis materias</Link> o{" "}
                  <Link to="/profesor/crear-clase">al crear una clase</Link>.
                </p>
              )}
            </section>

            <div className="disponibilidad-ayuda">
              <strong>Asigná cada franja a una materia</strong>
              <span>“Todas las materias” hace que ese horario esté disponible para cualquiera de tus materias.</span>
            </div>

            {DIAS.map((dia) => (
              <div key={dia.valor} className="res-dia-semana">
                <div className="res-dia-semana-cabecera">
                  <strong>{dia.nombre}</strong>
                  <button type="button" className="res-boton-secundario" onClick={() => agregar(dia.valor)}>
                    + Agregar franja
                  </button>
                </div>
                {franjas.map((franja, indice) => (
                  franja.diaSemana === dia.valor && (
                    <div key={indice} className="res-franja">
                      <input
                        type="time"
                        value={franja.desde}
                        aria-label={`${dia.nombre} desde`}
                        onChange={(event) => actualizar(indice, "desde", event.target.value)}
                      />
                      <span>a</span>
                      <input
                        type="time"
                        value={franja.hasta}
                        aria-label={`${dia.nombre} hasta`}
                        onChange={(event) => actualizar(indice, "hasta", event.target.value)}
                      />
                      <select
                        className="res-campo disponibilidad-franja-materia"
                        aria-label={`${dia.nombre} materia`}
                        value={franja.id_materia || ""}
                        onChange={(event) => actualizar(indice, "id_materia", event.target.value)}
                      >
                        <option value="">Todas las materias</option>
                        {materias.map((materia) => (
                          <option key={materia.id_materia} value={materia.id_materia}>{materia.nombreMateria}</option>
                        ))}
                      </select>
                      <button type="button" className="res-boton-secundario" onClick={() => quitar(indice)}>
                        Quitar
                      </button>
                    </div>
                  )
                ))}
              </div>
            ))}

            {error && <p className="res-error" role="alert">{error}</p>}
            {mensaje && <p className="res-ok" role="status">{mensaje}</p>}

            <button type="button" className="res-boton" disabled={guardando} onClick={guardar}>
              {guardando ? "Guardando…" : "Guardar disponibilidad"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
