import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { asociarMateriaProfesor, obtenerMaterias, obtenerMateriasProfesor } from "../services/api";

export default function MateriasProfesor() {
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [materiasDictadas, setMateriasDictadas] = useState([]);
  const [seleccionada, setSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activa = true;
    Promise.all([obtenerMaterias(), obtenerMateriasProfesor()])
      .then(([catalogo, propias]) => {
        if (!activa) return;
        setMateriasDisponibles(catalogo.materias || []);
        setMateriasDictadas(propias.materias || []);
      })
      .catch((err) => {
        if (activa) setError(err.message);
      })
      .finally(() => {
        if (activa) setCargando(false);
      });
    return () => {
      activa = false;
    };
  }, []);

  const materiasParaAgregar = materiasDisponibles.filter(
    (materia) => !materiasDictadas.some((propia) => propia.id_materia === materia.id_materia),
  );

  async function agregarMateria(event) {
    event.preventDefault();
    if (!seleccionada) {
      setError("Elegí una materia para agregar a tu perfil.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      await asociarMateriaProfesor(seleccionada);
      const materia = materiasDisponibles.find((item) => item.id_materia === seleccionada);
      if (materia) {
        setMateriasDictadas((actuales) => [...actuales, materia]);
        setMensaje(`${materia.nombreMateria} ya figura entre las materias que dictás.`);
      } else {
        setMensaje("La materia se agregó a tu perfil.");
      }
      setSeleccionada("");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor materias-profesor-page">
        <Link className="res-volver" to="/profesor">Volver a clases programadas</Link>
        <header className="res-encabezado">
          <h1>Materias que dictás</h1>
          <p>
            Agregá a tu perfil las materias en las que das clases. Así los alumnos sabrán qué pueden estudiar con vos.
          </p>
        </header>

        {cargando && <p className="res-mensaje">Cargando materias…</p>}

        {!cargando && (
          <>
            <section className="res-tarjeta materias-profesor-agregar">
              <h2>Agregar una materia a mi perfil</h2>
              <p>Elegí una materia del catálogo. Agregarla no crea una clase ni un horario; eso se configura por separado.</p>
              {!materiasParaAgregar.length ? (
                <p className="res-mensaje">
                  {materiasDisponibles.length
                    ? "Ya agregaste todas las materias disponibles."
                    : "Todavía no hay materias en el catálogo. Podés cargar una nueva desde “Crear clase”."}
                </p>
              ) : (
                <form className="materias-profesor-form" onSubmit={agregarMateria}>
                  <select
                    className="res-campo"
                    value={seleccionada}
                    onChange={(event) => setSeleccionada(event.target.value)}
                    aria-label="Seleccionar una materia para agregar"
                  >
                    <option value="">Elegí una materia</option>
                    {materiasParaAgregar.map((materia) => (
                      <option key={materia.id_materia} value={materia.id_materia}>
                        {materia.nombreMateria}
                        {materia.areaConocimiento?.nombreArea ? ` · ${materia.areaConocimiento.nombreArea}` : ""}
                      </option>
                    ))}
                  </select>
                  <button className="res-boton-secundario" type="submit" disabled={!seleccionada || guardando}>
                    {guardando ? "Agregando…" : "Agregar a mis materias"}
                  </button>
                </form>
              )}
              {error && <p className="res-error" role="alert">{error}</p>}
              {mensaje && <p className="res-ok" role="status">{mensaje}</p>}
            </section>

            <section className="res-tarjeta materias-profesor-listado">
              <h2>Las materias de tu perfil</h2>
              {!materiasDictadas.length ? (
                <p className="res-mensaje">Todavía no agregaste materias. Cuando las agregues, aparecerán acá.</p>
              ) : (
                <ul className="materias-profesor-lista">
                  {materiasDictadas.map((materia) => (
                    <li key={materia.id_materia}>
                      <strong>{materia.nombreMateria}</strong>
                      {materia.areaConocimiento?.nombreArea && <span>{materia.areaConocimiento.nombreArea}</span>}
                    </li>
                  ))}
                </ul>
              )}
              <Link className="res-boton materias-profesor-disponibilidad" to="/profesor/disponibilidad">
                Configurar mis horarios
              </Link>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
