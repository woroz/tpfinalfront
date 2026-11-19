import { BookOpen, CalendarDays, ClipboardList, CreditCard, GraduationCap, Library, Search, UserRound, MessageSquareWarning, ShieldCheck, Clock, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";
import "../styles/inicio.css";

const seccionesAlumno = [
  { titulo: "Explorar", descripcion: "Buscá profesores y clases", ruta: "/buscar", icono: Search },
  { titulo: "Mis clases", descripcion: "Consultá tu agenda y reservas", ruta: "/mis-clases", icono: CalendarDays },
  { titulo: "Biblioteca", descripcion: "Accedé al material de tus clases", ruta: "/biblioteca", icono: Library },
  { titulo: "Tablón", descripcion: "Publicá y seguí tus solicitudes", ruta: "/tablon", icono: ClipboardList },
  { titulo: "Mis pagos", descripcion: "Revisá tus operaciones", ruta: "/mis-pagos", icono: CreditCard },
  { titulo: "Mis reclamos", descripcion: "Seguí tus reclamos de clase", ruta: "/mis-reclamos", icono: MessageSquareWarning },
  { titulo: "Perfil", descripcion: "Administrá tu cuenta", ruta: "/perfil", icono: UserRound },
];

const seccionesProfesor = [
  { titulo: "Mis clases", descripcion: "Consultá tus clases programadas", ruta: "/profesor", icono: CalendarDays },
  { titulo: "Crear clase", descripcion: "Programá una nueva clase", ruta: "/profesor/crear-clase", icono: PlusCircle },
  { titulo: "Biblioteca", descripcion: "Compartí y administrá materiales", ruta: "/biblioteca", icono: Library },
  { titulo: "Tablón", descripcion: "Respondé solicitudes de alumnos", ruta: "/tablon", icono: ClipboardList },
  { titulo: "Disponibilidad", descripcion: "Organizá tus horarios", ruta: "/profesor/disponibilidad", icono: Clock },
  { titulo: "Mis materias", descripcion: "Administrá las materias que enseñás", ruta: "/profesor/materias", icono: BookOpen },
  { titulo: "Perfil", descripcion: "Administrá tu cuenta", ruta: "/perfil", icono: UserRound },
];

export default function Inicio() {
  const { usuario } = useAuth();
  const secciones = usuario?.rol === "profesor"
    ? seccionesProfesor
    : usuario?.rol === "admin"
      ? [{ titulo: "Administración", descripcion: "Gestioná la plataforma", ruta: "/admin", icono: ShieldCheck }]
      : seccionesAlumno;

  return (
    <main className="app-page">
      <Navbar />
      <section className="inicio">
        <div className="inicio-cabecera">
          <div className="inicio-distintivo"><GraduationCap size={20} aria-hidden="true" /> Tu espacio en MentorAr</div>
          <h1>{usuario?.nombre ? `Hola, ${usuario.nombre}` : "Inicio"}</h1>
          <p>Elegí una sección para comenzar.</p>
        </div>
        <div className="inicio-secciones">
          {secciones.map(({ titulo, descripcion, ruta, icono: Icono }) => (
            <Link className="inicio-seccion" key={ruta} to={ruta}>
              <span className="inicio-icono"><Icono size={23} aria-hidden="true" /></span>
              <span className="inicio-titulo">{titulo}</span>
              <span className="inicio-descripcion">{descripcion}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
