export default function ReputacionProfesor({ promedio }) {
  const puntos = promedio == null ? null : Math.round(promedio * 20);
  return <div className="reputacion-profesor">
    <span>Reputación · {puntos == null ? "Sin reseñas" : puntos + "/100"}</span>
    <div className="reputacion-pista" role={puntos == null ? undefined : "meter"}
      aria-label={puntos == null ? undefined : "Reputación del profesor"} aria-valuemin={puntos == null ? undefined : 0}
      aria-valuemax={puntos == null ? undefined : 100} aria-valuenow={puntos ?? undefined}>
      {puntos != null && <div style={{ width: puntos + "%" }}/>}
    </div>
  </div>;
}
