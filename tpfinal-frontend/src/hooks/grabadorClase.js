import { useCallback, useEffect, useRef, useState } from "react";
import { subirChunkTranscripcion } from "../services/api";

const CICLO_MS = 20_000;

function elegirMime() {
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
    .find((tipo) => MediaRecorder.isTypeSupported(tipo)) || "";
}

export function useGrabadorClase(idClase) {
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const trozosRef = useRef([]);
  const grabandoRef = useRef(false);
  const finalizandoRef = useRef(false);
  const [progreso, setProgreso] = useState(null);

  const iniciar = useCallback(async () => {
    if (grabandoRef.current) return;
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("No se pudo acceder al micrófono para transcribir", err);
      return;
    }
    grabandoRef.current = true;
    const mimeType = elegirMime();

    const ciclo = () => {
      const recorder = new MediaRecorder(streamRef.current, {
        ...(mimeType && { mimeType }),
        audioBitsPerSecond: 32000,
      });
      const partes = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) partes.push(e.data); };
      recorder.onstop = () => {
        if (partes.length) trozosRef.current.push(new Blob(partes, { type: recorder.mimeType }));
        if (grabandoRef.current) ciclo();
      };
      recorder.start();
      recorderRef.current = recorder;
      timerRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, CICLO_MS);
    };
    ciclo();
  }, []);

  const detener = useCallback(() => new Promise((resolve) => {
    grabandoRef.current = false;
    clearTimeout(timerRef.current);
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return resolve();
    const alParar = recorder.onstop;
    recorder.onstop = (e) => { alParar?.(e); resolve(); };
    recorder.stop();
  }), []);

  const finalizar = useCallback(async () => {
    if (finalizandoRef.current) return;
    finalizandoRef.current = true;
    await detener();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const trozos = trozosRef.current;
    trozosRef.current = [];

    for (let i = 0; i < trozos.length; i += 1) {
      setProgreso({ enviados: i, total: trozos.length });
      for (let intento = 0; intento < 2; intento += 1) {
        try {
          await subirChunkTranscripcion(idClase, trozos[i]);
          break;
        } catch (err) {
          console.error(`Falló el fragmento ${i + 1} (intento ${intento + 1})`, err);
        }
      }
    }
    setProgreso(null);
    finalizandoRef.current = false;
  }, [detener, idClase]);

  useEffect(() => () => {
    grabandoRef.current = false;
    clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { iniciar, finalizar, progreso };
}