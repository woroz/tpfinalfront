const ESTADOS = {
  abierta: { texto: "Abierta", clase: "disponible" },
  tomada: { texto: "Tomada", clase: "confirmada" },
  cerrada: { texto: "Cerrada", clase: "" },
  vencida: { texto: "Vencida", clase: "expirada" },
  pendiente: { texto: "Pendiente", clase: "pendiente_pago" },
  aceptada: { texto: "Aceptada", clase: "confirmada" },
  rechazada: { texto: "Rechazada", clase: "rechazado" },
};

export function EstadoChip({ estado }) {
  const { texto, clase } = ESTADOS[estado] || { texto: estado, clase: "" };
  return <span className={`res-estado ${clase}`.trim()}>{texto}</span>;
}

export function ChipsMaterias({ solicitud }) {
  const materias = (solicitud.solicitudMateria || []).map((item) => item.materia).filter(Boolean);
  if (!materias.length) return null;
  return (
    <ul className="tablon-chips">
      {materias.map((materia) => (
        <li key={materia.id_materia}>{materia.nombreMateria}</li>
      ))}
    </ul>
  );
}