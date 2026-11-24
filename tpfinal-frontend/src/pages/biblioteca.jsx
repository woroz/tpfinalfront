import { confirmarAccion } from "../utils/confirmarAccion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Eye, FileText, MoreHorizontal } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";
import {
  descargarMaterialBiblioteca, eliminarMaterialBiblioteca, obtenerArchivoBiblioteca,
  obtenerClasesBiblioteca, obtenerMaterialesBiblioteca, obtenerMaterialesProfesorBiblioteca, obtenerPdfClasesBiblioteca,
  obtenerVistaTextoBiblioteca, reemplazarMaterialBiblioteca, subirMaterialBiblioteca,
} from "../services/api";
import "../styles/biblioteca.css";

const FORMATOS = ".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx,.txt,.csv";
const MAXIMO = 4 * 1024 * 1024;
const vistaVisual = (material) => ["application/pdf", "image/png", "image/jpeg"].includes(material.tipo_archivo);

function validarArchivo(archivo) {
  if (!archivo) throw new Error("Elegí un archivo.");
  if (!/\.(pdf|png|jpe?g|docx|xlsx|pptx|txt|csv)$/i.test(archivo.name)) throw new Error("Elegí un archivo PDF, PNG, JPG, DOCX, XLSX, PPTX, TXT o CSV.");
  if (!archivo.size || archivo.size > MAXIMO) throw new Error("El archivo debe tener hasta 4 MB y no puede estar vacío.");
}

function VentanaVista({ vista, cerrar }) {
  const dialogo = useRef(null);
  useEffect(() => { dialogo.current.showModal(); }, []);
  return (
    <dialog ref={dialogo} className="biblioteca-dialogo" onClose={cerrar} aria-labelledby="biblioteca-vista-titulo">
      <header className="biblioteca-vista-cabecera">
        <h2 id="biblioteca-vista-titulo">Vista previa: {vista.titulo}</h2>
        <button type="button" className="biblioteca-cerrar" aria-label="Cerrar vista previa" onClick={cerrar}>×</button>
      </header>
      {vista.secciones ? <div className="biblioteca-vista-texto">
        <p className="biblioteca-advertencia">Vista previa básica: no muestra imágenes ni reproduce el diseño. En planillas, las fechas y fórmulas pueden verse sin formato o incompletas. Descargá el archivo para verlo completo.</p>
        {vista.secciones.map((seccion, indice) => <section key={indice}><h3>{seccion.titulo}</h3><pre>{seccion.contenido || "(Sin texto para mostrar)"}</pre></section>)}
        {vista.truncado && <p className="biblioteca-advertencia">La vista previa se recortó. Descargá el archivo para ver todo el contenido.</p>}
      </div> : vista.tipo === "application/pdf"
        ? <iframe title={`Vista previa de ${vista.titulo}`} src={vista.url} />
        : <img alt={`Vista previa de ${vista.titulo}`} src={vista.url} />}
    </dialog>
  );
}

export default function Biblioteca() {
  const { usuario } = useAuth();
  const [clases, setClases] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [pdfsClase, setPdfsClase] = useState([]);
  const [clase, setClase] = useState("");
  const [destinatarios, setDestinatarios] = useState("alumno");
  const [alumno, setAlumno] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [reemplazo, setReemplazo] = useState(null);
  const [editando, setEditando] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState("");
  const [error, setError] = useState("");
  const [errorCarga, setErrorCarga] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [versionArchivo, setVersionArchivo] = useState(0);
  const [versionCarga, setVersionCarga] = useState(0);
  const [vista, setVista] = useState(null);
  const [profesor, setProfesor] = useState("");
  const [materia, setMateria] = useState("");
  const [descargado, setDescargado] = useState("");
  const [orden, setOrden] = useState("fecha_carga");
  const [direccion, setDireccion] = useState("desc");
  const [filtrosAplicados, setFiltrosAplicados] = useState({ profesor: "", materia: "", descargado: "" });
  const [ordenAplicado, setOrdenAplicado] = useState({ orden: "fecha_carga", direccion: "desc" });

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        let resultadoClases = null;
        let resultadoPdfsClase = null;
        let resultadoMateriales;
        if (usuario?.rol === "profesor") {
          [resultadoClases, resultadoMateriales] = await Promise.all([
            obtenerClasesBiblioteca(), obtenerMaterialesProfesorBiblioteca(),
          ]);
        } else {
          [resultadoMateriales, resultadoPdfsClase] = await Promise.all([
            obtenerMaterialesBiblioteca(), obtenerPdfClasesBiblioteca(),
          ]);
        }
        if (activo) {
          setClases(resultadoClases?.clases ?? []);
          setMateriales(resultadoMateriales.materiales);
          setPdfsClase(resultadoPdfsClase?.materiales ?? []);
          setErrorCarga(false);
        }
      } catch (err) {
        if (activo) {
          setError(err.message);
          setErrorCarga(true);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }
    void cargar();
    return () => { activo = false; };
  }, [usuario?.rol, versionCarga]);

  useEffect(() => () => { if (vista?.url?.startsWith("blob:")) URL.revokeObjectURL(vista.url); }, [vista]);

  const claseSeleccionada = clases.find((item) => item.id_clase === clase);
  const profesores = useMemo(() => [...new Map([
    ...materiales.map((item) => [item.profesor.id_profesor, item.profesor.usuario.nombre]),
    ...pdfsClase.map((item) => [item.profesor.id_profesor, item.profesor.usuario.nombre]),
  ]).entries()], [materiales, pdfsClase]);
  const materias = useMemo(() => [...new Map([
    ...materiales.map((item) => [item.clase.materia.id_materia, item.clase.materia.nombreMateria]),
    ...pdfsClase.map((item) => [item.clase.materia.id_materia, item.clase.materia.nombreMateria]),
  ]).entries()], [materiales, pdfsClase]);
  const resumenFiltros = [
    filtrosAplicados.profesor && `Profesor: ${profesores.find(([id]) => id === filtrosAplicados.profesor)?.[1] ?? "seleccionado"}`,
    filtrosAplicados.materia && `Materia: ${materias.find(([id]) => id === filtrosAplicados.materia)?.[1] ?? "seleccionada"}`,
    filtrosAplicados.descargado && (filtrosAplicados.descargado === "si" ? "Descargados" : "No descargados"),
  ].filter(Boolean).join(" · ") || "Ninguno";
  const resumenOrden = { titulo: "nombre", fecha_carga: "fecha de subida", fecha_modificacion: "fecha de modificación" }[ordenAplicado.orden];
  const visibles = useMemo(() => materiales.filter((item) =>
    (!filtrosAplicados.profesor || item.profesor.id_profesor === filtrosAplicados.profesor) &&
    (!filtrosAplicados.materia || item.clase.materia.id_materia === filtrosAplicados.materia) &&
    (!filtrosAplicados.descargado || Boolean(item.descargadoEn) === (filtrosAplicados.descargado === "si"))
  ).sort((a, b) => {
    const resultado = ordenAplicado.orden === "titulo" ? a.titulo.localeCompare(b.titulo, "es", { sensitivity: "base" })
      : new Date(a[ordenAplicado.orden]).getTime() - new Date(b[ordenAplicado.orden]).getTime();
    return ordenAplicado.direccion === "asc" ? resultado : -resultado;
  }), [materiales, filtrosAplicados, ordenAplicado]);
  const pdfsClaseVisibles = useMemo(() => pdfsClase.filter((item) =>
    (!filtrosAplicados.profesor || item.profesor.id_profesor === filtrosAplicados.profesor) &&
    (!filtrosAplicados.materia || item.clase.materia.id_materia === filtrosAplicados.materia)
  ).sort((a, b) => {
    const resultado = ordenAplicado.orden === "titulo" ? a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
      : new Date(a.fecha_carga).getTime() - new Date(b.fecha_carga).getTime();
    return ordenAplicado.direccion === "asc" ? resultado : -resultado;
  }), [pdfsClase, filtrosAplicados, ordenAplicado]);

  function refrescar() { setVersionCarga((actual) => actual + 1); }
  async function ejecutar(nombre, accion) {
    setError("");
    setMensaje("");
    setOcupado(nombre);
    try { await accion(); } catch (err) { setError(err.message || "No se pudo completar la operación."); }
    finally { setOcupado(""); }
  }
  async function enviar(evento) {
    evento.preventDefault();
    await ejecutar("enviar", async () => {
      if (!clase || (destinatarios === "alumno" && !alumno)) throw new Error("Elegí una clase y sus destinatarios.");
      validarArchivo(archivo);
      await subirMaterialBiblioteca(clase, destinatarios, alumno, archivo);
      setArchivo(null);
      setVersionArchivo((actual) => actual + 1);
      setMensaje("El material se compartió correctamente.");
      refrescar();
    });
  }
  async function reemplazar(material) {
    await ejecutar(material.id_material, async () => {
      validarArchivo(reemplazo);
      await reemplazarMaterialBiblioteca(material.id_material, reemplazo);
      setEditando("");
      setReemplazo(null);
      setVista(null);
      setMensaje("El material se modificó correctamente.");
      refrescar();
    });
  }
  async function eliminar(material) {
    if (!await confirmarAccion(`¿Querés eliminar "${material.titulo}" de la biblioteca de sus alumnos?`, "Eliminar material")) return;
    await ejecutar(material.id_material, async () => {
      await eliminarMaterialBiblioteca(material.id_material);
      setVista(null);
      setMensaje("El material se eliminó correctamente.");
      refrescar();
    });
  }
  async function previsualizar(material) {
    await ejecutar(material.id_material, async () => {
      if (vistaVisual(material)) {
        const blob = await obtenerArchivoBiblioteca(material, true);
        setVista({ url: URL.createObjectURL(blob), tipo: material.tipo_archivo, titulo: material.titulo });
      } else {
        const contenido = await obtenerVistaTextoBiblioteca(material.id_material);
        setVista({ ...contenido, titulo: material.titulo });
      }
    });
  }
  async function descargar(material) {
    await ejecutar(material.id_material, async () => {
      await descargarMaterialBiblioteca(material);
      if (usuario?.rol === "alumno") refrescar();
    });
  }

  return (
    <main className="app-page">
      <Navbar />
      <section className="biblioteca">
        <h1>Biblioteca</h1>
        <p>Material personal asociado a tus clases.</p>
        {error && <p className="biblioteca-aviso error" role="alert">{error}</p>}
        {mensaje && <p className="biblioteca-aviso exito" role="status">{mensaje}</p>}
        {cargando ? <p>Cargando biblioteca...</p> : errorCarga ? (
          <button type="button" onClick={() => { setError(""); setCargando(true); refrescar(); }}>Reintentar</button>
        ) : (
          <>
            {usuario?.rol === "profesor" && (
              <form className="biblioteca-tarjeta biblioteca-formulario" onSubmit={enviar}>
                <h2>Compartir material</h2>
                <p>Elegí una clase terminada y alumnos con inscripción confirmada.</p>
                {!clases.length ? <p>No tenés clases disponibles para compartir material.</p> : (
                  <>
                    <label htmlFor="biblioteca-clase">Clase</label>
                    <select id="biblioteca-clase" value={clase} onChange={(e) => { setClase(e.target.value); setAlumno(""); }}>
                      <option value="">Seleccioná una clase</option>
                      {clases.map((item) => <option key={item.id_clase} value={item.id_clase}>{item.titulo} — {new Date(item.inicio).toLocaleString("es-AR")}</option>)}
                    </select>
                    <label htmlFor="biblioteca-destinatarios">Compartir con</label>
                    <select id="biblioteca-destinatarios" value={destinatarios} onChange={(e) => { setDestinatarios(e.target.value); setAlumno(""); }}>
                      <option value="alumno">Un alumno</option>
                      <option value="asistieron">Todos los que asistieron</option>
                      <option value="inscritos">Todos los inscritos confirmados</option>
                    </select>
                    {destinatarios === "alumno" && <>
                      <label htmlFor="biblioteca-alumno">Alumno</label>
                      <select id="biblioteca-alumno" value={alumno} onChange={(e) => setAlumno(e.target.value)} disabled={!clase}>
                        <option value="">Seleccioná un alumno</option>
                        {claseSeleccionada?.alumnos.map((item) => <option key={item.id_alumno} value={item.id_alumno}>{item.nombre}</option>)}
                      </select>
                    </>}
                    <span>Archivo</span>
                    <label className="file-upload" htmlFor="biblioteca-archivo">
                      <span className="file-upload-trigger">Elegir archivo</span>
                      <span className="file-upload-name">{archivo?.name ?? "No se eligió ningún archivo"}</span>
                      <input key={versionArchivo} id="biblioteca-archivo" type="file" accept={FORMATOS} onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
                    </label>
                    <small>PDF, PNG, JPG, DOCX, XLSX, PPTX, TXT o CSV; máximo 4 MB.</small>
                    <button type="submit" disabled={Boolean(ocupado)}>{ocupado === "enviar" ? "Enviando..." : "Enviar material"}</button>
                  </>
                )}
              </form>
            )}
            {vista && <VentanaVista vista={vista} cerrar={() => setVista(null)} />}
            <div className="biblioteca-controles">
            <section className="biblioteca-filtros" aria-labelledby="biblioteca-filtros-titulo">
              <h2 id="biblioteca-filtros-titulo">Filtrar por:</h2>
              {usuario?.rol === "alumno" && <p className="biblioteca-resumen">El filtro de descarga corresponde a materiales compartidos; los PDF de clase no registran descargas. Para esos PDF la fecha disponible es la de carga.</p>}
              <div className="biblioteca-opciones-filtro">
              <label>Materia<select value={materia} onChange={(e) => setMateria(e.target.value)}><option value="">Todas</option>{materias.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
              {usuario?.rol === "alumno" && <>
                <label>Profesor<select value={profesor} onChange={(e) => setProfesor(e.target.value)}><option value="">Todos</option>{profesores.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}</select></label>
                <label>Descarga<select value={descargado} onChange={(e) => setDescargado(e.target.value)}><option value="">Todos</option><option value="si">Descargados</option><option value="no">No descargados</option></select></label>
              </>}
              </div>
              <div className="biblioteca-acciones"><button type="button" onClick={() => setFiltrosAplicados({ profesor, materia, descargado })}>Aplicar filtros</button>
                <button type="button" onClick={() => { setProfesor(""); setMateria(""); setDescargado(""); setFiltrosAplicados({ profesor: "", materia: "", descargado: "" }); }}>Limpiar filtros</button></div>
              <p className="biblioteca-resumen" aria-live="polite">Filtros aplicados: {resumenFiltros}.</p>
            </section>
            <section className="biblioteca-filtros" aria-labelledby="biblioteca-orden-titulo">
              <h2 id="biblioteca-orden-titulo">Ordenar por:</h2>
              <label>Criterio<select value={orden} onChange={(e) => setOrden(e.target.value)}><option value="titulo">Nombre</option><option value="fecha_carga">Fecha de subida</option><option value="fecha_modificacion">Fecha de modificación</option></select></label>
              <div className="biblioteca-orden-acciones">
                <div className="biblioteca-acciones">
                  <button type="button" className="biblioteca-direccion" onClick={() => setDireccion(direccion === "asc" ? "desc" : "asc")}>
                    {direccion === "asc" ? <ArrowUp size={15} aria-hidden="true" /> : <ArrowDown size={15} aria-hidden="true" />}
                    {direccion === "asc" ? "Ascendente" : "Descendente"}
                  </button>
                  <button type="button" onClick={() => setOrdenAplicado({ orden, direccion })}>Aplicar orden</button>
                </div>
                <span role="status" aria-live="polite">{visibles.length} de {materiales.length} materiales</span>
              </div>
              <p className="biblioteca-resumen" aria-live="polite">Orden aplicado: {resumenOrden}, {ordenAplicado.direccion === "asc" ? "ascendente" : "descendente"}.</p>
            </section>
            </div>
            {!visibles.length ? <p>No hay materiales para mostrar.</p> : <div className="biblioteca-lista">
              {visibles.map((material) => <article className="biblioteca-tarjeta biblioteca-material" key={material.id_material}>
                <div className="biblioteca-material-cabecera">
                  <span className={`biblioteca-icono${material.tipo_archivo === "application/pdf" ? " biblioteca-icono-pdf" : ""}`}><FileText size={19} aria-hidden="true" /></span>
                  <h2>{material.titulo}</h2>
                  {usuario?.rol === "profesor" && <details className="biblioteca-menu">
                    <summary aria-label={`Opciones de ${material.titulo}`}><MoreHorizontal size={19} aria-hidden="true" /></summary>
                    <div className="biblioteca-menu-opciones">
                      <button type="button" disabled={Boolean(ocupado)} onClick={(e) => { e.currentTarget.closest("details").open = false; setEditando(material.id_material); setReemplazo(null); }}>Modificar archivo</button>
                      <button type="button" disabled={Boolean(ocupado)} onClick={(e) => { e.currentTarget.closest("details").open = false; void eliminar(material); }}>Eliminar</button>
                    </div>
                  </details>}
                </div>
                <div className="biblioteca-material-etiquetas">
                  <span className="biblioteca-materia">{material.clase.materia.nombreMateria}</span>
                  <span>{material.profesor.usuario.nombre}</span>
                </div>
                <p className="biblioteca-material-clase">{material.clase.titulo}</p>
                <div className="biblioteca-material-info">
                  <span>Compartido: {new Date(material.fecha_carga).toLocaleDateString("es-AR")}</span>
                  <span>Modificado: {new Date(material.fecha_modificacion).toLocaleDateString("es-AR")}</span>
                  {usuario?.rol === "alumno" && <span>{material.descargadoEn ? "Descargado" : "No descargado"}</span>}
                  {usuario?.rol === "profesor" && <span>Para: {material.destinatarios.map((item) => item.alumno.usuario.nombre).join(", ")}</span>}
                </div>
                <div className="biblioteca-material-acciones">
                  <button type="button" disabled={Boolean(ocupado)} onClick={() => void previsualizar(material)}><Eye size={16} aria-hidden="true" />Vista previa</button>
                  <button type="button" disabled={Boolean(ocupado)} onClick={() => void descargar(material)}><Download size={16} aria-hidden="true" />{ocupado === material.id_material ? "Procesando..." : "Descargar"}</button>
                </div>
                {editando === material.id_material && <div className="biblioteca-formulario">
                  <span>Nuevo archivo</span>
                  <label className="file-upload" htmlFor={`reemplazo-${material.id_material}`}>
                    <span className="file-upload-trigger">Elegir archivo</span>
                    <span className="file-upload-name">{reemplazo?.name ?? "No se eligió ningún archivo"}</span>
                    <input id={`reemplazo-${material.id_material}`} type="file" accept={FORMATOS} onChange={(e) => setReemplazo(e.target.files?.[0] ?? null)} />
                  </label>
                  <div className="biblioteca-acciones">
                    <button type="button" disabled={Boolean(ocupado)} onClick={() => void reemplazar(material)}>Guardar cambio</button>
                    <button type="button" disabled={Boolean(ocupado)} onClick={() => { setEditando(""); setReemplazo(null); }}>Cancelar</button>
                  </div>
                </div>}
              </article>)}
            </div>}
            {usuario?.rol === "alumno" && <section className="biblioteca-tarjeta">
              <h2>PDF de tus clases ({pdfsClaseVisibles.length})</h2>
              <p>Material adjunto a clases con inscripción confirmada.</p>
              {pdfsClaseVisibles.length ? <div className="biblioteca-pdf-clases">
                {pdfsClaseVisibles.map((item) => <div className="biblioteca-pdf-clase" key={`${item.id_clase}:${item.id_material}`}>
                  <div>
                    <strong>{item.nombre}</strong>
                    <p>{item.clase.titulo} · {item.clase.materia.nombreMateria} · {item.profesor.usuario.nombre}</p>
                  </div>
                  <a href={item.url} target="_blank" rel="noreferrer">Abrir PDF</a>
                </div>)}
              </div> : <p>No hay PDF de clase para los filtros aplicados.</p>}
            </section>}
          </>
        )}
      </section>
    </main>
  );
}
