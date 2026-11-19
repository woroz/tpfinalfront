/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const TemaContext = createContext(null);
const CLAVE_TEMA = "mentorar.tema";

function leerTema() {
  try {
    return { tema: localStorage.getItem(CLAVE_TEMA) === "oscuro" ? "oscuro" : "claro", error: "" };
  } catch (error) {
    console.error("No se pudo leer la preferencia de tema.", error);
    return { tema: "claro", error: "No se pudo leer la preferencia de tema del navegador." };
  }
}

export function TemaProvider({ children }) {
  const [configuracion, setConfiguracion] = useState(leerTema);
  const { tema, error } = configuracion;

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  function cambiarTema() {
    const siguiente = tema === "oscuro" ? "claro" : "oscuro";
    try {
      localStorage.setItem(CLAVE_TEMA, siguiente);
      setConfiguracion({ tema: siguiente, error: "" });
    } catch (errorGuardado) {
      console.error("No se pudo guardar la preferencia de tema.", errorGuardado);
      setConfiguracion({ tema: siguiente, error: "No se pudo guardar el tema para la próxima visita." });
    }
  }

  return <TemaContext.Provider value={{ tema, error, cambiarTema }}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const context = useContext(TemaContext);
  if (!context) throw new Error("useTema debe usarse dentro de un <TemaProvider>");
  return context;
}
