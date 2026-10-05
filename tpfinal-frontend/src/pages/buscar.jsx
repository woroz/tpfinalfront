import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { buscarProfesores,obtenerAreas, obtenerMaterias, obtenerPerfilProfesor } from "../services/api";
import professorImage from "../assets/profesor.png";
import ProfessorCard from "../components/ProfessorCard";
import Navbar from "../components/Navbar";
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

function ProfessorMapCard({ professor, onClose }) {
  const map = useMap();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const updatePosition = () => {
      const latitude = Number(professor.latitud_prof);
      const longitude = Number(professor.longitud_prof);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const point = map.latLngToContainerPoint([latitude, longitude]);
      setPosition({ left: point.x, top: point.y });
    };

    updatePosition();
    map.on("move zoom", updatePosition);
    return () => map.off("move zoom", updatePosition);
  }, [map, professor.latitud_prof, professor.longitud_prof]);

  if (!position) return null;

  return (
    <div
      className="map-professor-card"
      style={{ left: position.left, top: position.top }}
    >
      <ProfessorCard professor={professor} onClose={onClose} />
    </div>
  );
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
  const [materias, setMaterias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [openFilter, setOpenFilter] = useState(null);
  const [error, setError] = useState("");

  async function loadProfessors(mapCenter, filters = {}) {
    setSearchingProfessors(true);
    try {
      const response = await buscarProfesores(mapCenter[0], mapCenter[1], 100, filters);
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

  useEffect(() => {
    let active = true;

    Promise.all([obtenerMaterias(), obtenerAreas()])
      .then(([materiasResponse, areasResponse]) => {
        if (!active) return;
        setMaterias(materiasResponse.materias || []);
        setAreas(areasResponse.areas || []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleMapMove(mapCenter) {
    setLocation(mapCenter);
    await loadProfessors(mapCenter, {
      idMateria: selectedMateria,
      idArea: selectedArea,
    });
  }

  async function handleFilterChange(nextFilters) {
    setSelectedMateria(nextFilters.idMateria);
    setSelectedArea(nextFilters.idArea);
    setOpenFilter(null);
    await loadProfessors(location, nextFilters);
  }

  const selectedMateriaName = materias.find(
    (materia) => String(materia.id_materia) === String(selectedMateria),
  )?.nombreMateria || "Materias";
  const selectedAreaName = areas.find(
    (area) => String(area.id_area) === String(selectedArea),
  )?.nombreArea || "Areas";

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
      <Navbar />

      <section className="map-shell" aria-label="Mapa interactivo">
        <div className="map-filters" aria-label="Filtros de búsqueda">
          <div className="map-filter">
            <button
              type="button"
              className="map-filter-button"
              aria-expanded={openFilter === "materia"}
              onClick={() => setOpenFilter(openFilter === "materia" ? null : "materia")}
            >
              {selectedMateriaName}
            </button>
            {openFilter === "materia" && (
              <div className="map-filter-menu" role="menu">
                <button
                  type="button"
                  className={!selectedMateria ? "active" : ""}
                  onClick={() => handleFilterChange({
                    idMateria: "",
                    idArea: selectedArea,
                  })}
                >
                  Todas las materias
                </button>
              {materias.map((materia) => (
                <button
                  type="button"
                  key={materia.id_materia}
                  className={String(selectedMateria) === String(materia.id_materia) ? "active" : ""}
                  onClick={() => handleFilterChange({
                    idMateria: String(materia.id_materia),
                    idArea: selectedArea,
                  })}
                >
                  {materia.nombreMateria}
                </button>
              ))}
              </div>
            )}
          </div>
          <div className="map-filter">
            <button
              type="button"
              className="map-filter-button"
              aria-expanded={openFilter === "area"}
              onClick={() => setOpenFilter(openFilter === "area" ? null : "area")}
            >
              {selectedAreaName}
            </button>
            {openFilter === "area" && (
              <div className="map-filter-menu" role="menu">
                <button
                  type="button"
                  className={!selectedArea ? "active" : ""}
                  onClick={() => handleFilterChange({
                    idMateria: selectedMateria,
                    idArea: "",
                  })}
                >
                  Todas las areas
                </button>
              {areas.map((area) => (
                <button
                  type="button"
                  key={area.id_area}
                  className={String(selectedArea) === String(area.id_area) ? "active" : ""}
                  onClick={() => handleFilterChange({
                    idMateria: selectedMateria,
                    idArea: String(area.id_area),
                  })}
                >
                  {area.nombreArea}
                </button>
              ))}
              </div>
            )}
          </div>
        </div>
        {locationSource === "loading" && (
          <div className="map-loading map-loading-location">Buscando tu ubicacion</div>
        )}
        {locationSource === "default" && (
          <div className="map-notice">
            No pudimos obtener tu ubicacion. Podes mover el mapa manualmente.
          </div>
        )}
        {searchingProfessors && (
          <div className="map-loading map-loading-search">Buscando profesores en esta zona.</div>
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
          {selectedProfessor && (
            <ProfessorMapCard
              professor={selectedProfessor}
              onClose={() => setSelectedProfessor(null)}
            />
          )}
        </MapContainer>
        <div className="map-info-overlay">
          <p className="map-results">
            {profesores.length
              ? `${profesores.length} profesores encontrados en el area visible.`
              : "No hay profesores ubicados en esta zona."}
          </p>
          <p className="map-help">
            Arrastra el mapa para explorar otras zonas. Hace clic en un marcador para ver el perfil.
          </p>
        </div>
      </section>

      {error && <p className="map-error" role="alert">{error}</p>}
    </main>
  );
}
