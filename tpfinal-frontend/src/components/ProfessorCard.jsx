import professorImage from "../assets/profesor.png";

function getProfessorSubjects(professor) {
  const materias = professor.materias?.length
    ? professor.materias
    : (professor.clases || []);

  return materias
    .map((item) => (
      item.materia?.nombreMateria
      || item.nombreMateria
      || item.materia?.nombre
      || item.materia?.nombre_materia
      || item.nombre
      || item.nombre_materia
    ))
    .filter(Boolean)
    .filter((subject, index, subjects) => subjects.indexOf(subject) === index)
    .join(", ");
}

function getProfessorPrice(professor) {
  return professor.tarifa ?? professor.tarifa_hora;
}

function getProfessorName(professor) {
  return professor.usuario?.nombre || professor.nombre || professor.usuario?.email || "Profesor";
}

export default function ProfessorCard({ professor, onClose }) {
  return (
    <article
      className="profile-modal professor-profile-preview map-professor-popup"
      role="dialog"
      aria-labelledby="professor-card-title"
    >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="profile-preview-top">
          <div className="modal-avatar">
            <img src={professorImage} alt="" />
          </div>
          <div>
            <h2 id="professor-card-title">{getProfessorName(professor)}</h2>
            <button className="professor-profile-button" type="button">
              Ver perfil
            </button>
          </div>
        </div>
        <div className="profile-preview-details">
          <div>
            <strong>Materias: {getProfessorSubjects(professor) || "No informadas"}</strong>
          </div>
          <div>
            <strong>
              Precio: {getProfessorPrice(professor) != null
                ? `$${getProfessorPrice(professor)} / hora`
                : "No informado"}
            </strong>
          </div>
          <div>
            <strong>
              Distancia: {professor.distancia != null
                ? `${Number(professor.distancia).toFixed(1)} km desde tu ubicación`
                : "No disponible"}
            </strong>
          </div>
        </div>
        <p>{professor.descripcion || professor.usuario?.perfil?.biografia || "Este profesor todavia no agregó una descripcion."}</p>
    </article>
  );
}
