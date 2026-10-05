import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/authLayout";
import { useAuth } from "../context/authContext";
import { login } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const errors = {};
    if (!email.trim()) errors.email = "El email es obligatorio";
    else if (!email.includes("@")) errors.email = "Ingresá un email válido";
    if (!password) errors.password = "La contraseña es obligatoria";
    else if (password.length < 6) errors.password = "Debe tener al menos 6 caracteres";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setCargando(true);
    try {
      const data = await login(email, password);
      guardarSesion(data);
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      navigate(payload.rol === "alumno" ? "/buscar" : "/profesor");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-heading">
        <h1>Iniciar sesion</h1>
        <p>Entra a tu cuenta para buscar o dar clases.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
        />
        {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}

        <label htmlFor="login-password">Contraseña</label>
        <input
          id="login-password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Ingresa tu contraseña"
        />
        {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}

        {error && <p className="auth-error" role="alert">{error}</p>}

        <button type="submit" disabled={cargando} className="auth-submit">
          {cargando ? "Ingresando" : "Iniciar sesión"}
        </button>
      </form>

      <p className="auth-switch">
        ¿No tenes cuenta?{" "}
        <Link to="/register">Registrate</Link>
      </p>
    </AuthLayout>
  );
}
