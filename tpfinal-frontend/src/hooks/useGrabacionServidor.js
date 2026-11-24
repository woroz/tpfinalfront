import { useCallback, useEffect, useRef, useState } from "react";
import {
  iniciarGrabacionClase,
  detenerGrabacionClase,
  obtenerEstadoGrabacionClase,
} from "../services/api";

export function useGrabacionServidor(idClase) {
  const [estado, setEstado] = useState("pendiente");
  const [error, setError] = useState(null);
  const operacionRef = useRef(false);

  const iniciar = useCallback(async () => {
    if (
      operacionRef.current ||
      ["grabando", "finalizando", "completada"].includes(estado)
    ) return;

    operacionRef.current = true;
    setError(null);
    try {
      await iniciarGrabacionClase(idClase);
      setEstado("grabando");
    } catch (err) {
      console.error("Error al iniciar la grabación audiovisual:", err);
      setError(err.message || "No se pudo iniciar la grabación.");
    } finally {
      operacionRef.current = false;
    }
  }, [idClase, estado]);

  const detener = useCallback(async () => {
    if (operacionRef.current || estado !== "grabando") return;
    operacionRef.current = true;
    setError(null);
    try {
      await detenerGrabacionClase(idClase);
      setEstado("finalizando");
    } catch (err) {
      console.error("Error al detener la grabación audiovisual:", err);
      setError(err.message || "No se pudo detener la grabación.");
    } finally {
      operacionRef.current = false;
    }
  }, [idClase, estado]);

  useEffect(() => {
    if (!["grabando", "finalizando"].includes(estado)) return;
    let activo = true;
    let temporizador;
    async function consultarEstado() {
      try {
        const data = await obtenerEstadoGrabacionClase(idClase);
        if (activo && !data.existe) setEstado("sin_grabacion");
        else if (activo && data.estado) setEstado(data.estado);
      } catch (err) {
        console.error("Error al consultar el estado de la grabación:", err);
      } finally {
        if (activo) temporizador = setTimeout(consultarEstado, 5000);
      }
    }
    consultarEstado();
    return () => { activo = false; clearTimeout(temporizador); };
  }, [estado, idClase]);
  return {
    estado,
    error,
    iniciar,
    detener,
    grabando: estado === "grabando",
    finalizando: estado === "finalizando",
    completada: estado === "completada",
  };
}
