import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";
import { actualizarPerfil, obtenerPerfil, subirAvatar } from "../services/api";
import { formatearPrecio } from "../utils/fechas";

function perfilInicial(usuario, datos) {
  const perfil = datos.perfil || {};
  const profesor = datos.profesor || {};
  const alumno = datos.alumno || {};
  return {
    nombre: usuario?.nombre || datos.nombre || "",
    email: usuario?.email || datos.email || "",
    biografia: perfil.biografia || "",
    avatarURL: perfil.avatarURL || "",
    visibilidad: perfil.visibilidad || "publico",
    tarifa: profesor.tarifa ?? "",
    descripcion: profesor.descripcion || "",
    nivel_educativo: alumno.nivel_educativo || "",
  };
}

function etiquetaVisibilidad(valor) {
  return valor === "privado" ? "Privado" : "Público";
}

export default function MiPerfil() {
  const { usuario, actualizarUsuario } = useAuth();
  const [form, setForm] = useState(null);
  const [campoEditando, setCampoEditando] = useState(null);
  const [guardando, setGuardando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [archivoAvatar, setArchivoAvatar] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState("");
  const archivoRef = useRef(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id_usuario]);

  useEffect(() => () => {
    if (previewAvatar) URL.revokeObjectURL(previewAvatar);
  }, [previewAvatar]);

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setError("");
    setMensaje("");
  }

  function editar(campo) {
    setError("");
    setMensaje("");
    setCampoEditando(campo);
  }

  function cancelarEdicion() {
    setCampoEditando(null);
    setError("");
  }

  async function guardarCampo(campo) {
    if (campo === "avatarURL") {
      if (!archivoAvatar) {
        setError("Elegí una imagen antes de guardarla.");
        return;
      }
      setGuardando(campo);
      setError("");
      setMensaje("");
      try {
        await subirAvatar(archivoAvatar);
        const respuesta = await obtenerPerfil();
        const perfilActualizado = perfilInicial(usuario, respuesta.perfil);
        setForm(perfilActualizado);
        actualizarUsuario({ avatarURL: perfilActualizado.avatarURL });
        setArchivoAvatar(null);
        setPreviewAvatar("");
        setCampoEditando(null);
        setMensaje("Foto de perfil actualizada.");
      } catch (err) {
        setError(err.message || "No se pudo actualizar la foto de perfil.");
      } finally {
        setGuardando(null);
      }
      return;
    }

    const valor = form[campo];
    const texto = typeof valor === "string" ? valor.trim() : valor;

    if (campo === "nombre" && !texto) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    if (campo === "tarifa" && (texto === "" || Number(texto) < 0 || !Number.isInteger(Number(texto)))) {
      setError("La tarifa debe ser un número entero mayor o igual a cero.");
      return;
    }

    setGuardando(campo);
    setError("");
    setMensaje("");
    try {
      const datos = {
        [campo]: campo === "tarifa" ? Number(texto) : texto,
      };
      const respuesta = await actualizarPerfil(datos);
      setForm(perfilInicial(usuario, respuesta.perfil));
      if (campo === "nombre") actualizarUsuario({ nombre: texto });
      setCampoEditando(null);
      setMensaje("Cambios guardados.");
    } catch (err) {
      setError(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setGuardando(null);
    }
  }

  function seleccionarAvatar(event) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setError("Elegí un archivo de imagen.");
      event.target.value = "";
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar los 2 MB.");
      event.target.value = "";
      return;
    }

    if (previewAvatar) URL.revokeObjectURL(previewAvatar);
    setArchivoAvatar(archivo);
    setPreviewAvatar(URL.createObjectURL(archivo));
    setCampoEditando("avatarURL");
    setError("");
    setMensaje("");
    event.target.value = "";
  }

  function renderEditor(campo, tipo = "text", props = {}) {
    if (campoEditando !== campo) return null;
    const multilinea = tipo === "textarea";
    return (
      <div className="mi-perfil-editor">
        {multilinea ? (
          <textarea
            className="res-campo"
            value={form[campo]}
            onChange={(event) => cambiar(campo, event.target.value)}
            {...props}
          />
        ) : (
          <input
            className="res-campo"
            type={tipo}
            value={form[campo]}
            onChange={(event) => cambiar(campo, event.target.value)}
            {...props}
          />
        )}
        <div className="mi-perfil-editor-acciones">
          <button type="button" className="mi-perfil-guardar" onClick={() => guardarCampo(campo)} disabled={guardando === campo}>
            {guardando === campo ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className="mi-perfil-cancelar" onClick={cancelarEdicion} disabled={guardando === campo}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  function renderCampo(campo, titulo, contenido, tipo = "text", props = {}) {
    return (
      <div className="mi-perfil-campo">
        <div className="mi-perfil-campo-cabecera">
          <span>{titulo}</span>
          <button type="button" className="mi-perfil-lapiz" aria-label={`Editar ${titulo.toLowerCase()}`} onClick={() => editar(campo)}>
            ✎
          </button>
        </div>
        {campoEditando === campo ? renderEditor(campo, tipo, props) : <p>{contenido || "No agregaste información todavía."}</p>}
      </div>
    );
  }

  function cancelarAvatar() {
    if (previewAvatar) URL.revokeObjectURL(previewAvatar);
    setArchivoAvatar(null);
    setPreviewAvatar("");
    setCampoEditando(null);
    setError("");
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
          <section className="res-tarjeta mi-perfil-card">
            <div className="mi-perfil-resumen">
              <div className="mi-perfil-avatar-wrap">
                <button
                  type="button"
                  className="mi-perfil-avatar"
                  aria-label="Cambiar foto de perfil"
                  onClick={() => archivoRef.current?.click()}
                >
                  {previewAvatar || form.avatarURL
                    ? <img src={previewAvatar || form.avatarURL} alt={`Foto de perfil de ${form.nombre}`} />
                    : form.nombre.trim().charAt(0).toUpperCase() || "U"}
                  <span className="mi-perfil-avatar-overlay" aria-hidden="true"></span>
                </button>
                <input ref={archivoRef} className="mi-perfil-archivo" type="file" accept="image/*" onChange={seleccionarAvatar} />
                {campoEditando === "avatarURL" && (
                  <div className="mi-perfil-avatar-acciones">
                    <button type="button" className="mi-perfil-guardar" onClick={() => guardarCampo("avatarURL")} disabled={guardando === "avatarURL"}>
                      {guardando === "avatarURL" ? "Guardando..." : "Guardar foto"}
                    </button>
                    <button type="button" className="mi-perfil-cancelar" onClick={cancelarAvatar} disabled={guardando === "avatarURL"}>Cancelar</button>
                  </div>
                )}
              </div>
              <div className="mi-perfil-identidad">
                <strong>{form.nombre}</strong>
                <span>{form.email}</span>
                <span>{usuario?.rol === "profesor" ? "Profesor" : "Alumno"}</span>
              </div>
              {usuario?.rol === "profesor" && usuario.id_rol && (
                <Link className="perfil-enlace" to={`/profesores/${usuario.id_rol}`}>Ver perfil público</Link>
              )}
            </div>

            <div className="mi-perfil-campos">
              {renderCampo("nombre", "Nombre", form.nombre, "text", { maxLength: 30, required: true })}
              {renderCampo("biografia", "Biografía", form.biografia, "textarea", { rows: 4, maxLength: 500, placeholder: "Contá algo sobre vos" })}
              <div className="mi-perfil-campo">
                <div className="mi-perfil-campo-cabecera">
                  <span>Visibilidad</span>
                  <button type="button" className="mi-perfil-lapiz" aria-label="Editar visibilidad" onClick={() => editar("visibilidad")}>✎</button>
                </div>
                {campoEditando === "visibilidad"
                  ? (
                    <div className="mi-perfil-editor">
                      <select className="res-campo" value={form.visibilidad} onChange={(event) => cambiar("visibilidad", event.target.value)}>
                        <option value="publico">Público</option>
                        <option value="privado">Privado</option>
                      </select>
                      <div className="mi-perfil-editor-acciones">
                        <button type="button" className="mi-perfil-guardar" onClick={() => guardarCampo("visibilidad")} disabled={guardando === "visibilidad"}>Guardar</button>
                        <button type="button" className="mi-perfil-cancelar" onClick={cancelarEdicion}>Cancelar</button>
                      </div>
                    </div>
                  )
                  : <p>{etiquetaVisibilidad(form.visibilidad)}</p>}
              </div>

              {usuario?.rol === "profesor" && (
                <>
                  {renderCampo("descripcion", "Presentación para alumnos", form.descripcion, "textarea", { rows: 4, maxLength: 500, placeholder: "Contá cómo son tus clases y tu experiencia" })}
                  {renderCampo("tarifa", "Tarifa por hora", formatearPrecio(Number(form.tarifa) || 0), "number", { min: 0, step: 1 })}
                  <p className="res-nota">Las materias se administran desde <Link to="/profesor/materias">Mis materias</Link>.</p>
                </>
              )}
              {usuario?.rol === "alumno" && renderCampo("nivel_educativo", "Nivel educativo", form.nivel_educativo, "text", { maxLength: 50, placeholder: "Por ejemplo: secundario o universitario" })}
            </div>

            {error && <p className="res-error" role="alert">{error}</p>}
            {mensaje && <p className="res-ok" role="status">{mensaje}</p>}
          </section>
        )}
        {!cargando && !form && error && <p className="res-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
