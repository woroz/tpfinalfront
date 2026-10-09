import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import professorImage from "../assets/profesor.png";
import { useAuth } from "../context/authContext";
import { obtenerHorariosProfesor, obtenerPerfilProfesor } from "../services/api";
import {
  formatearFecha,
  formatearFechaDeDia,
  formatearHora,
  formatearPrecio,
  hoyLocal,
  sumarDias,
} from "../utils/fechas";

const DIAS_SEMANA = [
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miércoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sábado" },
  { valor: 0, nombre: "Domingo" },
];

const DIAS_PROXIMOS = 14;
const DIAS_MOSTRADOS = 5;

export default function PerfilProfesor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [agenda, setAgenda] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const hoy = useMemo(() => hoyLocal(), []);

  useEffect(() => {
    let activo = true;
    Promise.allSettled([
      obtenerPerfilProfesor(id),
      obtenerHorariosProfesor(id, hoy, sumarDias(hoy, DIAS_PROXIMOS - 1)),
    ]).then(([perfilResultado, agendaResultado]) => {
      if (!activo) return;
      if (perfilResultado.status === "rejected") {
        setError(perfilResultado.reason.message);
      } else {
        setPerfil(perfilResultado.value.perfil);
      }
      if (agendaResultado.status === "fulfilled") setAgenda(agendaResultado.value);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [id, hoy]);

  const esAlumno = usuario?.rol === "alumno";
  const franjasPorDia = useMemo(() => {
    const mapa = new Map();
    (perfil?.disponibilidad || []).forEach((franja) => {
      mapa.set(franja.diaSemana, [...(mapa.get(franja.diaSemana) || []), franja]);
    });
    return mapa;
  }, [perfil]);
  const nombresMaterias = useMemo(() => new Map(
    (perfil?.materias || []).map((item) => [
      item.materia?.id_materia || item.id_materia,
      item.materia?.nombreMateria || item.nombreMateria,
    ]),
  ), [perfil]);

  if (cargando) {
    return (
      <main className="app-page">
        <Navbar />
        <section className="res-contenedor">
          <p className="res-mensaje">Cargando perfil…</p>
        </section>
      </main>
    );
  }

  if (!perfil) {
    return (
      <main className="app-page">
        <Navbar />
        <section className="res-contenedor">
          <Link className="res-volver" to="/buscar">Volver al mapa</Link>
          <p className="res-error" role="alert">{error || "No pudimos cargar el perfil."}</p>
        </section>
      </main>
    );
  }

  const nombre = perfil.usuario?.nombre || "Profesor";
  const materias = (perfil.materias || []).map((item) => item.materia?.nombreMateria).filter(Boolean);
  const diasProximos = (agenda?.dias || []).slice(0, DIAS_MOSTRADOS);
  const clases = perfil.clases || [];
  const resenas = (perfil.resenas || []).slice(0, 5);
  const promedio = perfil.promedioResenas;

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor">
        <Link className="res-volver" to="/buscar">Volver al mapa</Link>

        <header className="res-tarjeta perfil-cabecera">
          <img className="perfil-avatar" src={perfil.usuario?.perfil?.avatarURL || professorImage} alt="" />
          <div className="perfil-datos">
            <h1>{nombre}</h1>
            <p className="perfil-linea">
              {perfil.tarifa != null ? `${formatearPrecio(perfil.tarifa)} por hora` : "Tarifa no informada"}
            </p>
            <p className="perfil-linea">
              {promedio != null
                ? `${promedio.toFixed(1).replace(".", ",")} de 5 según ${perfil.resenas.length} ${perfil.resenas.length === 1 ? "reseña" : "reseñas"}`
                : "Todavía no tiene reseñas"}
            </p>
            {materias.length > 0 && (
              <ul className="perfil-chips">
                {materias.map((materia) => (
                  <li key={materia}>{materia}</li>
                ))}
              </ul>
            )}
            <p className="perfil-descripcion">
              {perfil.descripcion || perfil.usuario?.perfil?.biografia || "Este profesor todavía no agregó una descripción."}
            </p>
          </div>
          {esAlumno && (
            <button
              type="button"
              className="res-boton perfil-reservar"
              onClick={() => navigate(`/profesores/${id}/reservar`)}
            >
              Reservar clase
            </button>
          )}
        </header>

        <div className="res-layout perfil-grilla">
          <div className="res-tarjeta">
            <h2>Próximos horarios libres</h2>
            {!diasProximos.length && (
              <p className="res-mensaje">No hay horarios libres en los próximos {DIAS_PROXIMOS} días.</p>
            )}
            {diasProximos.map((dia) => (
              <div key={dia.fecha} className="perfil-dia">
                <p className="perfil-dia-titulo">{formatearFechaDeDia(dia.fecha)}</p>
                <div className="perfil-horas">
                  {dia.horarios.map((horario) => (
                    esAlumno ? (
                      <Link
                        key={`${horario.inicio}-${horario.id_materia || "todas"}`}
                        className="res-horario"
                        to={`/profesores/${id}/reservar?inicio=${encodeURIComponent(horario.inicio)}${horario.id_materia ? `&materia=${encodeURIComponent(horario.id_materia)}` : ""}`}
                      >
                        {formatearHora(horario.inicio)}
                        {` · ${horario.id_materia ? nombresMaterias.get(horario.id_materia) || "Materia" : "Todas"}`}
                      </Link>
                    ) : (
                      <span key={`${horario.inicio}-${horario.id_materia || "todas"}`} className="res-horario perfil-hora-fija">
                        {formatearHora(horario.inicio)}
                        {` · ${horario.id_materia ? nombresMaterias.get(horario.id_materia) || "Materia" : "Todas"}`}
                      </span>
                    )
                  ))}
                </div>
              </div>
            ))}
            {esAlumno && agenda?.dias.length > DIAS_MOSTRADOS && (
              <Link className="perfil-enlace" to={`/profesores/${id}/reservar`}>
                Ver todos los horarios en el calendario
              </Link>
            )}
          </div>

          <div className="res-tarjeta">
            <h2>Horario de atención</h2>
            <ul className="perfil-semana">
              {DIAS_SEMANA.map((dia) => {
                const franjas = franjasPorDia.get(dia.valor);
                return (
                  <li key={dia.valor}>
                    <span>{dia.nombre}</span>
                    <span className={franjas ? "" : "perfil-sin-atencion"}>
                      {franjas
                        ? franjas.map((franja) => {
                          const materia = franja.id_materia
                            ? nombresMaterias.get(franja.id_materia) || "Materia"
                            : "Todas las materias";
                          return `${materia}: ${franja.desde} a ${franja.hasta}`;
                        }).join(" · ")
                        : "No atiende"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="res-tarjeta perfil-bloque">
          <h2>Clases publicadas</h2>
          {!clases.length && (
            <p className="res-mensaje">
              Este profesor no tiene clases publicadas por ahora. Podés reservar uno de sus horarios libres.
            </p>
          )}
          <ul className="res-lista">
            {clases.map((clase) => (
              <li key={clase.id_clase} className="res-item perfil-clase">
                <div>
                  <h3>{clase.titulo}</h3>
                  <p>{clase.materia?.nombreMateria} - {clase.tema}</p>
                  <p>
                    {formatearFecha(clase.fecha_hora_inicio)}, de {formatearHora(clase.fecha_hora_inicio)} a {formatearHora(clase.fecha_hora_fin)}
                  </p>
                </div>
                <div className="res-item-lado">
                  <span className="res-estado disponible">Pendiente</span>
                  <small>{formatearPrecio(clase.precio)}</small>
                  <small>Cupo de {clase.cupo_maximo}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {resenas.length > 0 && (
          <div className="res-tarjeta perfil-bloque">
            <h2>Reseñas de alumnos</h2>
            <ul className="perfil-resenas">
              {resenas.map((resena) => (
                <li key={resena.id_resena}>
                  <strong>{resena.alumno?.usuario?.nombre || "Alumno"}</strong>
                  <span>{resena.puntaje} de 5</span>
                  {resena.comentario && <p>{resena.comentario}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
