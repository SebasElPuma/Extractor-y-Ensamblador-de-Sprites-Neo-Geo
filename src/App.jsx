import { useState, useRef } from 'react';
import DiagnosticModal from './components/DiagnosticModal';
import TileViewer from './components/TileViewer';
import PuzzleBuilder from './components/PuzzleBuilder';
import { loadRomToMemory } from './utils/neoGeoDecoder'; 
import './App.css';

function App() {
  const [totalTiles, setTotalTiles] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  
  const [allPalettes, setAllPalettes] = useState([]);
  const [currentPaletteIndex, setCurrentPaletteIndex] = useState(0);
  const [swapIndex, setSwapIndex] = useState(null); 
  const [activeTab, setActiveTab] = useState('viewer'); 

  const [tileSize, setTileSize] = useState(64);
  const [columns, setColumns] = useState(15);
  const [rows, setRows] = useState(15); 
  const [gapX, setGapX] = useState(1);
  const [gapY, setGapY] = useState(1);
  const [startTile, setStartTile] = useState(0);
  const [selectedTileIndex, setSelectedTileIndex] = useState(null);

  const handleRomUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    // 1. Clasificamos los archivos en Impares (C1, C3, C5, C7) y Pares (C2, C4, C6, C8)
    // El '.sort()' asegura que C1 vaya antes que C3, C5, etc.
    const oddFiles = files
      .filter(f => f.name.match(/c(1|3|5|7)\.bin$/i))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    const evenFiles = files
      .filter(f => f.name.match(/c(2|4|6|8)\.bin$/i))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (oddFiles.length === 0 || evenFiles.length === 0 || oddFiles.length !== evenFiles.length) {
      return alert("Faltan archivos o los pares no coinciden. Asegúrate de subir pares completos (ej. C1 y C2, o del C1 al C4).");
    }

    // 2. Leemos los buffers de todos los archivos
    const oddBuffers = await Promise.all(oddFiles.map(f => f.arrayBuffer()));
    const evenBuffers = await Promise.all(evenFiles.map(f => f.arrayBuffer()));

    // 3. Calculamos el tamaño total para crear los contenedores gigantes
    const totalOddSize = oddBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const totalEvenSize = evenBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);

    const mergedOddData = new Uint8Array(totalOddSize);
    const mergedEvenData = new Uint8Array(totalEvenSize);

    // 4. Pegamos (concatenamos) los archivos en orden
    let oddOffset = 0;
    for (const buf of oddBuffers) {
      mergedOddData.set(new Uint8Array(buf), oddOffset);
      oddOffset += buf.byteLength;
    }

    let evenOffset = 0;
    for (const buf of evenBuffers) {
      mergedEvenData.set(new Uint8Array(buf), evenOffset);
      evenOffset += buf.byteLength;
    }
    
    // 5. Enviamos el .bin a la memoria
    loadRomToMemory(mergedOddData, mergedEvenData);
    
    setTotalTiles(Math.floor(Math.min(mergedOddData.length, mergedEvenData.length) / 64));
    setDataReady(true); 
    setStartTile(0);
  };

  const handlePaletteUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const text = await file.text();
      const jsonColors = JSON.parse(text);
      const parsed = jsonColors.map(hex => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b, 255];
      });
      parsed[0][3] = 0; 
      setAllPalettes([parsed]);
      setCurrentPaletteIndex(0);
      return;
    }

    const dataView = new DataView(await file.arrayBuffer());
    const parsedPalettes = [];
    for(let p = 0; p < Math.floor(dataView.byteLength / 32); p++) {
      const colors = [];
      for (let i = 0; i < 16; i++) {
        const color16 = dataView.getUint16((p * 32) + (i * 2), false); 
        colors.push([((color16 >> 8) & 0x1F) * 8, ((color16 >> 3) & 0x1F) * 8, ((color16 << 2) & 0x1F) * 8, i === 0 ? 0 : 255]);
      }
      parsedPalettes.push(colors);
    }
    setAllPalettes(parsedPalettes);
    setCurrentPaletteIndex(0);
  };

  const handleImagePaletteUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const uniqueColors = [[0, 0, 0, 0]]; 
      const bgR = imgData[0], bgG = imgData[1], bgB = imgData[2];

      for (let i = 0; i < imgData.length; i += 4) {
        if (imgData[i+3] === 0 || (imgData[i] === bgR && imgData[i+1] === bgG && imgData[i+2] === bgB)) continue; 
        if (!uniqueColors.some(c => c[0] === imgData[i] && c[1] === imgData[i+1] && c[2] === imgData[i+2]) && uniqueColors.length < 16) {
          uniqueColors.push([imgData[i], imgData[i+1], imgData[i+2], 255]);
        }
      }
      while (uniqueColors.length < 16) uniqueColors.push([0, 0, 0, 255]);
      setAllPalettes([uniqueColors]);
      setCurrentPaletteIndex(0);
    };
  };

  const handleColorClick = (index) => {
    if (index === 0) return;
    if (swapIndex === null) setSwapIndex(index);
    else {
      const newPalettes = [...allPalettes];
      const currentPal = [...newPalettes[currentPaletteIndex]];
      [currentPal[index], currentPal[swapIndex]] = [currentPal[swapIndex], currentPal[index]];
      newPalettes[currentPaletteIndex] = currentPal;
      setAllPalettes(newPalettes);
      setSwapIndex(null);
    }
  };

  const activePalette = allPalettes[currentPaletteIndex] || null;

  const handleExportPalette = () => {
    if (!activePalette) return;
    const hexColors = activePalette.map(c => {
      const r = c[0].toString(16).padStart(2, '0');
      const g = c[1].toString(16).padStart(2, '0');
      const b = c[2].toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    });
    const blob = new Blob([JSON.stringify(hexColors, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `paleta_${currentPaletteIndex}.json`;
    link.click();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <DiagnosticModal 
        selectedTileIndex={selectedTileIndex} setSelectedTileIndex={setSelectedTileIndex}
        romData={null} activePalette={activePalette} allTiles={{ length: totalTiles }}
      />
      
      <h1>Extractor de Sprites Neo Geo</h1>
      
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', marginBottom: '20px' }}>
        
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center', color: 'white', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>1. ROMs Impar y Par:</span>
            <input type="file" multiple accept=".bin" onChange={handleRomUpload} style={{ fontSize: '12px', width: '180px' }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>2. Paleta (.bin / .json):</span>
            <input type="file" accept=".bin,.json" onChange={handlePaletteUpload} style={{ fontSize: '12px', width: '180px' }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4CAF50' }}>3. O Paleta PNG:</span>
            <input type="file" accept="image/png" onChange={handleImagePaletteUpload} style={{ fontSize: '12px', width: '180px' }}/>
          </div>
          
          {allPalettes.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#333', padding: '8px 12px', borderRadius: '6px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Paleta:</span>
              <select value={currentPaletteIndex} onChange={e => setCurrentPaletteIndex(Number(e.target.value))} style={{ padding: '4px', borderRadius: '4px', cursor: 'pointer' }}>
                {allPalettes.map((_, i) => <option key={i} value={i}>Paleta {i}</option>)}
              </select>
              <button onClick={handleExportPalette} title="Guardar Paleta (.json)" style={{ backgroundColor: '#008CBA', color: 'white', padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                💾
              </button>
            </div>
          )}
        </div>

        {activePalette && (
          <div style={{ padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#333' }}>
              Ajuste de Índices {swapIndex !== null ? '(Haz clic en otro para intercambiar)' : '(Haz clic para mover)'}
            </h3>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {activePalette.map((color, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: '#666' }}>{i}</span>
                  <div onClick={() => handleColorClick(i)} style={{ width: '25px', height: '25px', backgroundColor: i === 0 ? '#ddd' : `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`, border: swapIndex === i ? '2px solid red' : '1px solid #000', cursor: i === 0 ? 'not-allowed' : 'pointer' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
          <button onClick={() => setActiveTab('viewer')} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: activeTab === 'viewer' ? '#4CAF50' : '#444', color: 'white', fontWeight: activeTab === 'viewer' ? 'bold' : 'normal' }}>
            Explorador de Tiles
          </button>
          <button onClick={() => setActiveTab('puzzle')} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: activeTab === 'puzzle' ? '#4CAF50' : '#444', color: 'white', fontWeight: activeTab === 'puzzle' ? 'bold' : 'normal' }}>
            Ensamblador (Rompecabezas)
          </button>
        </div>
      </div>

      <div style={{ display: activeTab === 'viewer' ? 'block' : 'none' }}>
        <TileViewer 
          dataReady={dataReady} activePalette={activePalette} totalTiles={totalTiles} 
          tileSize={tileSize} setTileSize={setTileSize}
          columns={columns} setColumns={setColumns} rows={rows} setRows={setRows}
          gapX={gapX} setGapX={setGapX} gapY={gapY} setGapY={setGapY}
          startTile={startTile} setStartTile={setStartTile}
          setSelectedTileIndex={setSelectedTileIndex}
        />
      </div>

      <div style={{ display: activeTab === 'puzzle' ? 'block' : 'none' }}>
        <PuzzleBuilder activePalette={activePalette} tileSize={tileSize} dataReady={dataReady} />
      </div>
    </div>
  );
}

export default App;
