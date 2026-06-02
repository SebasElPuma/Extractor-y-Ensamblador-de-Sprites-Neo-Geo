import { getTileIndicesGrid } from '../utils/neoGeoDecoder';

export default function DiagnosticModal({ 
  selectedTileIndex, 
  setSelectedTileIndex, 
  romData, 
  activePalette, 
  allTiles 
}) {
  if (selectedTileIndex === null) return null;
  
  const gridData = getTileIndicesGrid(selectedTileIndex, romData);
  if (!gridData) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#e0e7ec', padding: '20px', borderRadius: '8px', display: 'flex', gap: '20px', alignItems: 'flex-start', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
        
        {/* LA CUADRÍCULA DE NÚMEROS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 20px)', gap: '1px', backgroundColor: '#000', border: '1px solid #000' }}>
          {gridData.map((row, y) => 
            row.map((cellValue, x) => {
              let bgColor = '#2c2c2c';
              let textColor = '#fff';
              
              if (cellValue === 0) {
                bgColor = '#fff';
                textColor = '#205182';
              } else if (activePalette && activePalette[cellValue]) {
                bgColor = `rgb(${activePalette[cellValue][0]}, ${activePalette[cellValue][1]}, ${activePalette[cellValue][2]})`;
                textColor = (activePalette[cellValue][0] + activePalette[cellValue][1] + activePalette[cellValue][2]) > 382 ? '#000' : '#fff';
              }

              return (
                <div key={`${y}-${x}`} style={{ width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontFamily: 'monospace', backgroundColor: bgColor, color: textColor }}>
                  {cellValue}
                </div>
              );
            })
          )}
        </div>

        {/* CONTROLES DEL MODAL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2 style={{ margin: 0, color: '#445b6b' }}>tile index 0x{selectedTileIndex.toString(16).toUpperCase()} ({selectedTileIndex})</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSelectedTileIndex(Math.max(0, selectedTileIndex - 1))} style={{ padding: '8px 16px', backgroundColor: '#607d8b', color: 'white', border: 'none', cursor: 'pointer' }}>prev</button>
            <button onClick={() => setSelectedTileIndex(Math.min(allTiles.length - 1, selectedTileIndex + 1))} style={{ padding: '8px 16px', backgroundColor: '#607d8b', color: 'white', border: 'none', cursor: 'pointer' }}>next</button>
            <button onClick={() => setSelectedTileIndex(null)} style={{ padding: '8px 16px', backgroundColor: '#cfd8dc', color: '#333', border: '1px solid #aaa', cursor: 'pointer' }}>close</button>
          </div>
        </div>

      </div>
    </div>
  );
}