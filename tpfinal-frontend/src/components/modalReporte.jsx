import { useState } from 'react';
import '../styles/reportes.css';

const MOTIVOS_REPORTE = [
  "Inasistencia a la clase reservada",
  "Comportamiento inadecuado o irrespetuoso",
  "Información falsa o engañosa en el perfil",
  "Spam o intento de estafa comercial",
  "Otro motivo"
];

export const ModalReportar = ({
  idProfesor,
  nombreProfesor,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [motivo, setMotivo] = useState('');
  const [otroDetalle, setOtroDetalle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const motivoFinal = motivo === "Otro motivo" ? otroDetalle.trim() : motivo;
    if (!motivoFinal) return;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token'); 
      console.log("ID recibido en ModalReportar:", idProfesor);
      const response = await fetch('/api/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_usuario_reportado: idProfesor,
          motivo: motivoFinal
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Hubo un error al procesar el reporte.');
      }

      if (onSuccess) onSuccess();
      setMotivo('');
      setOtroDetalle('');
      onClose();
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };
  const botonDeshabilitado = !motivo || loading || (motivo === "Otro motivo" && !otroDetalle.trim());

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        
        <div className="modal-header">
          <h3 className="modal-title">Reportar perfil</h3>
          <button onClick={onClose} className="modal-close-btn">
            <svg className="modal-close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="modal-description">
          Estás reportando al profesor <span className="modal-highlight">{nombreProfesor}</span>. Tu reporte será revisado por el equipo de administración de forma confidencial.
        </p>

        <form onSubmit={handleSubmit} className="modal-form">
          <div>
            <label className="modal-label">
              Motivo del reporte <span className="modal-required">*</span>
            </label>
            <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={loading}
            className="modal-select">
              <option value="" disabled>Seleccioná una opción obligatoria</option>
              {MOTIVOS_REPORTE.map((item, index) => (
                <option key={index} value={item}>{item}</option>
                ))}
                </select>
          </div>

          {motivo === "Otro motivo" && (
            <div className="modal-textarea-container">
              <label className="modal-label">
                Especificá el motivo <span className="modal-required">*</span>
              </label>
              <textarea
                value={otroDetalle}
                onChange={(e) => setOtroDetalle(e.target.value)}
                placeholder="Por favor, describí brevemente lo sucedido..."
                disabled={loading}
                className="modal-textarea"
                rows={3}
                maxLength={250}
              />
            </div>
          )}

          {error && (
            <div className="modal-error-box">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-modal-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={botonDeshabilitado}
              className="btn-modal-submit"
            >
              {loading ? (
                <>
                  <svg className="modal-spinner" fill="none" viewBox="0 0 24 24">
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar reporte'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};