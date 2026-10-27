import Navbar from "../components/Navbar";
import MisSolicitudes from "../components/tablon/MisSolicitudes";
import TablonProfesor from "../components/tablon/TablonProfesor";
import { useAuth } from "../context/authContext";
import "../styles/tablon.css";

export default function Tablon() {
  const { usuario } = useAuth();
  const esProfesor = usuario?.rol === "profesor";

  return (
    <main className="app-page">
      <Navbar />
      <section className="res-contenedor">
        <header className="res-encabezado">
          <h1>Tablon de anuncios</h1>
          <p>
            {esProfesor
              ? "Solicitudes de alumnos que buscan una clase"
              : "Tus solicitudes de clase y las ofertas que recibiste."}
          </p>
        </header>
        {esProfesor ? <TablonProfesor /> : <MisSolicitudes />}
      </section>
    </main>
  );
}