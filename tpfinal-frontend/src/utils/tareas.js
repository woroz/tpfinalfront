export function interpretarNota(valor) {
  const texto = String(valor).trim().replace(",", ".");
  const nota = Number(texto);
  if (!texto || !Number.isFinite(nota) || nota < 0 || nota > 10) {
    throw new Error("Ingresá una nota entre 0 y 10.");
  }
  return nota;
}

export function validarArchivos(archivos) {
  if (archivos.length > 3) throw new Error("Podés adjuntar hasta 3 archivos.");
  for (const archivo of archivos) {
    if (!/\.(pdf|jpg|jpeg|png)$/i.test(archivo.name) || archivo.size <= 0 || archivo.size > 4 * 1024 * 1024) {
      throw new Error("Elegí archivos PDF, JPG o PNG de hasta 4 MB cada uno.");
    }
  }
  return archivos;
}

export function validarListaTareas(tareas, esProfesor) {
  if (!Array.isArray(tareas)) throw new Error("El servidor devolvió una lista de tareas inválida.");
  for (const item of tareas) {
    const tarea = esProfesor ? item : item?.tarea;
    if (!tarea || typeof tarea.id_tarea !== "string" || typeof tarea.titulo !== "string" ||
      (tarea.descripcion != null && typeof tarea.descripcion !== "string") ||
      (tarea.fechaLimite != null && typeof tarea.fechaLimite !== "string") || !Array.isArray(tarea.adjuntos)) {
      throw new Error("El servidor devolvió una tarea inválida.");
    }
    const entregas = esProfesor ? item.asignaciones : [item];
    if (!Array.isArray(entregas) || entregas.some((entrega) => !entrega || !Array.isArray(entrega.archivos) ||
      (esProfesor && (typeof entrega.id_alumno !== "string" || typeof entrega.nombre !== "string")) ||
      (entrega.entregaTexto != null && typeof entrega.entregaTexto !== "string") ||
      (entrega.entregadaEn != null && typeof entrega.entregadaEn !== "string") ||
      (entrega.comentario != null && typeof entrega.comentario !== "string") ||
      (entrega.nota != null && (typeof entrega.nota !== "number" || !Number.isFinite(entrega.nota))))) {
      throw new Error("El servidor devolvió entregas inválidas.");
    }
    if ([...tarea.adjuntos, ...entregas.flatMap((entrega) => entrega.archivos)].some(
      (archivo) => !archivo || typeof archivo.nombre !== "string" || typeof archivo.url !== "string",
    )) throw new Error("El servidor devolvió archivos inválidos.");
  }
}

export function validarMisTareas(tareas) {
  validarListaTareas(tareas, false);
  if (tareas.some((item) => typeof item.tarea.clase?.id_clase !== "string" ||
    typeof item.tarea.clase?.titulo !== "string")) {
    throw new Error("El servidor devolvió datos de clase inválidos.");
  }
}

export function prepararTarea(idClase, titulo, descripcion, alumnos, fechaLimite, ahora = Date.now()) {
  const tituloLimpio = titulo.trim();
  const descripcionLimpia = descripcion.trim();
  if (!idClase || !tituloLimpio || tituloLimpio.length > 100) throw new Error("Ingresá un título de hasta 100 caracteres.");
  if (descripcionLimpia.length > 1000) throw new Error("La consigna puede tener hasta 1000 caracteres.");
  if (!alumnos.length || alumnos.length > 50) throw new Error("Seleccioná entre 1 y 50 alumnos.");
  const datos = { id_clase: idClase, titulo: tituloLimpio, descripcion: descripcionLimpia, id_alumno: alumnos };
  if (fechaLimite) {
    const fecha = new Date(fechaLimite);
    if (!Number.isFinite(fecha.getTime()) || fecha.getTime() <= ahora) throw new Error("La fecha límite debe ser futura.");
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(fecha);
    const parte = (tipo) => partes.find((item) => item.type === tipo)?.value;
    datos.fechaLimite = `${parte("year")}-${parte("month")}-${parte("day")}T${parte("hour")}:${parte("minute")}`;
  }
  return datos;
}

export function prepararEntrega(texto, cantidadArchivos) {
  const limpio = texto.trim();
  if (!limpio && cantidadArchivos === 0) throw new Error("Escribí una respuesta o adjuntá un archivo antes de entregar.");
  if (limpio.length > 5000) throw new Error("La respuesta puede tener hasta 5000 caracteres.");
  return limpio;
}
