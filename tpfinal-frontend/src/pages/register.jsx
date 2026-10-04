import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/authLayout";
import { register } from "../services/api";

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("alumno");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setCargando(true);
    try {
      await register(email, password, nombre, rol);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-heading">
        <h1>Crear cuenta</h1>
        <p>Elegi si vas a aprender o a enseñar en MentorAr.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <fieldset className="role-picker">
          <legend>Quiero</legend>
          <button type="button" className={rol === "alumno" ? "selected" : ""} onClick={() => setRol("alumno")}>
            Aprender
          </button>
          <button type="button" className={rol === "profesor" ? "selected" : ""} onClick={() => setRol("profesor")}>
            Enseñar
          </button>
        </fieldset>

        <label htmlFor="register-name">Nombre</label>
        <input
          id="register-name"
          type="text"
          required
          maxLength={30}
          autoComplete="name"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Tu nombre completo"
        />

        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
        />

        <label htmlFor="register-password">Contraseña</label>
        <input
          id="register-password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimo 6 caracteres"
        />

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button type="submit" disabled={cargando} className="auth-submit">
          {cargando ? "Creando cuenta" : "Crear cuenta"}
        </button>
      </form>

      <p className="auth-switch">
        ¿Ya tenes cuenta?{" "}
        <Link to="/login">Inicia sesion</Link>
      </p>
    </AuthLayout>
  );
}
