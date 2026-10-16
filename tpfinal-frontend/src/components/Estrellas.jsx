function normalizarPuntaje(puntaje) {
  return Math.max(0, Math.min(5, Number(puntaje) || 0));
}

export default function Estrellas({ puntaje, className = "", onChange, disabled = false }) {
  const valor = normalizarPuntaje(puntaje);
  const interactivo = typeof onChange === "function";

  if (!interactivo) {
    return (
      <span className={`perfil-estrellas ${className}`} role="img" aria-label={`${valor.toFixed(1)} de 5 estrellas`}>
        {Array.from({ length: 5 }, (_, indice) => {
          const relleno = Math.max(0, Math.min(1, valor - indice));
          return (
            <span
              key={indice}
              className="perfil-estrella"
              style={{ "--relleno-estrella": `${relleno * 100}%` }}
              aria-hidden="true"
            >
              ★
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <div className={`perfil-estrellas perfil-estrellas-interactivas ${className}`} role="radiogroup" aria-label="Tu valoración">
      {Array.from({ length: 5 }, (_, indice) => {
        const estrella = indice + 1;
        return (
          <span className="perfil-estrella-control" key={estrella}>
            <span className="perfil-estrella perfil-estrella-base" aria-hidden="true">★</span>
            <span
              className="perfil-estrella perfil-estrella-relleno"
              style={{ "--relleno-estrella": `${Math.max(0, Math.min(1, valor - indice)) * 100}%` }}
              aria-hidden="true"
            >
              ★
            </span>
            <button
              type="button"
              className="perfil-media-estrella"
              role="radio"
              aria-label={`${estrella - 0.5} de 5 estrellas`}
              aria-checked={valor === estrella - 0.5}
              disabled={disabled}
              onClick={() => onChange(estrella - 0.5)}
            />
            <button
              type="button"
              className="perfil-media-estrella perfil-estrella-completa"
              role="radio"
              aria-label={`${estrella} de 5 estrellas`}
              aria-checked={valor === estrella}
              disabled={disabled}
              onClick={() => onChange(estrella)}
            />
          </span>
        );
      })}
    </div>
  );
}
