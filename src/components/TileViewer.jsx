import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { renderTileOnCanvas } from '../utils/neoGeoDecoder';

function TileCanvas({ tileIndex, dataReady, activePalette, tileSize, onClick }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false); // Estado para el texto "Copiado"

  useEffect(() => {
    if (canvasRef.current && dataReady) {
      renderTileOnCanvas(canvasRef.current, tileIndex, null, activePalette);
    }
  }, [tileIndex, dataReady, activePalette]);

  const handleTileClick = (e) => {
    if (e.ctrlKey) {
      // Si presiona Ctrl, copia el número al portapapeles
      navigator.clipboard.writeText(tileIndex.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1000); // El mensaje dura 1 segundo
    } else {
      // Si no presiona Ctrl, abre el Modal de Diagnóstico
      onClick(tileIndex);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <canvas 
        ref={canvasRef}
        width={16} height={16}
        style={{ width: `${tileSize}px`, height: `${tileSize}px`, imageRendering: 'pixelated', backgroundColor: '#333', cursor: 'pointer' }}
        onClick={handleTileClick}
      />
      <span style={{ fontSize: '10px', marginTop: '2px', color: copied ? '#4CAF50' : '#555', fontWeight: copied ? 'bold' : 'normal' }}>
        {copied ? 'Copiado' : tileIndex}
      </span>
    </div>
  );
}

export default function TileViewer({
  dataReady, activePalette, totalTiles,
  tileSize, setTileSize, columns, setColumns, rows, setRows,
  gapX, setGapX, gapY, setGapY,
  startTile, setStartTile, setSelectedTileIndex
}) {
  const tilesPerPage = columns * rows;
  const currentTiles = Array.from({ length: tilesPerPage }, (_, i) => startTile + i).filter(i => i < totalTiles);

  const handleDownload = async () => {
    if (totalTiles === 0) return alert("No hay ROMs cargadas");
    const zip = new JSZip();
    const folder = zip.folder("sprites");
    for (let tileIndex of currentTiles) {
      const canvas = document.createElement('canvas');
      canvas.width = 16; canvas.height = 16;
      renderTileOnCanvas(canvas, tileIndex, null, activePalette);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      folder.file(`tile_${tileIndex}.png`, blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `sprites_${startTile}_to_${startTile + currentTiles.length - 1}.zip`;
    link.click();
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#e8ecef', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
        <label style={{ fontSize: '14px' }}><b>Tamaño: </b>
          <select value={tileSize} onChange={e => setTileSize(Number(e.target.value))}>
            <option value={16}>16x16</option>
            <option value={64}>64x64</option>
            <option value={128}>128x128</option>
          </select>
        </label>
        
        <div style={{ borderLeft: '2px solid #ccc', paddingLeft: '15px', display: 'flex', gap: '10px' }}>
          <label style={{ fontSize: '14px' }}><b>Inicio: </b><input type="number" style={{ width: '80px', padding: '2px 5px' }} value={startTile} onChange={e => setStartTile(Math.max(0, Number(e.target.value)))} /></label>
          <label style={{ fontSize: '14px' }}><b>Cols: </b><input type="number" style={{ width: '50px' }} value={columns} onChange={e => setColumns(Number(e.target.value))} /></label>
          <label style={{ fontSize: '14px' }}><b>Filas: </b><input type="number" style={{ width: '50px' }} value={rows} onChange={e => setRows(Number(e.target.value))} /></label>
        </div>

        <div style={{ borderLeft: '2px solid #ccc', paddingLeft: '15px', display: 'flex', gap: '10px' }}>
          <label style={{ fontSize: '14px' }}><b>Sep X: </b><input type="number" style={{ width: '40px' }} value={gapX} onChange={e => setGapX(Number(e.target.value))} /></label>
          <label style={{ fontSize: '14px' }}><b>Sep Y: </b><input type="number" style={{ width: '40px' }} value={gapY} onChange={e => setGapY(Number(e.target.value))} /></label>
        </div>
        
        <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
          <button onClick={() => setStartTile(p => Math.max(0, p - tilesPerPage))}>◀ Atrás</button>
          <button onClick={() => setStartTile(p => Math.min(totalTiles - 1, p + tilesPerPage))}>Adelante ▶</button>
          <button onClick={handleDownload} style={{ backgroundColor: '#4CAF50', color: 'white', padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}>
            ⬇ Descargar ZIP
          </button>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', backgroundColor: '#d4dbe0', padding: '10px', borderRadius: '8px', boxSizing: 'border-box' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columns}, ${tileSize}px)`,
          columnGap: `${gapX}px`, rowGap: `${gapY}px`,
          width: 'max-content'
        }}>
          {currentTiles.map((tileIndex) => (
            <TileCanvas 
              key={tileIndex} tileIndex={tileIndex} dataReady={dataReady} 
              activePalette={activePalette} tileSize={tileSize} onClick={setSelectedTileIndex} 
            />
          ))}
        </div>
      </div>
      
      <p style={{ color: '#666', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
        Haz <b>Ctrl + Clic izquierdo</b> sobre un sprite para copiar su número.
      </p>
    </>
  );
}