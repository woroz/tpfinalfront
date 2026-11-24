import { useState } from "react";
import '../styles/tablaReportes.css';
import { actualizarEstadoReporte } from "../services/api";

export const TablaReportesAdmin = ({
  reportes = [], setReportes,
  cargando = false,
  error = ""
}) => {
  const [actualizando, setActualizando] = useState("");
  const [errorAccion, setErrorAccion] = useState("");



  const cambiarEstado = async (idReporte, nuevoEstado) => {
    try {
      setActualizando(idReporte);
      setErrorAccion("");

      const data = await actualizarEstadoReporte(idReporte, nuevoEstado);

      setReportes((anteriores) =>
        anteriores.map((rep) =>
          rep.id_reporte === idReporte
            ? { ...rep, ...data.reporte }
            : rep
        )
      );
    } catch (err) {
      setErrorAccion(err.message || "No se pudo actualizar el reporte.");
    } finally {
      setActualizando("");
    }
  };

  if (cargando) {
    return (
      <div className="admin-status-container">
        <div className="admin-spinner"></div>
        <p>Cargando reportes...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="admin-status-container">
        <div className="admin-error-card">
          <p className="admin-error-text">
            Hubo un problema al cargar los reportes: {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-table-wrapper">
      <div className="admin-table-header-box">
        <span className="admin-badge-count">
          {reportes.length} reportes
        </span>
      </div>

      {errorAccion && (
        <p className="admin-error-text">{errorAccion}</p>
      )}

      {reportes.length === 0 ? (
        <div className="admin-empty-state">
          <p>No se registran reportes actualmente.</p>
        </div>
      ) : (
        <div className="admin-responsive-scroll">
          <table className="admin-main-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Alumno (Reportante)</th>
                <th>Profesor (Reportado)</th>
                <th>Motivo de Denuncia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {reportes.map((rep) => {
                const estado = rep.estado?.toLowerCase();

                return (
                  <tr key={rep.id_reporte}>
                    <td className="admin-td-date">
                      {new Date(rep.createdAt).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    <td>
                      <div className="admin-user-info">
                        <span className="admin-user-name">
                          {rep.reportante?.nombre}
                        </span>
                        <span className="admin-user-email">
                          {rep.reportante?.email}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-user-info">
                        <span className="admin-user-name">
                          {rep.reportado?.nombre}
                        </span>
                        <span className="admin-user-email">
                          {rep.reportado?.email}
                        </span>
                      </div>
                    </td>

                    <td className="admin-td-motivo">
                      <span className="admin-motivo-text">
                        {rep.motivo}
                      </span>
                    </td>

                    <td>
                      <span className={`admin-badge-status status-${estado}`}>
                        {estado === "pendiente"
                          ? "Pendiente"
                          : estado === "aceptado"
                            ? "Aceptada"
                            : estado === "rechazado"
                              ? "Rechazada"
                              : rep.estado}
                      </span>
                    </td>

                    <td>
                      {estado === "pendiente" ? (
                        <div className="admin-reporte-acciones">
                          <button
                            className="admin-btn-aceptar"
                            disabled={actualizando === rep.id_reporte}
                            onClick={() =>
                              cambiarEstado(rep.id_reporte, "aceptado")
                            }
                          >
                            {actualizando === rep.id_reporte
                              ? "Guardando..."
                              : "Aceptar"}
                          </button>

                          <button
                            className="admin-btn-rechazar"
                            disabled={actualizando === rep.id_reporte}
                            onClick={() =>
                              cambiarEstado(rep.id_reporte, "rechazado")
                            }
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <span>Resuelto</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
