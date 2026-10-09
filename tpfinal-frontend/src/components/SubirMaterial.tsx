import { useState } from 'react'

const MAX = 4 * 1024 * 1024

// Uso: <SubirMaterial apiUrl={import.meta.env.VITE_API_URL} idClase={clase.id_clase} />
// (si tu proyecto no es Vite, pasá la URL del back como apiUrl)
export default function SubirMaterial({ apiUrl, idClase }: { apiUrl: string; idClase: string }) {
  const [msg, setMsg] = useState('')

  async function subir(archivo: File | undefined) {
    if (!archivo) return
    if (archivo.type !== 'application/pdf') return setMsg('Solo se permite PDF')
    if (archivo.size > MAX) return setMsg('El PDF no puede superar los 4 MB')
    const fd = new FormData()
    fd.append('pdf', archivo)
    const r = await fetch(`${apiUrl}/clases/${idClase}/material`, { method: 'POST', body: fd, credentials: 'include' })
    setMsg(r.ok ? 'PDF subido' : 'No se pudo subir el PDF')
  }

  return (
    <div>
      <input type="file" accept="application/pdf" onChange={(e) => subir(e.target.files?.[0])} />
      {msg && <p>{msg}</p>}
    </div>
  )
}
