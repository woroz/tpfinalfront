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

    const unirseALaSala = () => {
      socket.emit('unirse_clase', { 
        id_clase: idClase, 
        id_usuario_actual: idUsuarioActual 
      });
      socket.emit('marcar_mensajes_leidos', { id_clase: idClase, id_usuario: idUsuarioActual });
    };

     const inicializarChat = async () => {
      try {
        const response = await obtenerHistorialMensajes(idClase);
        if (response && response.mensajes) {
          setMensajes(response.mensajes);
        }

        unirseALaSala();

      } catch (error) {
        console.error('Error al inicializar el chat:', error.message);
      }
    };

    inicializarChat();

    socket.on('connect', () => {
      unirseALaSala();
    });

    socket.on('error_socket', (error) => {
      console.error('Error de Socket desde el Servidor:', error.mensaje);
    });

    socket.on('recibir_mensaje', (nuevoMensaje) => {
      if (nuevoMensaje.id_usuario_remitente !== idUsuarioActual) {
        socket.emit('marcar_mensajes_leidos', { id_clase: idClase, id_usuario: idUsuarioActual });
      }
      setMensajes((prev) => {
        const indexTemporal = prev.findIndex(msg => msg.id_usuario_remitente === nuevoMensaje.id_usuario_remitente && msg.contenido === nuevoMensaje.contenido && String(msg.id_mensaje).startsWith('temp-'));
        if (indexTemporal !== -1) {
          const copiaMensajes = [...prev];
          copiaMensajes[indexTemporal] = nuevoMensaje;
          return copiaMensajes;
        }
        if (nuevoMensaje.id_usuario_remitente !== idUsuarioActual) {
          return [
            ...prev.map(msg => msg.id_usuario_remitente === idUsuarioActual ? { ...msg, leido: true } : msg),
            nuevoMensaje
          ];
        }
        return [...prev, nuevoMensaje];
      });
    });

    socket.on('mensajes_leidos_actualizados', (data) => {
      if (data.por_usuario !== idUsuarioActual) {
        setMensajes((prev) => 
          prev.map(msg => msg.id_usuario_remitente === idUsuarioActual ? { ...msg, leido: true } : msg)
        );
      }
    });

    return () => {
      socket.off('connect');
      socket.off('error_socket');
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
    const contenidoMensaje = textoMensaje;
    setTextoMensaje('');

    socket.emit('enviar_mensaje', {
      id_clase: idClase,
      id_usuario_remitente: idUsuarioActual,
      contenido: contenidoMensaje
    });

    const mensajeTemporal = {
      id_mensaje: `temp-${Date.now()}`,
      id_usuario_remitente: idUsuarioActual,
      contenido: contenidoMensaje,
      fecha_envio: new Date().toISOString(),
      leido: false
    };

    setMensajes((prev) => [...prev, mensajeTemporal]);
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
