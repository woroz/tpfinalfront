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

export async function register(email, password, nombre, rol) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, nombre, rol }),
  });

  const data = await readResponse(res);
  if (!res.ok) throw new Error(data.message);
  return data;
}

export async function obtenerPerfil() {
  return request("/perfil");
}

export async function buscarProfesores(latitud, longitud, radio = 100) {
  const query = new URLSearchParams({
    latitud: String(latitud),
    longitud: String(longitud),
    radio: String(radio),
  });
  return request(`/profesores/buscar?${query}`);
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
