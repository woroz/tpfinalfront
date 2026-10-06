import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/mentorar.png";
import { useAuth } from "../context/authContext";

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
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="app-navbar">
      <NavLink className="navbar-logo" to="/inicio" aria-label="Ir al inicio">
        <img src={logo} alt="MentorAr" />
      </NavLink>

      <div className="navbar-links">
        <NavLink className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"} to="/inicio">
          Inicio
        </NavLink>
        <NavLink className={({ isActive }) => isActive ? "navbar-link active" : "navbar-link"} to="/buscar">
          Buscar profesores
        </NavLink>
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
              Ver perfil
            </NavLink>
            <button type="button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
