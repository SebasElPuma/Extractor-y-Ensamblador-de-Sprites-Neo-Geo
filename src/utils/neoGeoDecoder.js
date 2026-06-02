// --- MAGIA ANTI-LAG: La ROM vive aquí, fuera del alcance de React ---
let romMemory = { c1Data: null, c2Data: null };

export function loadRomToMemory(c1, c2) {
  romMemory.c1Data = c1;
  romMemory.c2Data = c2;
}

// Mantenemos la misma estructura (4 argumentos) para no romper tus otros archivos,
// pero IGNORAMOS el argumento 'romData' que manda React y usamos nuestra 'romMemory'.
export function renderTileOnCanvas(canvas, tileIndex, _ignoredRomData, palette) {
  if (!canvas || !romMemory.c1Data || !romMemory.c2Data) return;

  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(16, 16);
  const startOffset = tileIndex * 64;

  for (let iter = 0; iter < 32; iter++) {
    const byteOffset = startOffset + (iter * 2);

    const plane0 = romMemory.c1Data[byteOffset];
    const plane1 = romMemory.c1Data[byteOffset + 1];
    const plane2 = romMemory.c2Data[byteOffset];
    const plane3 = romMemory.c2Data[byteOffset + 1];

    const isRightHalf = iter < 16;
    const offsetX = isRightHalf ? 8 : 0;
    const y = iter % 16;

    for (let b = 0; b < 8; b++) {
      let colorIndex = 0;
      colorIndex |= ((plane0 >> b) & 1);
      colorIndex |= ((plane1 >> b) & 1) << 1;
      colorIndex |= ((plane2 >> b) & 1) << 2;
      colorIndex |= ((plane3 >> b) & 1) << 3;

      const x = offsetX + b;

      let r = 0, g = 0, bl = 0, a = 255;
      if (colorIndex === 0) {
        a = 0;
      } else if (palette && palette[colorIndex]) {
        [r, g, bl, a] = palette[colorIndex];
      } else {
        const shade = colorIndex * 16;
        r = shade; g = shade; bl = shade;
      }

      const pixelPos = (y * 16 + x) * 4;
      imgData.data[pixelPos] = r;
      imgData.data[pixelPos + 1] = g;
      imgData.data[pixelPos + 2] = bl;
      imgData.data[pixelPos + 3] = a;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

// Hacemos lo mismo para el diagnóstico
export function getTileIndicesGrid(tileIndex, _ignoredRomData) {
  if (!romMemory.c1Data || !romMemory.c2Data) return null;
  const grid = Array(16).fill(0).map(() => Array(16).fill(0));
  const startOffset = tileIndex * 64;

  for (let iter = 0; iter < 32; iter++) {
    const byteOffset = startOffset + (iter * 2);
    const plane0 = romMemory.c1Data[byteOffset];
    const plane1 = romMemory.c1Data[byteOffset + 1];
    const plane2 = romMemory.c2Data[byteOffset];
    const plane3 = romMemory.c2Data[byteOffset + 1];

    const isRightHalf = iter < 16;
    const offsetX = isRightHalf ? 8 : 0;
    const y = iter % 16;

    for (let b = 0; b < 8; b++) {
      let colorIndex = 0;
      colorIndex |= ((plane0 >> b) & 1);
      colorIndex |= ((plane1 >> b) & 1) << 1;
      colorIndex |= ((plane2 >> b) & 1) << 2;
      colorIndex |= ((plane3 >> b) & 1) << 3;

      const x = offsetX + b;
      grid[y][x] = colorIndex;
    }
  }
  return grid;
}