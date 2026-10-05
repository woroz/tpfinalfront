import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/authLayout";
import { register } from "../services/api";

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [rol, setRol] = useState("alumno");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const errors = {};
    if (!nombre.trim()) errors.nombre = "El nombre es obligatorio";
    if (!email.trim()) errors.email = "El email es obligatorio";
    else if (!email.includes("@")) errors.email = "Ingresá un email válido";
    if (!password) errors.password = "La contraseña es obligatoria";
    else if (password.length < 6) errors.password = "Debe tener al menos 6 caracteres";
    if (!direccion.trim()) errors.direccion = "La dirección es obligatoria";
    if (!ciudad.trim()) errors.ciudad = "La ciudad es obligatoria";
    if (!provincia.trim()) errors.provincia = "La provincia es obligatoria";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setCargando(true);
    try {
      await register(email, password, nombre, rol, `${direccion}, ${ciudad}, ${provincia}`);
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

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
        {fieldErrors.nombre && <span className="auth-field-error">{fieldErrors.nombre}</span>}

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
        {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}

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
        {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}

        <label htmlFor="register-address">Dirección</label>
        <input
          id="register-address"
          type="text"
          required
          maxLength={100}
          autoComplete="street-address"
          value={direccion}
          onChange={(event) => setDireccion(event.target.value)}
          placeholder="Calle y número"
        />
        {fieldErrors.direccion && <span className="auth-field-error">{fieldErrors.direccion}</span>}

        <label htmlFor="register-city">Ciudad</label>
        <input
          id="register-city"
          type="text"
          required
          maxLength={80}
          autoComplete="address-level2"
          value={ciudad}
          onChange={(event) => setCiudad(event.target.value)}
          placeholder="Tu ciudad"
        />
        {fieldErrors.ciudad && <span className="auth-field-error">{fieldErrors.ciudad}</span>}

        <label htmlFor="register-province">Provincia</label>
        <input
          id="register-province"
          type="text"
          required
          maxLength={80}
          autoComplete="address-level1"
          value={provincia}
          onChange={(event) => setProvincia(event.target.value)}
          placeholder="Tu provincia"
        />
        {fieldErrors.provincia && <span className="auth-field-error">{fieldErrors.provincia}</span>}

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
