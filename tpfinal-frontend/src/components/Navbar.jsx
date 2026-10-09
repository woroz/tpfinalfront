import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/mentorar.png";
import { useAuth } from "../context/authContext";
import { marcarNotificacionLeida, obtenerNotificaciones } from "../services/api";

function getUserName(user) {
  return user?.nombre || user?.email || "Usuario";
}

function getInitials(user) {
  return getUserName(user)
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getAvatarColor(user) {
  const hash = [...getUserName(user)].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  const colors = ["#3b6fd6", "#7b61c9", "#d46b4c", "#2c9a8a", "#c48b35"];
  return colors[hash % colors.length];
}

function claseLink({ isActive }) {
  return isActive ? "navbar-link active" : "navbar-link";
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [errorNotificaciones, setErrorNotificaciones] = useState("");
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario) return undefined;
    let activo = true;
    async function cargarNotificaciones() {
      try {
        const data = await obtenerNotificaciones();
        if (activo) {
          setNotificaciones(data.notificaciones || []);
          setErrorNotificaciones("");
        }
      } catch (err) {
        if (activo) setErrorNotificaciones(err.message);
      }
    }
    cargarNotificaciones();
    const intervalo = window.setInterval(cargarNotificaciones, 60000);
    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, [usuario]);

  function handleLogout() {
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  async function marcarLeida(idNotificacion) {
    try {
      await marcarNotificacionLeida(idNotificacion);
      setNotificaciones((actuales) => actuales.map((item) =>
        item.id_notificacion === idNotificacion ? { ...item, leida: true } : item
      ));
    } catch (err) {
      setErrorNotificaciones(err.message);
    }
  }

  const noLeidas = notificaciones.filter((notificacion) => !notificacion.leida).length;

  return (
    <nav className="app-navbar">
      <NavLink className="navbar-logo" to="/inicio" aria-label="Ir al inicio">
        <img src={logo} alt="MentorAr" />
      </NavLink>

      <div className="navbar-links">
        <NavLink className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"} to="/inicio">
          Inicio
        </NavLink>
        {usuario?.rol !== "profesor" && (
          <NavLink className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"} to="/buscar">
            Buscar profesores
          </NavLink>
        )}
        {usuario?.rol === "alumno" && (
          <>
            <NavLink className={claseLink} to="/mis-clases">
              Mis clases
            </NavLink>
            <NavLink className={claseLink} to="/mis-pagos">
              Mis pagos
            </NavLink>
          </>
        )}
        {usuario?.rol === "profesor" && (
          <>
            <NavLink className={claseLink} to="/profesor" end>
              Clases programadas
            </NavLink>
            <NavLink className={claseLink} to="/profesor/disponibilidad">
              Disponibilidad
            </NavLink>
            <NavLink className={claseLink} to="/profesor/materias">
              Mis materias
            </NavLink>
            <NavLink className={claseLink} to="/profesor/crear-clase">
              Crear clase
            </NavLink>
          </>
        )}
        <NavLink className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"} to="/tablon">
          Tablón de anuncios
        </NavLink>
        <NavLink className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"} to="/biblioteca">
          Biblioteca
        </NavLink>
        <NavLink className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"} to="/reportar">
          Reportar
        </NavLink>
      </div>

      <div className="navbar-actions">
        <div className="navbar-notifications">
          <button
            className="navbar-notifications-button"
            type="button"
            aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ""}`}
            aria-expanded={notificacionesOpen}
            onClick={() => setNotificacionesOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
            </svg>
            {noLeidas > 0 && <span className="navbar-notifications-count">{noLeidas > 9 ? "9+" : noLeidas}</span>}
          </button>
          {notificacionesOpen && (
            <section className="navbar-notifications-panel" aria-label="Notificaciones">
              <h2>Notificaciones</h2>
              {errorNotificaciones && <p className="navbar-notifications-error" role="alert">{errorNotificaciones}</p>}
              {!notificaciones.length && !errorNotificaciones && (
                <p className="navbar-notifications-empty">No tenés notificaciones nuevas.</p>
              )}
              <ul>
                {notificaciones.slice(0, 8).map((notificacion) => (
                  <li key={notificacion.id_notificacion} className={notificacion.leida ? "" : "sin-leer"}>
                    <strong>{notificacion.titulo}</strong>
                    <p>{notificacion.mensaje}</p>
                    {!notificacion.leida && (
                      <button type="button" onClick={() => marcarLeida(notificacion.id_notificacion)}>
                        Marcar como leída
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="navbar-user">
          <button
            className="navbar-avatar"
            type="button"
            style={{ backgroundColor: getAvatarColor(usuario) }}
            aria-label="Abrir menú de usuario"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{getInitials(usuario)}</span>
          </button>
          {menuOpen && (
            <div className="navbar-user-menu">
              <NavLink to="/perfil" onClick={() => setMenuOpen(false)}>
                Mi perfil
              </NavLink>
              <button type="button" onClick={handleLogout}>
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
