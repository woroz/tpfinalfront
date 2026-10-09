/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

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

  return { token: tokenGuardado, usuario: payload };
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerSesionInicial().usuario);
  const [token, setToken] = useState(() => obtenerSesionInicial().token);
  const cargandoSesion = false;

  function guardarSesion(data) {
    localStorage.setItem("token", data.token);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    const payload = decodificarToken(data.token);
    setToken(data.token);
    setUsuario(payload);
  }

  function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUsuario(null);
  }

  function actualizarUsuario(datos) {
    setUsuario((actual) => actual ? { ...actual, ...datos } : actual);
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