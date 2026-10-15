import { useEffect, useState, useRef } from 'react';
import { socket } from '../services/socket.js';
import { obtenerHistorialMensajes } from '../services/api.js';
import '../styles/chat.css';

export default function ChatClase({ idClase, idUsuarioActual }) {
  const [mensajes, setMensajes] = useState([]);
  const [textoMensaje, setTextoMensaje] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const cargarHistorial = async () => {
      try {
        const response = await obtenerHistorialMensajes(idClase);
        if (response && response.mensajes) {
          setMensajes(response.mensajes);
        }
      } catch (error) {
        console.error('Error al cargar el historial del chat:', error.message);
      }
    };

    cargarHistorial();

    socket.emit('unirse_clase', { 
      id_clase: idClase, 
      id_usuario_actual: idUsuarioActual 
    });

    socket.on('recibir_mensaje', (nuevoMensaje) => {
      setMensajes((prev) => [...prev, nuevoMensaje]);
    });

    socket.on('mensajes_leidos_actualizados', (data) => {
      if (data.por_usuario !== idUsuarioActual) {
        setMensajes((prev) => 
          prev.map(msg => msg.id_usuario_remitente === idUsuarioActual ? { ...msg, leido: true } : msg)
        );
      }
    });

    return () => {
      socket.off('recibir_mensaje');
      socket.off('mensajes_leidos_actualizados');
    };
  }, [idClase, idUsuarioActual]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const manejarEnvio = (e) => {
    e.preventDefault();
    if (!textoMensaje.trim()) return;

    socket.emit('enviar_mensaje', {
      id_clase: idClase,
      id_usuario_remitente: idUsuarioActual,
      contenido: textoMensaje
    });

    setTextoMensaje('');
  };

  return (
    <div className="chat-contenedor">
      <div className="chat-area-mensajes">
        {mensajes.map((msg) => {
          const esMiMensaje = msg.id_usuario_remitente === idUsuarioActual;
          return (
            <div 
              key={msg.id_mensaje} 
              className={`chat-fila-mensaje ${esMiMensaje ? 'mio' : 'otro'}`}
            >
              <div className={`chat-burbuja ${esMiMensaje ? 'mio' : 'otro'}`}>
                <p className="chat-texto">{msg.contenido}</p>
                <div className="chat-metadata">
                  <span>
                    {new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {esMiMensaje && (
                    <span style={{ marginLeft: '5px' }}>
                      {msg.leido ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={manejarEnvio} className="chat-formulario">
        <input
          type="text"
          value={textoMensaje}
          onChange={(e) => setTextoMensaje(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="chat-input"
        />
        <button type="submit" className="chat-boton">Enviar</button>
      </form>
    </div>
  );
}
