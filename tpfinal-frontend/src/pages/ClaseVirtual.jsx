import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { useAuth } from "../context/authContext";
import { useGrabadorClase } from "../hooks/grabadorClase";
import "@livekit/components-styles";
import { useRoomContext } from "@livekit/components-react";
import "../styles/claseVirtual.css";

const API_URL = import.meta.env.VITE_API_URL;

export const BotonFinalizarProfesor = ({ nombre_sala }) => {
  const navigate = useNavigate();
  const room = useRoomContext();

  const handleFinalizar = async () => {
    const confirmar = window.confirm("¿Seguro que quiere finalizar la clase? Esto desconectará a todos.");
    if (!confirmar) return;
    try {
      const tokenAuth = localStorage.getItem("token") || localStorage.getItem("authToken");
      const res = await fetch(`${API_URL}/sala-videollamada/finalizar/${nombre_sala}`, {
        method: "DELETE",
        headers: {
          "authorization": `Bearer ${tokenAuth?.trim()}`,
          "content-Type": "application/json"
        }
      });

      if (res.ok) {
        await room.disconnect();
        navigate("/mis-clases");
      }
    } catch (err) {
      console.error("Error al finalizar la clase:", err);
    }
  };
  return (
    <button onClick={handleFinalizar} className="btn-finalizar-clase">
      Finalizar Clase
    </button>
  );
};

export const ClaseVirtual = () => {
  const [nombreSala, setNombreSala] = useState("");
  const { id_clase } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const { usuario } = useAuth();
  const esProfesor = usuario?.rol === "profesor";
  const { iniciar, finalizar, progreso } = useGrabadorClase(id_clase);

  useEffect(() => {
    if (!progreso) return undefined;
    const avisar = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [progreso]);

  useEffect(() => {
    const solicitarAccesoSala = async () => {
      try {
        const tokenAuth =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken");

        if (!tokenAuth) {
          throw new Error("No se encontró ninguna sesion activa en el navegador. Por favor, vuelve a iniciar sesion.");
        }

        const response = await fetch(`${API_URL}/sala-videollamada/token/${id_clase}`, {
          method: "GET",
          headers: {
            "authorization": `Bearer ${tokenAuth.trim()}`,
            "content-Type": "application/json"
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || "No se pudo conectar a la sala virtual.");
        }

        setToken(data.token);
        setNombreSala(data.nombre_sala);
      } catch (err) {
        setError(err.message);
      }
    };
    solicitarAccesoSala();
  }, [id_clase]);

  if (error) {
    return (
      <div style={{ padding: "50px", textAlign: "center", color: "#dc3545", fontFamily: "sans-serif" }}>
        <h2>No es posible unirse</h2>
        <p style={{ color: "#333", margin: "15px 0" }}>{error}</p>
        <button
          onClick={() => navigate("/mis-clases")}
          style={{ padding: "10px 20px", cursor: "pointer", background: "#007bff", color: "white", border: "none", borderRadius: "5px" }}
        >
          Volver a Mis Clases
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ padding: "100px", textAlign: "center", fontFamily: "sans-serif", color: "#666" }}>
        <h3>Conectando con el servidor de mentorAr...</h3>
        <p>Por favor, aguarde un momento.</p>
      </div>
    );
  }

   return (
    <div style={{ height: "100vh", width: "100vw" }} data-lk-theme="default">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl="wss://mentorar-video-syfwrkrz.livekit.cloud"
        onConnected={() => {
          if (esProfesor) iniciar();
        }}
        onDisconnected={async () => {
          try {
            if (esProfesor) await finalizar();
          } finally {
            navigate("/mis-clases");
          }
        }}
      >
        <div className="lk-video-conference">
          <div className="lk-video-conference-inner">
            <VideoConference />
          </div>
          {nombreSala && (() => {
            try {
              const userRaw = localStorage.getItem("user");
              if (!userRaw) return false;
              const userObj = JSON.parse(userRaw);
              return userObj.rol === "profesor";
            } catch (error) {
              return false;
            }
          })() && (
            <BotonFinalizarProfesor nombre_sala={nombreSala} />
          )}
        </div>
      </LiveKitRoom>

      {progreso && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 10000, display: "grid",
            placeItems: "center", background: "rgba(255,255,255,.95)",
            textAlign: "center", fontFamily: "sans-serif", color: "#333",
          }}
        >
          <div>
            <h3>Transcribiendo la clase…</h3>
            <p>{progreso.enviados} de {progreso.total} fragmentos. No cierres esta pestaña.</p>
          </div>
        </div>
      )}
    </div>
  );
};