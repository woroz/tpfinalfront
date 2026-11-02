export function formatearPromedio(valor) {
  return valor == null ? null : valor.toFixed(1).replace(".", ",");
}

export function miembroDesde(fechaISO) {
  const dias = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 86400000);
  if (dias < 1) return "hace menos de un día";
  if (dias < 30) return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  return `hace ${anios} ${anios === 1 ? "año" : "años"}`;
}

export function plural(cantidad, singular, plural) {
  return cantidad === 1 ? singular : plural;
}