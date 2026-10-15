import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useRoomContext } from "@livekit/components-react";
import "../styles/claseVirtual.css";

export const BotonFinalizarProfesor = ({ nombre_sala }) => {
  const navigate = useNavigate();
  const room = useRoomContext();

  const handleFinalizar = async () => {
    const confirmar = window.confirm("¿Seguro que quiere finalizar la clase? Esto desconectará a todos.");
    if (!confirmar) return;
    try {
      const tokenAuth = localStorage.getItem("token") || localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:3000/sala-videollamada/finalizar/${nombre_sala}`, {
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
  
  useEffect(() => {
    const solicitarAccesoSala = async () => {
      try {
        const tokenAuth = 
          localStorage.getItem("token") || 
          localStorage.getItem("authToken") || 
          localStorage.getItem("accessToken"); 

        if (!tokenAuth) {
          throw new Error("No se encontró ninguna sesión activa en el navegador. Por favor, vuelve a iniciar sesión.");
        }

        const response = await fetch(`http://localhost:3000/sala-videollamada/token/${id_clase}`, {
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
        <h3>Conectando con los servidores de mentorAr...</h3>
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
        onDisconnected={() => navigate("/mis-clases")}
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
            } catch (e) {
              return false;
            }
          })() && (
            <BotonFinalizarProfesor nombre_sala={nombreSala} />
          )}
        </div>
      </LiveKitRoom>
    </div>
  );
};