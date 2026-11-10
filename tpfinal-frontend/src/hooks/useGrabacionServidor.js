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

  const consultarEstado = useCallback(async () => {
    try {
      const data = await obtenerEstadoGrabacionClase(idClase);
      if (data.existe && data.estado) {
        setEstado(data.estado);
      } else if (!data.existe) {
        setEstado("sin_grabacion");
      }
    } catch (err) {
      console.error("Error al consultar el estado de la grabación:", err);
    }
  }, [idClase]);

  useEffect(() => {
    if (!["grabando", "finalizando"].includes(estado)) return;
    consultarEstado();
    const intervalo = setInterval(() => {
      consultarEstado();
    }, 5000);
    return () => clearInterval(intervalo);
  }, [estado, consultarEstado]);
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
