/**
 * svgParser.js — Parses raw SVG XML string into native Konva nodes / BaseShape structures.
 */
import Konva from 'konva';

/**
 * Parses an SVG XML string into an array of raw path objects { d, fill, stroke, strokeWidth }.
 * @param {string} svgText 
 * @returns {Array<{ d: string, fill: string, stroke: string, strokeWidth: number }>}
 */
export function parseSvgPaths(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const pathElements = [];

  // Parse <path>
  const paths = doc.querySelectorAll('path');
  paths.forEach(p => {
    const d = p.getAttribute('d');
    if (d) {
      pathElements.push({
        d,
        fill: p.getAttribute('fill') || '#1e293b',
        stroke: p.getAttribute('stroke') || 'none',
        strokeWidth: parseFloat(p.getAttribute('stroke-width')) || 1,
      });
    }
  });

  // Parse <rect> -> convert to path d
  const rects = doc.querySelectorAll('rect');
  rects.forEach(r => {
    const x = parseFloat(r.getAttribute('x')) || 0;
    const y = parseFloat(r.getAttribute('y')) || 0;
    const w = parseFloat(r.getAttribute('width')) || 0;
    const h = parseFloat(r.getAttribute('height')) || 0;
    const rx = parseFloat(r.getAttribute('rx')) || 0;
    if (w > 0 && h > 0) {
      const d = `M ${x + rx} ${y} H ${x + w - rx} A ${rx} ${rx} 0 0 1 ${x + w} ${y + rx} V ${y + h - rx} A ${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h} H ${x + rx} A ${rx} ${rx} 0 0 1 ${x} ${y + h - rx} V ${y + rx} A ${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`;
      pathElements.push({
        d,
        fill: r.getAttribute('fill') || '#1e293b',
        stroke: r.getAttribute('stroke') || 'none',
        strokeWidth: parseFloat(r.getAttribute('stroke-width')) || 1,
      });
    }
  });

  // Parse <circle>
  const circles = doc.querySelectorAll('circle');
  circles.forEach(c => {
    const cx = parseFloat(c.getAttribute('cx')) || 0;
    const cy = parseFloat(c.getAttribute('cy')) || 0;
    const r = parseFloat(c.getAttribute('r')) || 0;
    if (r > 0) {
      const d = `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
      pathElements.push({
        d,
        fill: c.getAttribute('fill') || '#1e293b',
        stroke: c.getAttribute('stroke') || 'none',
        strokeWidth: parseFloat(c.getAttribute('stroke-width')) || 1,
      });
    }
  });

  return pathElements;
}

/**
 * Creates a composite Konva.Group containing all path elements parsed from an SVG XML string.
 * @param {string} svgText 
 * @param {{ x: number, y: number }} pos 
 * @returns {Konva.Group}
 */
export function createKonvaNodesFromSvg(svgText, pos = { x: 100, y: 100 }) {
  const pathsData = parseSvgPaths(svgText);
  const group = new Konva.Group({
    x: pos.x,
    y: pos.y,
    draggable: true,
  });

  pathsData.forEach(p => {
    const konvaPath = new Konva.Path({
      data: p.d,
      fill: p.fill !== 'none' ? p.fill : undefined,
      stroke: p.stroke !== 'none' ? p.stroke : '#1e293b',
      strokeWidth: p.strokeWidth,
    });
    group.add(konvaPath);
  });

  return group;
}
