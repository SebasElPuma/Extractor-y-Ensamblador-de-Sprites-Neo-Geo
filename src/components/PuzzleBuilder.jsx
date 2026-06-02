import React, { useState, useEffect, useRef } from 'react';
import { renderTileOnCanvas } from '../utils/neoGeoDecoder';

function PuzzleCell({ r, c, cellValue, onValueChange, onSwap, dataReady, activePalette, tileSize, showGrid, isEraserActive }) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  const showInput = isEditing || cellValue === '';

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleBlurOrEnter = (e) => {
    if (e.type === 'blur' || e.key === 'Enter') setIsEditing(false);
  };

  // --- LÓGICA DE ARRASTRAR (Solo mantener clic) ---
  const handleDragStart = (e) => {
    if (isEraserActive) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('sourceCell', JSON.stringify({ r, c }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (isEraserActive) return;
    try {
      const source = JSON.parse(e.dataTransfer.getData('sourceCell'));
      onSwap(source.r, source.c, r, c);
    } catch(err) { }
  };

  // --- LÓGICA DE CLICS (Pegar y Editar) ---
  const handleClick = async (e) => {
    if (isEraserActive) {
      // 1. Borrador activo
      if (cellValue !== '') onValueChange(r, c, '');
    } else if (e.ctrlKey) {
      // 2. Ctrl + Clic: PEGAR DESDE EL PORTAPAPELES
      try {
        const text = await navigator.clipboard.readText();
        const cleanText = text.trim();
        // Verifica que lo que copió del explorador sea realmente un número
        if (/^\d+$/.test(cleanText)) {
          onValueChange(r, c, cleanText);
        }
      } catch (err) {
        console.error("El navegador bloqueó la lectura del portapapeles o está vacío.", err);
      }
    } else {
      // 3. Clic normal: Al hacer clic, se habilita la entrada de dígitos
      if (!showInput) setIsEditing(true); 
    }
  };

  const cursorStyle = isEraserActive 
    ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ctext y='20' font-size='20'%3E🗑️%3C/text%3E%3C/svg%3E") 12 12, auto` 
    : (showInput ? 'default' : 'pointer');

  return (
    <div 
      draggable={!showInput && !isEraserActive} 
      onDragStart={handleDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ 
        width: `${tileSize}px`, height: `${tileSize}px`, 
        backgroundColor: showGrid ? '#333' : 'transparent', position: 'relative', 
        cursor: cursorStyle, boxSizing: 'border-box', border: showGrid ? '1px solid #555' : 'none'
      }}
      onClick={handleClick}
    >
      {showInput ? (
        <input 
          ref={inputRef} type="text" placeholder="Tile" value={cellValue}
          onFocus={() => { if (!isEraserActive) setIsEditing(true); }}
          onChange={(e) => onValueChange(r, c, e.target.value)}
          onBlur={handleBlurOrEnter} onKeyDown={(e) => e.key === 'Enter' && handleBlurOrEnter(e)}
          style={{ width: '100%', height: '100%', boxSizing: 'border-box', textAlign: 'center', border: 'none', backgroundColor: 'rgba(68, 68, 68, 0.9)', color: 'white', fontSize: '14px', outline: 'none', position: 'absolute', top: 0, left: 0, zIndex: 10 }}
        />
      ) : null}
      <canvas 
        width={16} height={16}
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated', display: (cellValue !== '' && !showInput) ? 'block' : 'none' }}
        ref={el => { if (el && cellValue !== '' && dataReady) renderTileOnCanvas(el, cellValue, null, activePalette); }}
      />
    </div>
  );
}

const PuzzleCellMemo = React.memo(PuzzleCell);

function PuzzleBuilder({ activePalette, tileSize = 64, dataReady }) {
  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(4);
  const [puzzleTileSize, setPuzzleTileSize] = useState(64);
  const [showGrid, setShowGrid] = useState(true);
  const [isEraserActive, setIsEraserActive] = useState(false); 
  
  const [gridData, setGridData] = useState(Array(4).fill(Array(4).fill('')));
  
  const gridRef = useRef(null);
  const eraserBtnRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isEraserActive && gridRef.current && eraserBtnRef.current) {
        if (!gridRef.current.contains(e.target) && !eraserBtnRef.current.contains(e.target)) {
          setIsEraserActive(false);
        }
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isEraserActive]);

  useEffect(() => {
    setGridData(prev => Array(rows).fill(null).map((_, r) => Array(cols).fill(null).map((_, c) => (prev[r] && prev[r][c] !== undefined) ? prev[r][c] : '')));
  }, [rows, cols]);

  const handleInputChange = (r, c, value) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    const numValue = value === '' ? '' : parseInt(value, 10);
    setGridData(prev => prev.map((row, rowIndex) => rowIndex === r ? row.map((col, colIndex) => colIndex === c ? numValue : col) : row));
  };

  const handleSwap = (r1, c1, r2, c2) => {
    if (r1 === r2 && c1 === c2) return;
    setGridData(prev => {
      const newGrid = prev.map(row => [...row]);
      const temp = newGrid[r1][c1];
      newGrid[r1][c1] = newGrid[r2][c2];
      newGrid[r2][c2] = temp;
      return newGrid;
    });
  };

  const clearGrid = () => {
    setGridData(Array(rows).fill(null).map(() => Array(cols).fill('')));
    setIsEraserActive(false);
  };

  const handleEraserToggle = (e) => {
    if (e.ctrlKey) {
      clearGrid(); 
    } else {
      setIsEraserActive(!isEraserActive); 
    }
  };

  const exportToPNG = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = cols * 16; 
    exportCanvas.height = rows * 16;
    const ctx = exportCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 16; tempCanvas.height = 16;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tileIndex = gridData[r][c];
        if (tileIndex !== '') {
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.clearRect(0, 0, 16, 16);
          renderTileOnCanvas(tempCanvas, tileIndex, null, activePalette);
          ctx.drawImage(tempCanvas, 0, 0, 16, 16, c * 16, r * 16, 16, 16);
        }
      }
    }

    const link = document.createElement('a');
    link.download = 'personaje_ensamblado.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ padding: '15px', backgroundColor: '#e8ecef', borderRadius: '8px', minHeight: '60vh' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '18px', marginRight: '10px' }}>🧩 Ensamblador</h2>
        <label style={{ fontSize: '14px' }}><b>Cols: </b><input type="number" style={{ width: '50px' }} value={cols} onChange={e => setCols(Math.max(1, Number(e.target.value)))} /></label>
        <label style={{ fontSize: '14px' }}><b>Filas: </b><input type="number" style={{ width: '50px' }} value={rows} onChange={e => setRows(Math.max(1, Number(e.target.value)))} /></label>
        
        <div style={{ borderLeft: '2px solid #ccc', paddingLeft: '15px' }}>
          <label style={{ fontSize: '14px' }}><b>Tamaño Vista: </b>
            <select value={puzzleTileSize} onChange={e => setPuzzleTileSize(Number(e.target.value))}>
              <option value={16}>16x16</option>
              <option value={32}>32x32</option>
              <option value={64}>64x64</option>
              <option value={128}>128x128</option>
            </select>
          </label>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button 
            ref={eraserBtnRef}
            onClick={handleEraserToggle} 
            title="Borrador (Ctrl+Clic para limpiar todo)"
            style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: isEraserActive ? '#e74c3c' : '#555', color: 'white', border: 'none', borderRadius: '4px', fontWeight: isEraserActive ? 'bold' : 'normal' }}
          >
            🗑️ {isEraserActive ? 'Borrador Activo' : 'Borrador'}
          </button>

          <button onClick={() => setShowGrid(!showGrid)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: showGrid ? '#555' : '#888', color: 'white', border: 'none', borderRadius: '4px' }}>
            {showGrid ? '👁️ Ocultar Cuadrícula' : '👁️ Mostrar Cuadrícula'}
          </button>
          <button onClick={exportToPNG} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
            💾 Exportar PNG
          </button>
        </div>
      </div>

      <div ref={gridRef} style={{ 
        display: 'grid', gridTemplateColumns: `repeat(${cols}, max-content)`, gap: '0px', 
        backgroundColor: showGrid ? '#222' : 'transparent', padding: showGrid ? '10px' : '0px', 
        width: 'max-content', borderRadius: '4px', margin: '0 auto' 
      }}>
        {gridData.map((row, r) => 
          row.map((cellValue, c) => (
            <PuzzleCellMemo 
              key={`${r}-${c}`} r={r} c={c} cellValue={cellValue} onValueChange={handleInputChange} 
              onSwap={handleSwap} dataReady={dataReady} activePalette={activePalette} 
              tileSize={puzzleTileSize} showGrid={showGrid} isEraserActive={isEraserActive}
            />
          ))
        )}
      </div>
      
      {/* TEXTO DE AYUDA */}
      <div style={{ color: '#666', fontSize: '13px', marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <span>🖱️ <b>Clic y arrastrar</b> para mover una pieza.</span>
        <span>📋 <b>Ctrl + Clic</b> para PEGAR un tile copiado del Explorador.</span>
      </div>
    </div>
  );
}

export default React.memo(PuzzleBuilder);
