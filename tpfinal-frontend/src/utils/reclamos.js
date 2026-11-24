const ETIQUETAS = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  resuelto: "Resuelto",
  rechazado: "Rechazado",
};

export function estadoReclamoLabel(estado) {
  return ETIQUETAS[estado] || estado;
}
