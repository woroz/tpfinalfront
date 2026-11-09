import { useEffect, useState } from 'react';
import '../styles/tablaReportes.css';
import { cambiarEstadoBloqueoProfesor } from "../services/api";

export const TablaReportesAdmin = ({ reportes: reportesIniciales = [] }) => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('api/admin/reportes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al obtener los reportes.');
        }

        setReportes(data.reportes || []);
      } catch (err) {
        setError(err.message || 'Error de conexión.');
      } finally {
        setLoading(false);
      }
    };

    cargarReportes();
  }, []);

  if (loading) {
    return (
      <div className="admin-status-container">
        <div className="admin-spinner"></div>
        <p>Cargando reportes en tiempo real...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-status-container">
        <div className="admin-error-card">
          <p className="admin-error-text">Hubo un problema al cargar la sección: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-table-wrapper">
      <div className="admin-table-header-box">
        <span className="admin-badge-count">{reportes.length} activos</span>
      </div>

      {reportes.length === 0 ? (
        <div className="admin-empty-state">
          <p>No se registran reportes ni reclamos en la plataforma actualmente.</p>
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
              </tr>
            </thead>
            <tbody>
              {reportes.map((rep) => (
                <tr key={rep.id_reporte}>
                  <td className="admin-td-date">
                    {new Date(rep.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    <div className="admin-user-info">
                      <span className="admin-user-name">{rep.reportante?.nombre}</span>
                      <span className="admin-user-email">{rep.reportante?.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-user-info">
                      <span className="admin-user-name">{rep.reportado?.nombre}</span>
                      <span className="admin-user-email">{rep.reportado?.email}</span>
                    </div>
                  </td>
                  <td className="admin-td-motivo">
                    <span className="admin-motivo-text">{rep.motivo}</span>
                  </td>
                  <td>
                    <span className={`admin-badge-status status-${rep.estado?.toLowerCase()}`}>
                      {rep.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};