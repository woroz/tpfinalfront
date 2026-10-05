import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { guardarMiDisponibilidad, obtenerMiDisponibilidad } from "../services/api";

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
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerMiDisponibilidad()
      .then((data) => {
        if (activo) setFranjas(data.franjas);
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
    setFranjas((actuales) => [...actuales, { diaSemana, desde: "09:00", hasta: "13:00" }]);
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
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const data = await guardarMiDisponibilidad(franjas);
      setFranjas(data.franjas);
      setMensaje("Disponibilidad guardada");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

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
