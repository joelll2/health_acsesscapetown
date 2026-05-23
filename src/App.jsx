import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, LayersControl, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Constants ────────────────────────────────────────────
const DEFAULT_CENTER = [-33.9249, 18.4241]
const DEFAULT_ZOOM = 10

const LAYER_CONFIG = [
  {
    key: 'batas_cape_town',
    file: 'batas_cape_town.geojson',
    label: 'Batas City of Cape Town',
    type: 'polygon',
    style: { color: '#222222', weight: 2.5, fillOpacity: 0, opacity: 0.9, dashArray: '6,4' },
    defaultPopup: 'Batas City of Cape Town',
    zIndex: 100,
  },
  {
    key: 'area_pemukiman',
    file: 'area_pemukiman.geojson',
    label: 'Area Permukiman',
    type: 'polygon',
    style: { fillColor: '#F7C6C7', fillOpacity: 0.35, color: '#E8A0A0', weight: 0.8, opacity: 0.6 },
    defaultPopup: 'Area Permukiman',
    zIndex: 200,
  },
  {
    key: 'jalan_utama',
    file: 'jalan_utama.geojson',
    label: 'Jalan Utama',
    type: 'line',
    style: { color: '#8A8A8A', weight: 1.2, opacity: 0.6 },
    defaultPopup: 'Jalan Utama',
    zIndex: 300,
  },
  {
    key: 'pemukiman_akses_dekat',
    file: 'pemukiman_akses_dekat.geojson',
    label: 'Akses Dekat (≤ 1 km)',
    type: 'polygon',
    style: { fillColor: '#6CC24A', fillOpacity: 0.35, color: '#6CC24A', weight: 0.5, opacity: 0.3 },
    defaultPopup: 'Permukiman Akses Dekat — Jarak ≤ 1 km dari fasilitas kesehatan',
    zIndex: 400,
  },
  {
    key: 'pemukiman_akses_sedang',
    file: 'pemukiman_akses_sedang.geojson',
    label: 'Akses Sedang (1–3 km)',
    type: 'polygon',
    style: { fillColor: '#F2C94C', fillOpacity: 0.25, color: '#F2C94C', weight: 0.5, opacity: 0.3 },
    defaultPopup: 'Permukiman Akses Sedang — Jarak 1–3 km dari fasilitas kesehatan',
    zIndex: 500,
  },
  {
    key: 'pemukiman_akses_rendah',
    file: 'pemukiman_akses_rendah.geojson',
    label: 'Akses Rendah (> 3 km)',
    type: 'polygon',
    style: { fillColor: '#E85D5D', fillOpacity: 0.6, color: '#9E2F2F', weight: 1.2, opacity: 0.8 },
    defaultPopup: 'Permukiman Akses Rendah — Area berada di luar buffer 3 km dari fasilitas kesehatan',
    zIndex: 600,
  },
  {
    key: 'klinik_farmasi',
    file: 'klinik_farmasi.geojson',
    label: 'Klinik dan Farmasi',
    type: 'point',
    markerColor: '#0077B6',
    markerRadius: 6,
    defaultPopup: 'Klinik / Farmasi',
    zIndex: 700,
  },
  {
    key: 'rumah_sakit',
    file: 'rumah_sakit.geojson',
    label: 'Rumah Sakit',
    type: 'point',
    markerColor: '#D62828',
    markerRadius: 8,
    defaultPopup: 'Rumah Sakit',
    zIndex: 800,
  },
]

// ─── Helper: Build popup content ─────────────────────────
function buildPopupContent(properties, layerConfig) {
  const name = properties?.NAME || properties?.name || properties?.Name || null
  const address = properties?.ADR || properties?.address || properties?.Address || properties?.ADR || null
  const type = properties?.TYPE || properties?.type || null
  
  let title = name || layerConfig.defaultPopup
  let badgeClass = ''
  let badgeText = ''
  
  if (layerConfig.key === 'rumah_sakit') {
    badgeClass = 'popup-badge popup-badge-hospital'
    badgeText = '🏥 Rumah Sakit'
  } else if (layerConfig.key === 'klinik_farmasi') {
    badgeClass = 'popup-badge popup-badge-clinic'
    badgeText = '🏪 Klinik / Farmasi'
  }

  let html = `<div class="popup-title">${title}</div>`

  if (address) {
    html += `<div class="popup-field"><span class="popup-label">Alamat:</span><span class="popup-value">${address}</span></div>`
  }

  if (layerConfig.key === 'pemukiman_akses_rendah') {
    html += `<div class="popup-field"><span class="popup-value" style="color:#ff6b6b;">⚠ Area berada di luar buffer 3 km dari fasilitas kesehatan</span></div>`
  } else if (layerConfig.key === 'pemukiman_akses_dekat') {
    html += `<div class="popup-field"><span class="popup-value" style="color:#6CC24A;">✓ Jarak ≤ 1 km dari fasilitas kesehatan</span></div>`
  } else if (layerConfig.key === 'pemukiman_akses_sedang') {
    html += `<div class="popup-field"><span class="popup-value" style="color:#F2C94C;">● Jarak 1–3 km dari fasilitas kesehatan</span></div>`
  } else if (layerConfig.key === 'area_pemukiman') {
    html += `<div class="popup-field"><span class="popup-value">Area Permukiman</span></div>`
  } else if (layerConfig.key === 'batas_cape_town') {
    html += `<div class="popup-field"><span class="popup-value">Batas administratif City of Cape Town</span></div>`
  } else if (layerConfig.key === 'jalan_utama') {
    if (!name) html += `<div class="popup-field"><span class="popup-value">Jalan Utama</span></div>`
  }

  // Show other properties for points
  if (layerConfig.type === 'point' && properties) {
    const skip = ['fid', 'OBJECTID', 'NAME', 'name', 'Name', 'ADR', 'address', 'Address']
    Object.entries(properties).forEach(([key, value]) => {
      if (!skip.includes(key) && value !== null && value !== undefined && value !== '') {
        html += `<div class="popup-field"><span class="popup-label">${key}:</span><span class="popup-value">${value}</span></div>`
      }
    })
  }

  if (badgeText) {
    html += `<div class="${badgeClass}">${badgeText}</div>`
  }

  html += `<div style="margin-top:6px;font-size:9px;color:#6b7280;">Sumber: HOTOSM / City of Cape Town</div>`
  
  return html
}

// ─── Fetch GeoJSON safely ─────────────────────────────────
async function fetchGeoJSON(filename) {
  try {
    const res = await fetch(`/data/${filename}`)
    if (!res.ok) {
      console.warn(`⚠ Layer "${filename}" belum tersedia (HTTP ${res.status}). Layer dilewati.`)
      return null
    }
    const data = await res.json()
    return data
  } catch (err) {
    console.warn(`⚠ Layer "${filename}" belum tersedia atau format tidak valid. Layer dilewati.`, err.message)
    return null
  }
}

// ─── Reset View Button Component ──────────────────────────
function ResetViewButton() {
  const map = useMap()
  return null // We handle this externally
}

// ─── Main Map Controller ──────────────────────────────────
function MapController({ triggerReset }) {
  const map = useMap()
  
  useEffect(() => {
    if (triggerReset > 0) {
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.2 })
    }
  }, [triggerReset, map])
  
  return null
}

// ─── GeoJSON Layer Component ──────────────────────────────
function GeoLayer({ data, config }) {
  const pointToLayer = useCallback((feature, latlng) => {
    return L.circleMarker(latlng, {
      radius: config.markerRadius || 6,
      fillColor: config.markerColor || '#fff',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
    })
  }, [config])

  const style = useCallback(() => config.style || {}, [config])

  const onEachFeature = useCallback((feature, layer) => {
    const html = buildPopupContent(feature.properties, config)
    layer.bindPopup(html, { maxWidth: 280, className: '' })
    
    // Hover effects for polygons and lines
    if (config.type !== 'point') {
      layer.on({
        mouseover: (e) => {
          const l = e.target
          l.setStyle({ weight: (config.style?.weight || 1) + 1.5, opacity: 1, fillOpacity: (config.style?.fillOpacity || 0.3) + 0.15 })
        },
        mouseout: (e) => {
          const l = e.target
          l.setStyle(config.style)
        },
      })
    }
  }, [config])

  if (!data) return null

  if (config.type === 'point') {
    return (
      <GeoJSON 
        data={data} 
        pointToLayer={pointToLayer} 
        onEachFeature={onEachFeature}
      />
    )
  }

  return (
    <GeoJSON 
      data={data} 
      style={style} 
      onEachFeature={onEachFeature}
    />
  )
}

// ─── Legend Component ─────────────────────────────────────
function Legend() {
  const [collapsed, setCollapsed] = useState(false)

  const items = [
    { label: 'Rumah Sakit', color: '#D62828', type: 'circle' },
    { label: 'Klinik dan Farmasi', color: '#0077B6', type: 'circle' },
    { divider: true },
    { label: 'Akses Dekat (≤ 1 km)', color: '#6CC24A', type: 'square' },
    { label: 'Akses Sedang (1–3 km)', color: '#F2C94C', type: 'square' },
    { label: 'Akses Rendah (> 3 km)', color: '#E85D5D', type: 'square' },
    { divider: true },
    { label: 'Area Permukiman', color: '#F7C6C7', type: 'square' },
    { label: 'Jalan Utama', color: '#8A8A8A', type: 'line' },
    { label: 'Batas Cape Town', color: '#555555', type: 'outline' },
  ]

  return (
    <div className={`legend-container ${collapsed ? 'collapsed' : ''}`} onClick={collapsed ? () => setCollapsed(false) : undefined}>
      <div className="legend-toggle" title="Buka Legenda">🗺️</div>
      <div className="legend-inner">
        <div className="legend-header">
          <span className="legend-title">📋 Legenda</span>
          <button className="legend-close" onClick={() => setCollapsed(true)} title="Tutup Legenda">✕</button>
        </div>
        {items.map((item, i) => {
          if (item.divider) return <div key={`d-${i}`} className="legend-divider" />
          let iconClass = 'legend-icon'
          let iconStyle = {}

          if (item.type === 'circle') {
            iconClass += ' circle'
            iconStyle = { background: item.color, border: `2px solid rgba(255,255,255,0.3)` }
          } else if (item.type === 'square') {
            iconStyle = { background: item.color, opacity: 0.8 }
          } else if (item.type === 'line') {
            iconClass += ' line'
            iconStyle = { background: item.color }
          } else if (item.type === 'outline') {
            iconClass += ' outline'
            iconStyle = { borderColor: item.color }
          }

          return (
            <div key={i} className="legend-item">
              <div className={iconClass} style={iconStyle} />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Info Panel Component ─────────────────────────────────
function InfoPanel({ visible, onClose }) {
  if (!visible) return null

  return (
    <div className="info-panel">
      <div className="info-panel-header">
        <span className="info-panel-title">ℹ️ Tentang Peta</span>
        <button className="info-panel-close" onClick={onClose} title="Tutup">✕</button>
      </div>
      <p>
        Peta ini menampilkan akses permukiman terhadap fasilitas kesehatan di City of Cape Town. 
        <span className="highlight-green"> Zona hijau</span> menunjukkan akses dekat (≤ 1 km), 
        <span className="highlight-yellow"> zona kuning</span> menunjukkan akses sedang (1–3 km), dan 
        <span className="highlight-red"> area merah</span> menunjukkan permukiman dengan akses rendah 
        karena berada lebih dari 3 km dari fasilitas kesehatan.
      </p>
    </div>
  )
}

// ─── Stats Bar Component ──────────────────────────────────
function StatsBar({ layerData }) {
  const hospitalCount = layerData.rumah_sakit?.features?.length || 0
  const clinicCount = layerData.klinik_farmasi?.features?.length || 0

  if (!hospitalCount && !clinicCount) return null

  return (
    <div className="stats-bar">
      {hospitalCount > 0 && (
        <div className="stat-chip">
          <span className="stat-dot" style={{ background: '#D62828' }} />
          <span className="stat-count">{hospitalCount}</span>
          <span>Rumah Sakit</span>
        </div>
      )}
      {clinicCount > 0 && (
        <div className="stat-chip">
          <span className="stat-dot" style={{ background: '#0077B6' }} />
          <span className="stat-count">{clinicCount}</span>
          <span>Klinik</span>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const [layerData, setLayerData] = useState({})
  const [loading, setLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(true)
  const [resetCount, setResetCount] = useState(0)

  // Fetch all GeoJSON data on mount
  useEffect(() => {
    async function loadAll() {
      const results = {}
      const promises = LAYER_CONFIG.map(async (cfg) => {
        const data = await fetchGeoJSON(cfg.file)
        if (data) results[cfg.key] = data
      })
      await Promise.all(promises)
      setLayerData(results)
      setLoading(false)
    }
    loadAll()
  }, [])

  const handleResetView = () => {
    setResetCount(c => c + 1)
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header" id="app-header">
        <div className="header-left">
          <div className="header-icon">🗺️</div>
          <div className="header-text">
            <h1>Web GIS Akses Permukiman terhadap Fasilitas Kesehatan di City of Cape Town</h1>
            <p>Analisis buffer 1 km dan 3 km terhadap fasilitas kesehatan</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleResetView} id="btn-reset-view" title="Reset ke tampilan awal">
            <span className="btn-icon">🎯</span>
            <span className="btn-label">Reset View</span>
          </button>
          <button className="btn" onClick={() => setShowInfo(v => !v)} id="btn-toggle-info" title="Toggle Info Panel">
            <span className="btn-icon">ℹ️</span>
            <span className="btn-label">{showInfo ? 'Sembunyikan' : 'Info'}</span>
          </button>
        </div>
      </header>

      {/* Map */}
      <div className="map-wrapper">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <div className="loading-text">Memuat data peta...</div>
          </div>
        )}

        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="map-container"
          zoomControl={false}
          attributionControl={true}
          id="main-map"
        >
          {/* Zoom control repositioned */}
          <ZoomControl position="topleft" />

          {/* Map controller for reset */}
          <MapController triggerReset={resetCount} />

          {/* Basemap */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="CartoDB Positron">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="CartoDB Dark Matter">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>

            {/* Overlay Layers */}
            {LAYER_CONFIG.map((cfg) => (
              <LayersControl.Overlay
                key={cfg.key}
                checked
                name={cfg.label}
              >
                <GeoLayer data={layerData[cfg.key] || null} config={cfg} />
              </LayersControl.Overlay>
            ))}
          </LayersControl>
        </MapContainer>

        {/* Stats */}
        <StatsBar layerData={layerData} />

        {/* Info Panel */}
        <InfoPanel visible={showInfo} onClose={() => setShowInfo(false)} />

        {/* Legend */}
        <Legend />
      </div>
    </div>
  )
}
