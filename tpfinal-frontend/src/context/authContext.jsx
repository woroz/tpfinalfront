/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { obtenerPerfil } from "../services/api";

const AuthContext = createContext(null);

const claveAvatar = (id) => `avatarURL:${id}`;

function leerAvatarCache(id) {
  try {
    return localStorage.getItem(claveAvatar(id)) || "";
  } catch {
    return "";
  }
}

function guardarAvatarCache(id, url) {
  try {
    if (url) localStorage.setItem(claveAvatar(id), url);
    else localStorage.removeItem(claveAvatar(id));
  } catch {
    // no hay cache
  }
}

function decodificarToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function obtenerSesionInicial() {
  const tokenGuardado = localStorage.getItem("token");

  if (!tokenGuardado) {
    return { token: null, usuario: null };
  }

  const payload = decodificarToken(tokenGuardado);

  if (!payload) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    return { token: null, usuario: null };
  }

  return {
    token: tokenGuardado,
    usuario: { ...payload, avatarURL: leerAvatarCache(payload.id_usuario) },
  };
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerSesionInicial().usuario);
  const [token, setToken] = useState(() => obtenerSesionInicial().token);
  const cargandoSesion = false;

  useEffect(() => {
    if (!token) return undefined;
    const idUsuario = decodificarToken(token)?.id_usuario;
    if (!idUsuario) return undefined;

    let activo = true;
    obtenerPerfil()
      .then((data) => {
        if (!activo) return;
        const avatarURL = data.perfil?.perfil?.avatarURL || "";
        guardarAvatarCache(idUsuario, avatarURL);
        setUsuario((actual) => (actual ? { ...actual, avatarURL } : actual));
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [token]);

  function guardarSesion(data) {
    localStorage.setItem("token", data.token);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    const payload = decodificarToken(data.token);
    setToken(data.token);
    setUsuario(
      payload
        ? { ...payload, avatarURL: leerAvatarCache(payload.id_usuario) }
        : payload,
    );
  }

  function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rol");
    setToken(null);
    setUsuario(null);
  }

  function actualizarUsuario(datos) {
    if (datos.avatarURL !== undefined && usuario) {
      guardarAvatarCache(usuario.id_usuario, datos.avatarURL);
    }
    setUsuario((actual) => (actual ? { ...actual, ...datos } : actual));
  }

  const value = {
    usuario,
    token,
    estaAutenticado: !!token,
    cargandoSesion,
    guardarSesion,
    cerrarSesion,
    actualizarUsuario,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return context;
}