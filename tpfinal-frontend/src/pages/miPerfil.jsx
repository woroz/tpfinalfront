import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Estrellas from "../components/Estrellas";
import { useAuth } from "../context/authContext";
import { actualizarPerfil, obtenerPerfil, obtenerPerfilProfesor, subirAvatar } from "../services/api";
import { formatearPrecio } from "../utils/fechas";
import professorImage from "../assets/profesor.png";

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
  const [perfilProfesor, setPerfilProfesor] = useState(null);
  const [cargandoPerfilProfesor, setCargandoPerfilProfesor] = useState(() => usuario?.rol === "profesor");
  const [errorPerfilProfesor, setErrorPerfilProfesor] = useState("");
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

  useEffect(() => {
    if (usuario?.rol !== "profesor" || !usuario.id_rol) {
      return undefined;
    }

    let activo = true;
    obtenerPerfilProfesor(usuario.id_rol)
      .then((data) => {
        if (activo) {
          setPerfilProfesor(data.perfil);
          setErrorPerfilProfesor("");
        }
      })
      .catch((err) => {
        if (activo) setErrorPerfilProfesor(err.message || "No se pudo cargar la vista previa del perfil.");
      })
      .finally(() => {
        if (activo) setCargandoPerfilProfesor(false);
      });
    return () => {
      activo = false;
    };
  }, [usuario?.id_rol, usuario?.rol]);

  useEffect(() => () => {
    if (previewAvatar) URL.revokeObjectURL(previewAvatar);
  }, [previewAvatar]);

  function refrescarVistaPreviaProfesor() {
    if (usuario?.rol !== "profesor" || !usuario.id_rol) return;
    obtenerPerfilProfesor(usuario.id_rol)
      .then((data) => {
        setPerfilProfesor(data.perfil);
        setErrorPerfilProfesor("");
      })
      .catch((err) => setErrorPerfilProfesor(err.message || "No se pudo actualizar la vista previa del perfil."));
  }

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
        refrescarVistaPreviaProfesor();
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
      refrescarVistaPreviaProfesor();
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
            Editar
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
          <>
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
                  <button type="button" className="mi-perfil-lapiz" aria-label="Editar visibilidad" onClick={() => editar("visibilidad")}>Editar</button>
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
          {usuario?.rol === "profesor" && (
            <section className="mi-perfil-profesor-seccion" aria-label="Reseñas y vista previa de tu perfil">
              <div className="res-tarjeta mi-perfil-resenas">
                <h2>Reseñas recibidas</h2>
                {errorPerfilProfesor && <p className="res-error" role="alert">{errorPerfilProfesor}</p>}
                {cargandoPerfilProfesor && <p className="res-mensaje">Cargando reseñas…</p>}
                {!cargandoPerfilProfesor && perfilProfesor && (
                  <>
                    {perfilProfesor.promedioResenas != null && (
                      <p className="mi-perfil-promedio">
                        <Estrellas puntaje={perfilProfesor.promedioResenas} />
                        <strong>{perfilProfesor.promedioResenas.toFixed(1).replace(".", ",")} de 5</strong>
                        <span>{perfilProfesor.resenas.length} {perfilProfesor.resenas.length === 1 ? "reseña" : "reseñas"}</span>
                      </p>
                    )}
                    {perfilProfesor.resenas.length ? (
                      <ul className="mi-perfil-lista-resenas">
                        {perfilProfesor.resenas.map((resena) => (
                          <li key={resena.id_resena}>
                            <div className="mi-perfil-resena-cabecera">
                              <strong>{resena.alumno?.usuario?.nombre || "Alumno"}</strong>
                              <span><Estrellas puntaje={resena.puntaje} /> {resena.puntaje} de 5</span>
                            </div>
                            {resena.comentario && <p>{resena.comentario}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="res-mensaje">Todavía no recibiste reseñas.</p>
                    )}
                  </>
                )}
              </div>

              <div className="res-tarjeta mi-perfil-vista-previa">
                <h2>Vista previa de tu perfil</h2>
                {perfilProfesor && (
                  <div className="mi-perfil-preview-contenido">
                    <img
                      src={perfilProfesor.usuario?.perfil?.avatarURL || professorImage}
                      alt=""
                      className="mi-perfil-preview-avatar"
                    />
                    <div>
                      <h3>{perfilProfesor.usuario?.nombre || form.nombre}</h3>
                      <p>{perfilProfesor.tarifa != null ? `${formatearPrecio(perfilProfesor.tarifa)} por hora` : "Tarifa no informada"}</p>
                      {perfilProfesor.promedioResenas != null && (
                        <p className="mi-perfil-preview-rating">
                          <Estrellas puntaje={perfilProfesor.promedioResenas} />
                          {perfilProfesor.promedioResenas.toFixed(1).replace(".", ",")} de 5
                        </p>
                      )}
                      <p className="mi-perfil-preview-descripcion">
                        {perfilProfesor.descripcion || perfilProfesor.usuario?.perfil?.biografia || "Todavía no agregaste una presentación."}
                      </p>
                      <ul className="mi-perfil-preview-materias">
                        {(perfilProfesor.materias || []).map((item) => (
                          <li key={item.materia?.id_materia || item.id_materia}>
                            {item.materia?.nombreMateria || item.nombreMateria}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                <Link className="res-boton res-enlace mi-perfil-preview-enlace" to={`/profesores/${usuario.id_rol}`}>
                  Abrir perfil público
                </Link>
              </div>
            </section>
          )}
          </>
        )}
        {!cargando && !form && error && <p className="res-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}