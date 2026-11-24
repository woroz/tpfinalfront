import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  obtenerQuizzesClase,
  obtenerQuiz,
  responderQuiz,
  obtenerMisIntentosQuiz,
  obtenerDetalleIntentoQuiz,
} from "../services/api";
import "../styles/quizzesAlumno.css";

function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";

  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function QuizzesAlumno({ idClase }) {
  const [quizzes, setQuizzes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [quizActual, setQuizActual] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [intentos, setIntentos] = useState([]);
  const [intentoActual, setIntentoActual] = useState(null);

  const [cargandoQuiz, setCargandoQuiz] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarQuizzes() {
      setCargando(true);
      setError("");

      try {
        const data = await obtenerQuizzesClase(idClase);

        if (activo) {
          setQuizzes(data.quizzes || []);
        }
      } catch (err) {
        if (activo) {
          setError(err.message || "No se pudieron cargar las evaluaciones.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    if (idClase) cargarQuizzes();

    return () => {
      activo = false;
    };
  }, [idClase]);

  async function abrirQuiz(idQuiz) {
    setModalAbierto(true);
    setCargandoQuiz(true);
    setErrorModal("");
    setQuizActual(null);
    setIntentoActual(null);
    setRespuestas({});
    setIntentos([]);

    try {
      const [dataQuiz, dataIntentos] = await Promise.all([
        obtenerQuiz(idQuiz),
        obtenerMisIntentosQuiz(idQuiz),
      ]);

      setQuizActual(dataQuiz.quiz);
      setIntentos(dataIntentos.intentos || []);
    } catch (err) {
      setErrorModal(err.message || "No se pudo cargar el quiz.");
    } finally {
      setCargandoQuiz(false);
    }
  }

  function seleccionarRespuesta(idPregunta, idOpcion) {
    setRespuestas((actuales) => ({
      ...actuales,
      [idPregunta]: idOpcion,
    }));
  }

  async function enviarRespuestas(event) {
    event.preventDefault();

    if (!quizActual) return;

    const preguntasSinResponder = quizActual.preguntas.filter(
      (pregunta) => !respuestas[pregunta.id_pregunta]
    );

    if (preguntasSinResponder.length > 0) {
      setErrorModal("Tenés que responder todas las preguntas antes de enviar.");
      return;
    }

    setEnviando(true);
    setErrorModal("");

    try {
      const respuestasEnviar = quizActual.preguntas.map((pregunta) => ({
        id_pregunta: pregunta.id_pregunta,
        id_opcion: respuestas[pregunta.id_pregunta],
      }));

      const data = await responderQuiz(
        quizActual.id_quiz,
        respuestasEnviar
      );

      const detalle = await obtenerDetalleIntentoQuiz(
        data.intento.id_intento
      );

      setIntentoActual(detalle.intento);

      const dataIntentos = await obtenerMisIntentosQuiz(
        quizActual.id_quiz
      );

      setIntentos(dataIntentos.intentos || []);
    } catch (err) {
      setErrorModal(err.message || "No se pudieron enviar las respuestas.");
    } finally {
      setEnviando(false);
    }
  }

  async function verIntento(idIntento) {
    setCargandoQuiz(true);
    setErrorModal("");
    setIntentoActual(null);

    try {
      const data = await obtenerDetalleIntentoQuiz(idIntento);
      setIntentoActual(data.intento);
    } catch (err) {
      setErrorModal(err.message || "No se pudo cargar el intento.");
    } finally {
      setCargandoQuiz(false);
    }
  }

  function cerrarModal() {
    if (enviando) return;

    setModalAbierto(false);
    setQuizActual(null);
    setIntentoActual(null);
    setRespuestas({});
    setErrorModal("");
  }

  return (
    <section className="quizzes-alumno">
      <h3>Evaluaciones de la clase</h3>

      {cargando && <p>Cargando evaluaciones...</p>}

      {error && (
        <p className="quiz-alumno-error" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && quizzes.length === 0 && (
        <p className="quiz-alumno-vacio">
          El profesor todavía no publicó evaluaciones para esta clase.
        </p>
      )}

      <div className="quizzes-alumno-lista">
        {quizzes.map((quiz) => (
          <article className="quiz-alumno-tarjeta" key={quiz.id_quiz}>
            <div className="quiz-alumno-info">
              <h4>{quiz.titulo}</h4>

              <p>
                {quiz._count?.preguntas || 0} preguntas
              </p>

              <small>
                Publicado el {formatearFecha(quiz.fecha_creacion)}
              </small>
            </div>

            <button
              type="button"
              className="quiz-alumno-boton"
              onClick={() => abrirQuiz(quiz.id_quiz)}
            >
              Ver evaluación
            </button>
          </article>
        ))}
      </div>

      {modalAbierto && createPortal(
        <div className="quiz-alumno-overlay" onClick={cerrarModal}>
          <section
            className="quiz-alumno-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-alumno-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="quiz-alumno-modal-encabezado">
              <h3 id="quiz-alumno-titulo">
                {intentoActual
                  ? "Resultado de la evaluación"
                  : quizActual?.titulo || "Evaluación"}
              </h3>

              <button
                type="button"
                className="quiz-alumno-cerrar"
                onClick={cerrarModal}
                disabled={enviando}
                aria-label="Cerrar"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {cargandoQuiz && (
              <p className="quiz-alumno-mensaje">
                Cargando información...
              </p>
            )}

            {errorModal && (
              <p className="quiz-alumno-error" role="alert">
                {errorModal}
              </p>
            )}

            {!cargandoQuiz && intentoActual && (
              <div className="quiz-alumno-resultado">
                <div className="quiz-alumno-puntaje">
                  <span>Tu calificación</span>
                  <strong>{intentoActual.puntaje}/10</strong>
                </div>

                <p className="quiz-alumno-fecha">
                  Realizado el {formatearFecha(intentoActual.fecha_fin)}
                </p>

                <h4>Revisión de tus respuestas</h4>

                <div className="quiz-alumno-revision">
                  {intentoActual.respuestas?.map((respuesta, index) => {
                    const correcta = respuesta.opcion_seleccionada?.es_correcto;

                    return (
                      <article
                        className={`quiz-alumno-respuesta ${
                          correcta ? "respuesta-correcta" : "respuesta-incorrecta"
                        }`}
                        key={respuesta.id_pregunta}
                      >
                        <strong>
                          {index + 1}. {respuesta.enunciado}
                        </strong>

                        <p>
                          <b>Tu respuesta:</b>{" "}
                          {respuesta.opcion_seleccionada?.texto ||
                            "Sin respuesta"}
                        </p>

                        {!correcta && (
                          <p>
                            <b>Respuesta correcta:</b>{" "}
                            {respuesta.opciones_correctas
                              ?.map((opcion) => opcion.texto)
                              .join(", ") || "No disponible"}
                          </p>
                        )}

                        <span>
                          {correcta ? "✓ Correcta" : "✗ Incorrecta"}
                        </span>
                      </article>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="quiz-alumno-boton-secundario"
                  onClick={() => setIntentoActual(null)}
                >
                  Volver a la evaluación
                </button>
              </div>
            )}

            {!cargandoQuiz && !intentoActual && quizActual && (
              <>
                <form onSubmit={enviarRespuestas}>
                  <p className="quiz-alumno-instruccion">
                    Seleccioná una opción para cada pregunta y enviá tus respuestas.
                  </p>

                  <div className="quiz-alumno-preguntas">
                    {quizActual.preguntas?.map((pregunta, index) => (
                      <fieldset
                        className="quiz-alumno-pregunta"
                        key={pregunta.id_pregunta}
                      >
                        <legend>
                          {index + 1}. {pregunta.enunciado}
                        </legend>

                        {pregunta.opciones?.map((opcion) => (
                          <label
                            className="quiz-alumno-opcion"
                            key={opcion.id_opcion}
                          >
                            <input
                              type="radio"
                              name={`pregunta-${pregunta.id_pregunta}`}
                              value={opcion.id_opcion}
                              checked={
                                respuestas[pregunta.id_pregunta] ===
                                opcion.id_opcion
                              }
                              onChange={() =>
                                seleccionarRespuesta(
                                  pregunta.id_pregunta,
                                  opcion.id_opcion
                                )
                              }
                            />

                            <span>{opcion.texto}</span>
                          </label>
                        ))}
                      </fieldset>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="quiz-alumno-boton quiz-alumno-enviar"
                    disabled={enviando}
                  >
                    {enviando ? "Enviando respuestas..." : "Enviar respuestas"}
                  </button>
                </form>

                {intentos.length > 0 && (
                  <section className="quiz-alumno-intentos">
                    <h4>Mis intentos anteriores</h4>

                    {intentos.map((intento, index) => (
                      <div
                        className="quiz-alumno-intento"
                        key={intento.id_intento}
                      >
                        <div>
                          <strong>Intento {intentos.length - index}</strong>
                          <span>
                            {formatearFecha(intento.fecha_fin)}
                          </span>
                          <span>Nota: {intento.puntaje}/10</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => verIntento(intento.id_intento)}
                        >
                          Ver respuestas
                        </button>
                      </div>
                    ))}
                  </section>
                )}
              </>
            )}
          </section>
        </div>, document.body
      )}
    </section>
  );
}