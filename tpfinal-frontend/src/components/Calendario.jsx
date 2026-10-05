import { useState } from "react";

const CABECERA = ["L", "M", "X", "J", "V", "S", "D"];

function claveMes(anio, mes) {
  return anio * 12 + mes;
}

function armarClave(anio, mes, dia) {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export default function Calendario({ diasDisponibles, seleccionada, onSeleccionar, minimo, maximo }) {
  const [vista, setVista] = useState(() => {
    const referencia = seleccionada || [...diasDisponibles].sort()[0] || minimo;
    const [anio, mes] = referencia.split("-").map(Number);
    return { anio, mes: mes - 1 };
  });

  const [anioMinimo, mesMinimo] = minimo.split("-").map(Number);
  const [anioMaximo, mesMaximo] = maximo.split("-").map(Number);
  const mesActual = claveMes(vista.anio, vista.mes);
  const puedeRetroceder = mesActual > claveMes(anioMinimo, mesMinimo - 1);
  const puedeAvanzar = mesActual < claveMes(anioMaximo, mesMaximo - 1);

  const huecos = (new Date(Date.UTC(vista.anio, vista.mes, 1)).getUTCDay() + 6) % 7;
  const totalDias = new Date(Date.UTC(vista.anio, vista.mes + 1, 0)).getUTCDate();
  const celdas = [
    ...Array(huecos).fill(null),
    ...Array.from({ length: totalDias }, (_, indice) => indice + 1),
  ];

  const titulo = new Date(Date.UTC(vista.anio, vista.mes, 1)).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  function mover(delta) {
    setVista(({ anio, mes }) => {
      const fecha = new Date(Date.UTC(anio, mes + delta, 1));
      return { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() };
    });
  }

  return (
    <div className="res-calendario">
      <div className="res-calendario-cabecera">
        <button type="button" onClick={() => mover(-1)} disabled={!puedeRetroceder} aria-label="Mes anterior">
          ‹
        </button>
        <strong>{titulo}</strong>
        <button type="button" onClick={() => mover(1)} disabled={!puedeAvanzar} aria-label="Mes siguiente">
          ›
        </button>
      </div>

      <div className="res-calendario-grilla">
        {CABECERA.map((letra) => (
          <span key={letra} className="res-calendario-letra">{letra}</span>
        ))}
        {celdas.map((dia, indice) => {
          if (dia === null) return <span key={`hueco-${indice}`} />;
          const clave = armarClave(vista.anio, vista.mes, dia);
          const disponible = diasDisponibles.has(clave);
          const clases = [
            "res-dia",
            disponible ? "disponible" : "",
            seleccionada === clave ? "activo" : "",
          ].join(" ").trim();
          return (
            <button
              key={clave}
              type="button"
              className={clases}
              disabled={!disponible}
              onClick={() => onSeleccionar(clave)}
              aria-pressed={seleccionada === clave}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}
