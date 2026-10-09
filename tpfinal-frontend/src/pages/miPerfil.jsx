import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";
import { actualizarPerfil, obtenerPerfil } from "../services/api";
import { formatearPrecio } from "../utils/fechas";

function perfilInicial(usuario, datos) {
  const perfil = datos.perfil || {};
  const profesor = datos.profesor || {};
  const alumno = datos.alumno || {};
  return {
    nombre: usuario?.nombre || datos.nombre || "",
    biografia: perfil.biografia || "",
    avatarURL: perfil.avatarURL || "",
    visibilidad: perfil.visibilidad || "publico",
    tarifa: profesor.tarifa ?? "",
    descripcion: profesor.descripcion || "",
    nivel_educativo: alumno.nivel_educativo || "",
  };
}

export default function MiPerfil() {
  const { usuario, actualizarUsuario } = useAuth();
  const [form, setForm] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerPerfil()
      .then((data) => {
        if (activo) setForm(perfilInicial(usuario, data.perfil));
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
  }, [usuario]);

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setError("");
    setMensaje("");
  }

  async function guardar(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    if (!form.nombre.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre.trim(),
        biografia: form.biografia.trim(),
        visibilidad: form.visibilidad,
      };
      if (form.avatarURL.trim()) datos.avatarURL = form.avatarURL.trim();
      if (usuario?.rol === "profesor") {
        datos.descripcion = form.descripcion.trim();
        datos.tarifa = form.tarifa === "" ? 0 : Number(form.tarifa);
      }
      if (usuario?.rol === "alumno") datos.nivel_educativo = form.nivel_educativo.trim();

      const respuesta = await actualizarPerfil(datos);
      setForm(perfilInicial(usuario, respuesta.perfil));
      actualizarUsuario({ nombre: datos.nombre });
      setMensaje("Tu perfil se guardó correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor mi-perfil-page">
        <header className="res-encabezado">
          <h1>Mi perfil</h1>
          <p>Consultá y actualizá la información que compartís en MentorAr.</p>
        </header>

        {cargando && <p className="res-mensaje">Cargando perfil…</p>}
        {!cargando && form && (
          <form className="res-tarjeta mi-perfil-form" onSubmit={guardar} noValidate>
            <div className="mi-perfil-resumen">
              <div className="mi-perfil-avatar" aria-hidden="true">
                {form.nombre.trim().charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <strong>{form.nombre}</strong>
                <span>{usuario?.email}</span>
                <span>{usuario?.rol === "profesor" ? "Profesor" : "Alumno"}</span>
              </div>
              {usuario?.rol === "profesor" && usuario.id_rol && (
                <Link className="perfil-enlace" to={`/profesores/${usuario.id_rol}`}>
                  Ver perfil público
                </Link>
              )}
            </div>

            <label className="res-etiqueta" htmlFor="mi-perfil-nombre">Nombre</label>
            <input
              className="res-campo"
              id="mi-perfil-nombre"
              maxLength={30}
              required
              value={form.nombre}
              onChange={(event) => cambiar("nombre", event.target.value)}
            />

            <label className="res-etiqueta" htmlFor="mi-perfil-bio">Biografía</label>
            <textarea
              className="res-campo"
              id="mi-perfil-bio"
              rows={4}
              maxLength={500}
              value={form.biografia}
              onChange={(event) => cambiar("biografia", event.target.value)}
              placeholder="Contá algo sobre vos"
            />

            <label className="res-etiqueta" htmlFor="mi-perfil-avatar">Foto de perfil (URL, opcional)</label>
            <input
              className="res-campo"
              id="mi-perfil-avatar"
              type="url"
              value={form.avatarURL}
              onChange={(event) => cambiar("avatarURL", event.target.value)}
              placeholder="https://ejemplo.com/mi-foto.jpg"
            />

            <label className="res-etiqueta" htmlFor="mi-perfil-visibilidad">Visibilidad del perfil</label>
            <select
              className="res-campo"
              id="mi-perfil-visibilidad"
              value={form.visibilidad}
              onChange={(event) => cambiar("visibilidad", event.target.value)}
            >
              <option value="publico">Público</option>
              <option value="privado">Privado</option>
            </select>

            {usuario?.rol === "profesor" && (
              <>
                <label className="res-etiqueta" htmlFor="mi-perfil-descripcion">Presentación para alumnos</label>
                <textarea
                  className="res-campo"
                  id="mi-perfil-descripcion"
                  rows={4}
                  maxLength={500}
                  value={form.descripcion}
                  onChange={(event) => cambiar("descripcion", event.target.value)}
                  placeholder="Contá cómo son tus clases y tu experiencia"
                />
                <label className="res-etiqueta" htmlFor="mi-perfil-tarifa">Tarifa por hora (ARS)</label>
                <input
                  className="res-campo"
                  id="mi-perfil-tarifa"
                  type="number"
                  min="0"
                  step="1"
                  value={form.tarifa}
                  onChange={(event) => cambiar("tarifa", event.target.value)}
                />
                <p className="res-nota">
                  Tarifa actual: {formatearPrecio(Number(form.tarifa) || 0)} por hora. Las materias se administran desde{" "}
                  <Link to="/profesor/materias">Mis materias</Link>.
                </p>
              </>
            )}

            {usuario?.rol === "alumno" && (
              <>
                <label className="res-etiqueta" htmlFor="mi-perfil-nivel">Nivel educativo</label>
                <input
                  className="res-campo"
                  id="mi-perfil-nivel"
                  maxLength={50}
                  value={form.nivel_educativo}
                  onChange={(event) => cambiar("nivel_educativo", event.target.value)}
                  placeholder="Por ejemplo: secundario o universitario"
                />
              </>
            )}

            {error && <p className="res-error" role="alert">{error}</p>}
            {mensaje && <p className="res-ok" role="status">{mensaje}</p>}
            <button className="res-boton" type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        )}
        {!cargando && !form && error && <p className="res-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
