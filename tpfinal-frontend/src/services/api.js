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
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

export async function register(email, password, nombre, rol, direccion) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, nombre, rol, direccion }),
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

export async function obtenerPerfilProfesor(idProfesor) {
  return request(`/profesores/${idProfesor}`);
}

export async function actualizarPerfil(datos) {
  return request("/perfil", {
    method: "PATCH",
    body: JSON.stringify(datos),
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
