import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { buscarProfesores, obtenerPerfilProfesor } from "../services/api";
import professorImage from "../assets/profesor.png";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [-34.6037, -58.3816];
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const MAP_TILES = MAPTILER_KEY
  ? {
      url: `https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
      attribution: '&copy; MapTiler &copy; OpenStreetMap contributors',
    }
  : {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    };

const professorIcon = L.divIcon({
  className: "professor-marker-wrapper",
  html: `<span class="professor-marker"><img src="${professorImage}" alt="" /></span>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

function getProfessorSubjects(professor) {
  const materias = professor.materias?.length
    ? professor.materias
    : (professor.clases || []);

  return materias
    .map((item) => (
      item.materia?.nombreMateria
      || item.nombreMateria
      || item.materia?.nombre
      || item.materia?.nombre_materia
      || item.nombre
      || item.nombre_materia
    ))
    .filter(Boolean)
    .filter((subject, index, subjects) => subjects.indexOf(subject) === index)
    .join(", ");
}

function getProfessorPrice(professor) {
  return professor.tarifa ?? professor.tarifa_hora;
}

function calculateDistanceInKm([fromLatitude, fromLongitude], professor) {
  const latitude = Number(professor.latitud_prof);
  const longitude = Number(professor.longitud_prof);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const earthRadius = 6371;
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDelta = toRadians(latitude - fromLatitude);
  const longitudeDelta = toRadians(longitude - fromLongitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(fromLatitude))
    * Math.cos(toRadians(latitude))
    * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function getProfessorName(professor) {
  return professor.usuario?.nombre || professor.nombre || professor.usuario?.email || "Profesor";
}

function CenterOnLocation({ location }) {
  const map = useMap();
  const centered = useRef(false);

  useEffect(() => {
    if (location && !centered.current) {
      map.flyTo(location, 13, { duration: 1.2 });
      centered.current = true;
    }
  }, [location, map]);

  return null;
}

function MapMovement({ onMove }) {
  const map = useMapEvents({
    moveend() {
      const mapCenter = map.getCenter();
      onMove([mapCenter.lat, mapCenter.lng]);
    },
  });
  return null;
}

function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ location: DEFAULT_CENTER, source: "default" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        location: [coords.latitude, coords.longitude],
        source: "browser",
      }),
      () => resolve({ location: DEFAULT_CENTER, source: "default" }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}

export default function Buscar() {
  const [location, setLocation] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [locationSource, setLocationSource] = useState("loading");
  const [profesores, setProfesores] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [searchingProfessors, setSearchingProfessors] = useState(false);
  const [error, setError] = useState("");

  async function loadProfessors(mapCenter) {
    setSearchingProfessors(true);
    try {
      const response = await buscarProfesores(mapCenter[0], mapCenter[1], 100);
      setProfesores(response.profesores || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSearchingProfessors(false);
    }
  }

  useEffect(() => {
    let active = true;

    getBrowserLocation().then(async (result) => {
      if (!active) return;
      setLocation(result.location);
      setUserLocation(result.location);
      setLocationSource(result.source);
      await loadProfessors(result.location);
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleMapMove(mapCenter) {
    setLocation(mapCenter);
    await loadProfessors(mapCenter);
  }

  async function handleProfessorClick(professor) {
    try {
      const response = await obtenerPerfilProfesor(professor.id_profesor);
      const profile = response.perfil || {};
      setSelectedProfessor({
        ...professor,
        ...profile,
        distancia: calculateDistanceInKm(userLocation, professor) ?? professor.distancia ?? profile.distancia,
        tarifa: profile.tarifa ?? professor.tarifa,
        materias: [
          ...(professor.materias || []),
          ...(profile.materias || []),
        ],
      });
    } catch {
      setSelectedProfessor({
        ...professor,
        distancia: calculateDistanceInKm(userLocation, professor) ?? professor.distancia,
      });
    }
  }

  return (
    <main className="map-page">
      <header className="map-header">
        <div>
          <span className="map-eyebrow">MentorAr</span>
          <h1>Profesores cerca tuyo</h1>
        </div>
        <div className="map-brand">Mentor<span>Ar</span></div>
      </header>

      <section className="map-shell" aria-label="Mapa interactivo">
        {locationSource === "loading" && (
          <div className="map-loading">Buscando tu ubicacion</div>
        )}
        {locationSource === "default" && (
          <div className="map-notice">
            No pudimos obtener tu ubicacioon. Podes mover el mapa manualmente.
          </div>
        )}
        {searchingProfessors && (
          <div className="map-loading">Buscando profesores en esta zona</div>
        )}
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={12}
          minZoom={3}
          maxZoom={19}
          scrollWheelZoom
          dragging
          zoomControl
          className="professors-map"
        >
          <CenterOnLocation location={locationSource === "loading" ? null : location} />
          <MapMovement onMove={handleMapMove} />
          <TileLayer
            attribution={MAP_TILES.attribution}
            url={MAP_TILES.url}
          />
          {profesores.map((profesor) => (
            <Marker
              key={profesor.id_profesor}
              position={[Number(profesor.latitud_prof), Number(profesor.longitud_prof)]}
              icon={professorIcon}
              eventHandlers={{ click: () => handleProfessorClick(profesor) }}
            />
          ))}
        </MapContainer>
      </section>

      {error && <p className="map-error" role="alert">{error}</p>}
      <p className="map-results">
        {profesores.length
          ? `${profesores.length} profesores encontrados en el área visible`
          : "No hay profesores ubicados en esta zona."}
      </p>

      {selectedProfessor && (
        <div className="profile-modal-backdrop" role="presentation" onClick={() => setSelectedProfessor(null)}>
          <article className="profile-modal professor-profile-preview" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setSelectedProfessor(null)} aria-label="Cerrar">
              ×
            </button>
            <div className="profile-preview-top">
              <div className="modal-avatar">
                <img src={professorImage} alt="" />
              </div>
              <div>
                <h2>{getProfessorName(selectedProfessor)}</h2>
              </div>
            </div>
            <div className="profile-preview-details">
              <div>
                <strong>Materias: {getProfessorSubjects(selectedProfessor) || "No informadas"}</strong>
              </div>
              <div>
                <strong>
                  Precio: {getProfessorPrice(selectedProfessor) != null
                    ? `$${getProfessorPrice(selectedProfessor)} / hora`
                    : "No informado"}
                </strong>
              </div>
              <div>
                <strong>
                  Distancia: {selectedProfessor.distancia != null
                    ? `${Number(selectedProfessor.distancia).toFixed(1)} km desde tu ubicación`
                    : "No disponible"}
                </strong>
              </div>
            </div>
            <p>{selectedProfessor.descripcion || selectedProfessor.usuario?.perfil?.biografia || "Este profesor todavia no agregó una descripcion."}</p>
          </article>
        </div>
      )}

      <p className="map-help">
        Arrastra el mapa para explorar otras zonas. Hace clic en un marcador para ver el perfil.
      </p>
    </main>
  );
}
