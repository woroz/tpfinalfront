import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Calendario from "../components/Calendario";
import Navbar from "../components/Navbar";
import { crearInscripcion, obtenerHorariosProfesor } from "../services/api";
import {
  formatearFechaDeDia,
  formatearHora,
  formatearPrecio,
  hoyLocal,
  sumarDias,
} from "../utils/fechas";

const DIAS_VISIBLES = 60;

export default function ReservarClase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inicioInicial = useRef(params.get("inicio"));
  const materiaInicial = useRef(params.get("materia"));
  const [agenda, setAgenda] = useState(null);
  const [version, setVersion] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [fecha, setFecha] = useState(null);
  const [horario, setHorario] = useState(null);
  const [materia, setMateria] = useState("");
  const [tema, setTema] = useState("");
  const [enviando, setEnviando] = useState(false);

  const minimo = useMemo(() => hoyLocal(), []);
  const maximo = useMemo(() => sumarDias(minimo, DIAS_VISIBLES - 1), [minimo]);

  useEffect(() => {
    let activo = true;
    obtenerHorariosProfesor(id, minimo, maximo)
      .then((data) => {
        if (!activo) return;
        setAgenda(data);
        const materiaInicialAgenda = materiaInicial.current || data.profesor.materias[0]?.id_materia || "";
        setMateria((actual) => actual || materiaInicialAgenda);
        materiaInicial.current = null;
        if (inicioInicial.current) {
          const dia = data.dias.find((item) => item.horarios.some((h) =>
            h.inicio === inicioInicial.current
            && (!h.id_materia || h.id_materia === materiaInicialAgenda)
          ));
          if (dia) {
            setFecha(dia.fecha);
            setHorario(dia.horarios.find((h) =>
              h.inicio === inicioInicial.current
              && (!h.id_materia || h.id_materia === materiaInicialAgenda)
            ));
          }
          inicioInicial.current = null;
        }
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
  }, [id, minimo, maximo, version]);

  const diasDisponibles = useMemo(
    () => new Set((agenda?.dias || [])
      .filter((dia) => dia.horarios.some((item) => !item.id_materia || item.id_materia === materia))
      .map((dia) => dia.fecha)),
    [agenda, materia],
  );
  const horariosDelDia = useMemo(
    () => (agenda?.dias.find((dia) => dia.fecha === fecha)?.horarios || [])
      .filter((item) => !item.id_materia || item.id_materia === materia),
    [agenda, fecha, materia],
  );

  function elegirFecha(nuevaFecha) {
    setFecha(nuevaFecha);
    setHorario(null);
  }

  async function confirmar() {
    setEnviando(true);
    setError("");
    try {
      const data = await crearInscripcion({
        id_profesor: id,
        id_materia: materia,
        inicio: horario.inicio,
        tema: tema.trim() || undefined,
        plataforma: "web",
      });
      if (data.urlPago) {
        window.location.assign(data.urlPago);
        return;
      }
      navigate("/mis-clases", { replace: true });
    } catch (err) {
      setError(err.message);
      setHorario(null);
      setVersion((actual) => actual + 1);
    } finally {
      setEnviando(false);
    }
  }

  const profesor = agenda?.profesor;
  const precio = profesor?.precio_clase ?? 0;
  const puedeConfirmar = Boolean(horario && materia && !enviando);

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor">
        <Link className="res-volver" to={`/profesores/${id}`}>Volver al perfil</Link>

        {cargando && <p className="res-mensaje">Cargando horarios…</p>}

        {profesor && (
          <>
            <header className="res-encabezado">
              <h1>Reservar clase con {profesor.nombre}</h1>
              <p>
                Clases de {profesor.duracion_min} minutos · {formatearPrecio(precio)}
              </p>
            </header>

            {error && <p className="res-error" role="alert">{error}</p>}

            {!profesor.materias.length && (
              <div className="res-tarjeta reservar-sin-materias">
                <h2>Este profesor todavía no indicó qué materias dicta</h2>
                <p>
                  La reserva necesita una materia para poder coordinar la clase. El profesor tiene que agregarla a su perfil antes de que puedas reservar.
                </p>
              </div>
            )}

            {profesor.materias.length > 0 && !agenda.dias.length && (
              <p className="res-mensaje">
                Este profesor no tiene horarios disponibles en los próximos {DIAS_VISIBLES} días.
              </p>
            )}

            {profesor.materias.length > 0 && agenda.dias.length > 0 && (
              <>
                <div className="res-tarjeta reservar-materia-selector">
                  <label className="res-etiqueta" htmlFor="res-materia">Materia</label>
                  <select
                    id="res-materia"
                    className="res-campo"
                    value={materia}
                    onChange={(event) => {
                      setMateria(event.target.value);
                      setFecha(null);
                      setHorario(null);
                    }}
                  >
                    {profesor.materias.map((item) => (
                      <option key={item.id_materia} value={item.id_materia}>{item.nombre}</option>
                    ))}
                  </select>
                  <p className="res-nota">El calendario muestra únicamente los horarios habilitados para esta materia.</p>
                </div>

                {!diasDisponibles.size ? (
                  <p className="res-mensaje reservar-sin-horarios">
                    Este profesor no tiene horarios para esta materia en los próximos {DIAS_VISIBLES} días.
                  </p>
                ) : (
                  <div className="res-layout">
                    <div className="res-tarjeta">
                      <h2>1. Elegí el día</h2>
                      <Calendario
                        diasDisponibles={diasDisponibles}
                        seleccionada={fecha}
                        onSeleccionar={elegirFecha}
                        minimo={minimo}
                        maximo={maximo}
                      />
                    </div>

                    <div className="res-tarjeta">
                      <h2>2. Elegí el horario</h2>
                      {!fecha && <p className="res-mensaje">Seleccioná un día disponible en el calendario.</p>}
                      {fecha && (
                        <>
                          <p className="res-fecha-elegida">{formatearFechaDeDia(fecha)}</p>
                          <div className="res-horarios">
                            {horariosDelDia.map((item) => (
                              <button
                                key={item.inicio}
                                type="button"
                                className={horario?.inicio === item.inicio ? "res-horario activo" : "res-horario"}
                                onClick={() => setHorario(item)}
                              >
                                {formatearHora(item.inicio)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      <h2>3. Confirmá</h2>
                      <label className="res-etiqueta" htmlFor="res-tema">Tema a repasar (opcional)</label>
                      <input
                        id="res-tema"
                        className="res-campo"
                        type="text"
                        maxLength={200}
                        value={tema}
                        onChange={(event) => setTema(event.target.value)}
                        placeholder="Por ejemplo: derivadas"
                      />

                      {horario && (
                        <p className="res-resumen">
                          {formatearFechaDeDia(fecha)} a las {formatearHora(horario.inicio)} · {formatearPrecio(precio)}
                        </p>
                      )}

                      <button
                        type="button"
                        className="res-boton"
                        disabled={!puedeConfirmar}
                        onClick={confirmar}
                      >
                        {enviando
                          ? "Procesando…"
                          : precio > 0 ? "Continuar al pago" : "Confirmar reserva"}
                      </button>
                      {precio > 0 && (
                        <p className="res-nota">
                          Te vamos a redirigir a Mercado Pago. Tenés 15 minutos para completar el pago y mantener el horario.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!cargando && !profesor && error && <p className="res-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
