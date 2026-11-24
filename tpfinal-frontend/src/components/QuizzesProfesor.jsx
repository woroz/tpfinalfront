import { useEffect, useState } from "react";
import {
  crearQuiz,
  obtenerQuizzesClase,
  cambiarEstadoQuiz,
  obtenerResultadosQuiz,
  obtenerDetalleIntentoQuiz,
} from "../services/api.js";

import "../styles/quizzesProfesor.css";

const nuevaPregunta = () => ({
  enunciado: "",
  opciones: [
    { texto: "", es_correcto: true },
    { texto: "", es_correcto: false },
  ],
});

function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";

  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function QuizzesProfesor({ clase }) {
  const idClase = clase?.id_clase;

  const [quizzes, setQuizzes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [preguntas, setPreguntas] = useState([nuevaPregunta()]);

  const [modalResultados, setModalResultados] = useState(false);
  const [quizResultados, setQuizResultados] = useState(null);
  const [intentos, setIntentos] = useState([]);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [errorResultados, setErrorResultados] = useState("");
  const [intentoDetalle, setIntentoDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [revision, recargar] = useState(0);
  useEffect(() => {
    if (!idClase) return;
    let activo = true;
    obtenerQuizzesClase(idClase)
      .then(data => { if (activo) setQuizzes(data.quizzes || []); })
      .catch(err => { if (activo) setError(err.message || "No se pudieron cargar los quizzes."); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [idClase, revision]);

  function abrirModal() {
    setTitulo("");
    setPreguntas([nuevaPregunta()]);
    setError("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
  }

  function actualizarEnunciado(indice, valor) {
    setPreguntas((previas) =>
      previas.map((pregunta, i) =>
        i === indice ? { ...pregunta, enunciado: valor } : pregunta
      )
    );
  }

  function actualizarOpcion(indicePregunta, indiceOpcion, valor) {
    setPreguntas((previas) =>
      previas.map((pregunta, i) =>
        i === indicePregunta
          ? {
              ...pregunta,
              opciones: pregunta.opciones.map((opcion, j) =>
                j === indiceOpcion
                  ? { ...opcion, texto: valor }
                  : opcion
              ),
            }
          : pregunta
      )
    );
  }

  function marcarCorrecta(indicePregunta, indiceOpcion) {
    setPreguntas((previas) =>
      previas.map((pregunta, i) =>
        i === indicePregunta
          ? {
              ...pregunta,
              opciones: pregunta.opciones.map((opcion, j) => ({
                ...opcion,
                es_correcto: j === indiceOpcion,
              })),
            }
          : pregunta
      )
    );
  }

  function agregarPregunta() {
    if (preguntas.length >= 50) return;
    setPreguntas((previas) => [...previas, nuevaPregunta()]);
  }

  function eliminarPregunta(indice) {
    if (preguntas.length <= 1) return;
    setPreguntas((previas) =>
      previas.filter((_, i) => i !== indice)
    );
  }

  function agregarOpcion(indicePregunta) {
    setPreguntas((previas) =>
      previas.map((pregunta, i) =>
        i === indicePregunta && pregunta.opciones.length < 6
          ? {
              ...pregunta,
              opciones: [
                ...pregunta.opciones,
                { texto: "", es_correcto: false },
              ],
            }
          : pregunta
      )
    );
  }

  function eliminarOpcion(indicePregunta, indiceOpcion) {
    setPreguntas((previas) =>
      previas.map((pregunta, i) => {
        if (i !== indicePregunta || pregunta.opciones.length <= 2) {
          return pregunta;
        }

        let opciones = pregunta.opciones.filter(
          (_, j) => j !== indiceOpcion
        );

        if (!opciones.some((opcion) => opcion.es_correcto)) {
          opciones = opciones.map((opcion, j) => ({
            ...opcion,
            es_correcto: j === 0,
          }));
        }

        return { ...pregunta, opciones };
      })
    );
  }

  async function guardarQuiz(e) {
    e.preventDefault();
    setError("");

    if (!titulo.trim()) {
      setError("Ingresá un título para el quiz.");
      return;
    }

    for (let i = 0; i < preguntas.length; i++) {
      const pregunta = preguntas[i];

      if (!pregunta.enunciado.trim()) {
        setError(`Completá el enunciado de la pregunta ${i + 1}.`);
        return;
      }

      if (pregunta.opciones.some((opcion) => !opcion.texto.trim())) {
        setError(`Completá todas las opciones de la pregunta ${i + 1}.`);
        return;
      }

      if (
        pregunta.opciones.filter((opcion) => opcion.es_correcto).length !== 1
      ) {
        setError(`Marcá una sola respuesta correcta en la pregunta ${i + 1}.`);
        return;
      }
    }

    const datos = {
      id_clase: idClase,
      titulo: titulo.trim(),
      preguntas: preguntas.map((pregunta, indice) => ({
        enunciado: pregunta.enunciado.trim(),
        orden: indice + 1,
        opciones: pregunta.opciones.map((opcion) => ({
          texto: opcion.texto.trim(),
          es_correcto: opcion.es_correcto,
        })),
      })),
    };

    try {
      setGuardando(true);
      await crearQuiz(datos);
      setModalAbierto(false);
      setCargando(true);
      recargar(n => n + 1);
    } catch (err) {
      setError(err.message || "No se pudo crear el quiz.");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(quiz) {
    const nuevoEstado = !quiz.estado;

    try {
      setError("");
      await cambiarEstadoQuiz(quiz.id_quiz, nuevoEstado);

      setQuizzes((previos) =>
        previos.map((item) =>
          item.id_quiz === quiz.id_quiz
            ? { ...item, estado: nuevoEstado }
            : item
        )
      );
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado del quiz.");
    }
  }

  async function verResultados(quiz) {
    setQuizResultados(quiz);
    setModalResultados(true);
    setIntentos([]);
    setIntentoDetalle(null);
    setErrorResultados("");
    setCargandoResultados(true);

    try {
      const data = await obtenerResultadosQuiz(quiz.id_quiz);
      setIntentos(data.resultados?.intentos || []);
    } catch (err) {
      setErrorResultados(
        err.message || "No se pudieron cargar los resultados."
      );
    } finally {
      setCargandoResultados(false);
    }
  }

  async function verDetalleIntento(idIntento) {
    setCargandoDetalle(true);
    setErrorResultados("");
    setIntentoDetalle(null);

    try {
      const data = await obtenerDetalleIntentoQuiz(idIntento);
      setIntentoDetalle(data.intento);
    } catch (err) {
      setErrorResultados(
        err.message || "No se pudo cargar el detalle del intento."
      );
    } finally {
      setCargandoDetalle(false);
    }
  }

  function cerrarResultados() {
    setModalResultados(false);
    setQuizResultados(null);
    setIntentos([]);
    setIntentoDetalle(null);
    setErrorResultados("");
  }

  return (
    <section className="quizzes-profesor">
      <div className="quizzes-encabezado">
        <h3>Evaluaciones de la clase</h3>

        <button
          type="button"
          className="quiz-btn quiz-btn-principal"
          onClick={abrirModal}
        >
          + Crear quiz
        </button>
      </div>

      {cargando && <p>Cargando evaluaciones...</p>}

      {!cargando && error && !modalAbierto && (
        <p className="quiz-error">{error}</p>
      )}

      {!cargando && quizzes.length === 0 && (
        <p className="quiz-sin-resultados">
          Todavía no creaste evaluaciones para esta clase.
        </p>
      )}

      <div className="quizzes-lista">
        {quizzes.map((quiz) => (
          <article className="quiz-tarjeta" key={quiz.id_quiz}>
            <div className="quiz-info">
              <strong>{quiz.titulo}</strong>

              <p>
                {quiz._count?.preguntas ?? 0} preguntas ·{" "}
                {quiz._count?.intentos ?? 0} intentos
              </p>

              <span className={quiz.estado ? "quiz-activo" : "quiz-inactivo"}>
                {quiz.estado ? "Activo" : "Desactivado"}
              </span>
            </div>
            <div className="quiz-acciones-tarjeta">
              <button
                type="button"
                className="quiz-btn quiz-btn-resultados"
                onClick={() => verResultados(quiz)}
              >
                Ver resultados
              </button>

              <button
                type="button"
                className={`quiz-btn ${
                  quiz.estado ? "quiz-btn-desactivar" : "quiz-btn-activar"
                }`}
                onClick={() => cambiarEstado(quiz)}
              >
                {quiz.estado ? "Desactivar" : "Activar"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {modalAbierto && (
        <div
          className="quiz-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className="quiz-modal">
            <div className="quiz-modal-encabezado">
              <h2>Crear evaluación</h2>

              <button
                type="button"
                className="quiz-modal-cerrar"
                onClick={cerrarModal}
                disabled={guardando}
              >
                ×
              </button>
            </div>

            <form onSubmit={guardarQuiz}>
              <label className="quiz-label" htmlFor="quiz-titulo">
                Título del quiz
              </label>

              <input
                id="quiz-titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={100}
                placeholder="Ej: Evaluación de ecuaciones"
                className="quiz-campo"
              />

              <div className="quiz-preguntas">
                <h3>Preguntas</h3>

                {preguntas.map((pregunta, indicePregunta) => (
                  <div className="quiz-pregunta" key={indicePregunta}>
                    <div className="quiz-pregunta-encabezado">
                      <strong>Pregunta {indicePregunta + 1}</strong>

                      {preguntas.length > 1 && (
                        <button
                          type="button"
                          className="quiz-btn quiz-btn-eliminar"
                          onClick={() => eliminarPregunta(indicePregunta)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <textarea
                      value={pregunta.enunciado}
                      onChange={(e) =>
                        actualizarEnunciado(indicePregunta, e.target.value)
                      }
                      maxLength={1000}
                      placeholder="Escribí el enunciado de la pregunta..."
                      rows={3}
                      className="quiz-campo quiz-textarea"
                    />

                    <p className="quiz-ayuda">
                      Marcá la opción correcta:
                    </p>

                    {pregunta.opciones.map((opcion, indiceOpcion) => (
                      <div className="quiz-opcion" key={indiceOpcion}>
                        <input
                          type="radio"
                          name={`correcta-${indicePregunta}`}
                          checked={opcion.es_correcto}
                          onChange={() =>
                            marcarCorrecta(indicePregunta, indiceOpcion)
                          }
                        />

                        <input
                          type="text"
                          value={opcion.texto}
                          onChange={(e) =>
                            actualizarOpcion(
                              indicePregunta,
                              indiceOpcion,
                              e.target.value
                            )
                          }
                          maxLength={300}
                          placeholder={`Opción ${indiceOpcion + 1}`}
                          className="quiz-campo"
                        />

                        {pregunta.opciones.length > 2 && (
                          <button
                            type="button"
                            className="quiz-opcion-eliminar"
                            onClick={() =>
                              eliminarOpcion(indicePregunta, indiceOpcion)
                            }
                            title="Eliminar opción"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    {pregunta.opciones.length < 6 && (
                      <button
                        type="button"
                        className="quiz-btn quiz-btn-secundario"
                        onClick={() => agregarOpcion(indicePregunta)}
                      >
                        + Agregar opción
                      </button>
                    )}
                  </div>
                ))}

                {preguntas.length < 50 && (
                  <button
                    type="button"
                    className="quiz-btn quiz-btn-secundario"
                    onClick={agregarPregunta}
                  >
                    + Agregar pregunta
                  </button>
                )}
              </div>

              {error && <p className="quiz-error">{error}</p>}
              <div className="quiz-modal-acciones">
                <button
                  type="button"
                  className="quiz-btn quiz-btn-secundario"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="quiz-btn quiz-btn-principal"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
{modalResultados && (
        <div
          className="quiz-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarResultados();
          }}
        >
          <div className="quiz-modal quiz-modal-resultados">
            <div className="quiz-modal-encabezado">
              <h2>
                {intentoDetalle
                  ? "Respuestas del alumno"
                  : `Resultados: ${quizResultados?.titulo}`}
              </h2>

              <button
                type="button"
                className="quiz-modal-cerrar"
                onClick={cerrarResultados}
              >
                ×
              </button>
            </div>

            {errorResultados && (
              <p className="quiz-error">{errorResultados}</p>
            )}

            {cargandoResultados && (
              <p>Cargando resultados...</p>
            )}

            {cargandoDetalle && (
              <p>Cargando respuestas...</p>
            )}

            {!cargandoResultados && !intentoDetalle && (
              <>
                {intentos.length === 0 ? (
                  <p className="quiz-sin-resultados">
                    Todavía ningún alumno respondió esta evaluación.
                  </p>
                ) : (
                  <div className="quiz-resultados-lista">
                    {intentos.map((intento, index) => (
                      <article
                        className="quiz-resultado-alumno"
                        key={intento.id_intento}
                      >
                        <div>
                          <strong>
                            {intento.alumno?.usuario?.nombre ||
                              `Alumno ${index + 1}`}
                          </strong>

                          <p>
                            Nota: <b>{intento.puntaje}/10</b>
                          </p>

                          <small>
                            Realizado el {formatearFecha(intento.fecha_fin)}
                          </small>
                        </div>

                        <button
                          type="button"
                          className="quiz-btn quiz-btn-resultados"
                          onClick={() =>
                            verDetalleIntento(intento.id_intento)
                          }
                        >
                          Ver respuestas
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            {!cargandoDetalle && intentoDetalle && (
              <div className="quiz-detalle-intento">
                <div className="quiz-detalle-puntaje">
                  <span>Calificación obtenida</span>
                  <strong>{intentoDetalle.puntaje}/10</strong>
                </div>

                <p className="quiz-detalle-fecha">
                  Realizado el {formatearFecha(intentoDetalle.fecha_fin)}
                </p>

                <h3>Revisión de respuestas</h3>

                {intentoDetalle.respuestas?.map((respuesta, index) => (
                  <article
                    className={`quiz-detalle-respuesta ${
                      respuesta.opcion_seleccionada?.es_correcto
                        ? "quiz-respuesta-correcta"
                        : "quiz-respuesta-incorrecta"
                    }`}
                    key={respuesta.id_pregunta}
                  >
                    <strong>
                      {index + 1}. {respuesta.enunciado}
                    </strong>

                    <p>
                      <b>Respuesta del alumno:</b>{" "}
                      {respuesta.opcion_seleccionada?.texto ||
                        "Sin respuesta"}
                    </p>

                    {!respuesta.opcion_seleccionada?.es_correcto && (
                      <p>
                        <b>Respuesta correcta:</b>{" "}
                        {respuesta.opciones_correctas
                          ?.map((opcion) => opcion.texto)
                          .join(", ") || "No disponible"}
                      </p>
                    )}

                    <span>
                      {respuesta.opcion_seleccionada?.es_correcto
                        ? "✓ Correcta"
                        : "✗ Incorrecta"}
                    </span>
                  </article>
                ))}

                <button
                  type="button"
                  className="quiz-btn quiz-btn-secundario quiz-volver-resultados"
                  onClick={() => setIntentoDetalle(null)}
                >
                  ← Volver a los resultados
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}