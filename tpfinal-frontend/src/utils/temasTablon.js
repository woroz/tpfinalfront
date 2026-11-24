const precargados = new Map([
  ["cartografia", ["Lectura de mapas", "Coordenadas geográficas", "Escalas cartográficas", "Proyecciones cartográficas", "Curvas de nivel", "Sistemas de información geográfica"]],
  ["ecuaciones", ["Ecuaciones de primer grado", "Ecuaciones de segundo grado", "Sistemas de ecuaciones", "Ecuaciones con fracciones", "Ecuaciones exponenciales", "Ecuaciones logarítmicas"]],
  ["fisica", ["Cinemática", "Dinámica", "Trabajo y energía", "Ondas y sonido", "Electricidad", "Termodinámica"]],
  ["idiomas", ["Comprensión lectora", "Gramática", "Conversación", "Pronunciación", "Comprensión auditiva", "Expresión escrita"]],
  ["matematica", ["Funciones", "Geometría", "Fracciones", "Probabilidad y estadística", "Trigonometría", "Ecuaciones de primer grado", "Sistemas de ecuaciones"]],
  ["quimica", ["Estructura atómica", "Reacciones químicas", "Tabla periódica", "Enlaces químicos", "Estequiometría", "Soluciones y concentración"]],
  ["informatica", ["Programación", "Algoritmos", "Bases de datos", "Redes"]],
]);

export function temasDeSeleccion(catalogo, ids) {
  const temas = new Set();
  for (const materia of catalogo) {
    if (!ids.includes(materia.id_materia)) continue;
    const nombre = materia.nombreMateria.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    const clave = nombre === "matematicas" ? "matematica" : nombre;
    for (const tema of precargados.get(clave) ?? []) temas.add(tema);
    for (const tema of materia.temas ?? []) temas.add(tema);
  }
  return [...temas];
}
