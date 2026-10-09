import { useMemo, useState } from 'react'
import { Country, State } from 'country-state-city'

// Uso: <CampoUbicacion onChange={({ pais, provincia, ciudad }) => setForm({ ...form, pais, provincia, ciudad })} />
export default function CampoUbicacion({ onChange }) {
  const [paisIso, setPaisIso] = useState('')
  const [provincia, setProvincia] = useState('')
  const [ciudad, setCiudad] = useState('')

  const paises = useMemo(() => Country.getAllCountries(), [])
  const provincias = useMemo(() => (paisIso ? State.getStatesOfCountry(paisIso) : []), [paisIso])

  const emitir = (iso, prov, c) =>
    onChange({ pais: paises.find((p) => p.isoCode === iso)?.name ?? '', provincia: prov, ciudad: c })

  return (
    <>
      <select
        value={paisIso}
        required
        onChange={(e) => {
          setPaisIso(e.target.value)
          setProvincia('')
          emitir(e.target.value, '', ciudad)
        }}
      >
        <option value="">País</option>
        {paises.map((p) => (
          <option key={p.isoCode} value={p.isoCode}>{p.name}</option>
        ))}
      </select>

      <select
        value={provincia}
        required
        disabled={!paisIso}
        onChange={(e) => {
          setProvincia(e.target.value)
          emitir(paisIso, e.target.value, ciudad)
        }}
      >
        <option value="">Provincia / Estado</option>
        {provincias.map((s) => (
          <option key={s.isoCode} value={s.name}>{s.name}</option>
        ))}
      </select>

      <input
        value={ciudad}
        required
        placeholder="Ciudad"
        maxLength={80}
        onChange={(e) => {
          setCiudad(e.target.value)
          emitir(paisIso, provincia, e.target.value)
        }}
      />
    </>
  )
}
