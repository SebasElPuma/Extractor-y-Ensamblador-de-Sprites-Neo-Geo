# Extractor y Ensamblador de Sprites Neo Geo (React)

Una herramienta web rápida y sin lag para extraer, visualizar y ensamblar sprites directamente desde los archivos `.bin` (ROMs C) de juegos arcade de SNK Neo Geo, optimizada para desarrolladores indie que buscan importar assets a motores como Godot.

## ✨ Características Principales
* **Carga Universal de ROMs:** Soporta juegos de cualquier tamaño. Une y decodifica automáticamente archivos intercalados (C1 a C8).
* **Rendimiento Extremo:** Manejo de datos binarios fuera del ciclo de renderizado de React (cero lag al cargar archivos pesados).
* **Gestor de Paletas:** Carga paletas originales `.bin`, extrae colores automáticamente desde un `.png`, o usa paletas `.json` personalizadas.
* **Flujo de Trabajo Ágil:** * `Ctrl + Clic` en el Explorador para copiar el ID del tile.
  * `Ctrl + Clic` en el Ensamblador para pegar.
  * Sistema de arrastrar y soltar (Drag & Drop) intuitivo.
  * Herramienta de Borrador para correcciones rápidas.
* **Exportación Pixel Perfect:** Genera personajes ensamblados en formato PNG con fondo transparente y resolución nativa, listos para un `CollisionShape2D` o `AnimatedSprite2D`.

## 🚀 Cómo usarlo
1. Sube tus archivos `.bin` (mínimo un par, ej. C1 y C2).
2. Sube un archivo de paleta (o usa un PNG de referencia).
3. Busca las piezas de tu personaje en el **Explorador de Tiles**.
4. Pega los IDs en el **Ensamblador** para armar los frames de animación.
5. Oculta la cuadrícula y haz clic en **Exportar PNG**.

## 🛠️ Stack Tecnológico
* React (Vite)
* Manipulación de Bits y Canvas API de HTML5.
* JSZip (Para descarga masiva de tiles).

## 🤝 Créditos y Agradecimientos

* **Desarrollo principal y diseño de flujo de trabajo:** [SebasElPuma].
* **Lógica de Neo Geo:** Basado en el repositorio: https://github.com/city41/neospriteviewer y asistido por DeepWiki para su comprensión.
* **Asistencia de IA:** Parte de la estructuración en React, la optimización extrema de memoria (eliminación de lag en archivos `.bin` pesados) y el diseño de la interfaz (Drag & Drop, Portapapeles) fue desarrollada con la asistencia de Gemini como herramienta de *pair programming*.
