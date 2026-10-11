const API_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL;
 
async function readResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    if (response.status === 401) {
      throw new Error("Tu sesion expiró o no es valida. Volve a iniciar sesion.");
    }
    throw new Error(`El servidor devolvió una respuesta invalida (${response.status})`);
  }
}
 
async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  // Con FormData (subida de archivos) el navegador pone solo el Content-Type correcto.
  const esFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(esFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: ["Bearer", token].join(" ") } : {}),
      ...options.headers,
    },
    credentials: "include",
  });
 
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }
  const data = await readResponse(res);
  if (!res.ok) {
    throw new Error(data.message);
  }
 
  return data;
}
 
export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
 
  const data = await readResponse(res);
  if (!res.ok) throw new Error(data.message);
  return data;
}
 
export async function register(email, password, nombre, rol, direccion, ubicacion = {}) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      nombre,
      rol,
      direccion,
      pais: ubicacion.pais,
      provincia: ubicacion.provincia,
      ciudad: ubicacion.ciudad,
    }),
  });
 
  const data = await readResponse(res);
  if (!res.ok) throw new Error(data.message);
  return data;
}
 
export async function obtenerPerfil() {
  return request("/perfil");
}
 
export async function buscarProfesores(latitud, longitud, radio = 100, filtros = {}) {
  const query = new URLSearchParams({
    latitud: String(latitud),
    longitud: String(longitud),
    radio: String(radio),
  });
  if (filtros.idMateria) query.set("id_materia", filtros.idMateria);
  if (filtros.idArea) query.set("id_area", filtros.idArea);
  return request(`/profesores/buscar?${query}`);
}
 
export async function buscarClases(consulta, latitud, longitud, radio = 100) {
  return request("/clases/buscar", {
    method: "POST",
    body: JSON.stringify({
      consulta,
      latitud,
      longitud,
      radio,
    }),
  });
}
 
export async function obtenerMaterias(idArea) {
  const query = idArea ? `?id_area=${encodeURIComponent(idArea)}` : "";
  return request(`/materias${query}`);
}
 
export async function obtenerAreas() {
  return request("/areas");
}
 
export async function crearArea(nombreArea) {
  return request("/areas", {
    method: "POST",
    body: JSON.stringify({ nombreArea }),
  });
}
 
export async function crearMateria(nombreMateria, idArea) {
  return request("/materias", {
    method: "POST",
    body: JSON.stringify({
      nombreMateria,
      id_area_conocimiento: idArea,
    }),
  });
}
 
export async function crearClase(datos) {
  return request("/clases/crear", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}
 
// Sube el PDF de una clase (solo el profesor dueño de la clase).
export async function subirMaterialClase(idClase, archivo) {
  const formData = new FormData();
  formData.append("pdf", archivo);
  return request(`/clases/${idClase}/material`, {
    method: "POST",
    body: formData,
  });
}

export async function reemplazarMaterialClase(idClase, idMaterial, archivo) {
  const formData = new FormData();
  formData.append("pdf", archivo);
  return request(`/clases/${idClase}/material/${encodeURIComponent(idMaterial)}`, {
    method: "PATCH",
    body: formData,
  });
}

export async function eliminarMaterialClase(idClase, idMaterial) {
  return request(`/clases/${idClase}/material/${encodeURIComponent(idMaterial)}`, {
    method: "DELETE",
  });
}
 
// El profesor cambia el horario de una clase; el servidor avisa por mail a los alumnos inscriptos.
export async function cambiarHorarioClase(idClase, fechaHoraInicio, fechaHoraFin) {
  return request(`/clases/${idClase}/horario`, {
    method: "PATCH",
    body: JSON.stringify({
      fecha_hora_inicio: fechaHoraInicio,
      fecha_hora_fin: fechaHoraFin,
    }),
  });
}
 
export async function obtenerPerfilProfesor(idProfesor) {
  return request(`/profesores/${idProfesor}`);
}
 
export async function actualizarPerfil(datos) {
  return request("/perfil", {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export async function obtenerNotificaciones() {
  return request("/notificaciones");
}

export async function marcarNotificacionLeida(idNotificacion) {
  return request(`/notificaciones/${encodeURIComponent(idNotificacion)}/leida`, {
    method: "PATCH",
  });
}
 
export async function geocodificarDireccion(direccion) {
  const params = new URLSearchParams({
    q: direccion,
    format: "jsonv2",
    limit: "1",
    "accept-language": "es",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!response.ok) {
    throw new Error("No se pudo buscar esa direccion");
  }
  const results = await response.json();
  if (!results.length) {
    throw new Error("No encontramos esa direccion. Proba con ciudad y provincia.");
  }
  return {
    latitud: Number(results[0].lat),
    longitud: Number(results[0].lon),
    nombre: results[0].display_name,
  };
}
 
export async function obtenerHorariosProfesor(idProfesor, desde, hasta) {
  const query = new URLSearchParams({ desde, hasta });
  return request(`/profesores/${idProfesor}/horarios?${query}`);
}

export async function obtenerMateriasProfesor() {
  return request("/profesores/materias");
}

export async function asociarMateriaProfesor(idMateria) {
  return request("/profesores/materias", {
    method: "POST",
    body: JSON.stringify({ id_materia: idMateria }),
  });
}

export async function desasociarMateriaProfesor(idMateria) {
  return request(`/profesores/materias/${encodeURIComponent(idMateria)}`, {
    method: "DELETE",
  });
}

export async function crearInscripcion(datos) {
  return request("/inscripciones", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}
 
export async function obtenerMisInscripciones(historial = false) {
  return request(`/inscripciones/mias?historial=${historial}`);
}
 
export async function obtenerInscripcion(idInscripcion) {
  return request(`/inscripciones/${idInscripcion}`);
}
 
export async function pagarInscripcion(idInscripcion) {
  return request(`/inscripciones/${idInscripcion}/pago`, {
    method: "POST",
    body: JSON.stringify({ plataforma: "web" }),
  });
}
 
export async function obtenerClasesProgramadas(historial = false) {
  return request(`/clases/programadas?historial=${historial}`);
}
 
export async function obtenerMiDisponibilidad() {
  return request("/disponibilidad");
}
 
export async function guardarMiDisponibilidad(franjas) {
  return request("/disponibilidad", {
    method: "PUT",
    body: JSON.stringify({ franjas }),
  });
}
 
export async function obtenerPagos() {
  return request("/pagos/mios");
}
 
export async function verificarPago(idPago) {
  return request("/pagos/verificar", {
    method: "POST",
    body: JSON.stringify({ payment_id: String(idPago) }),
  });
}
 