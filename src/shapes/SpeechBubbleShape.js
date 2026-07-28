import Konva from 'konva';
import { BaseShape } from './BaseShape';

export class SpeechBubbleShape extends BaseShape {
  constructor(config = {}) {
    super('speechBubble', config);

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 140;
    this.height = config.height || 90;

    this.konvaNode = new Konva.Path({
      id: this.id,
      x: this.x,
      y: this.y,
      data: this.calculatePath(this.width, this.height),
      rotation: config.rotation || 0,
      scaleX: config.scaleX || 1,
      scaleY: config.scaleY || 1,
      draggable: true,
      lineJoin: 'round',
    });

    this.applyStyles();
  }

  calculatePath(w, h) {
    const r = Math.min(12, w * 0.1, h * 0.1);
    const bodyH = h * 0.75;
    const tailW = w * 0.15;
    const tailX = w * 0.25;

    // Rounded rectangle speech bubble with bottom pointer tail
    return `
      M ${r} 0
      H ${w - r}
      A ${r} ${r} 0 0 1 ${w} ${r}
      V ${bodyH - r}
      A ${r} ${r} 0 0 1 ${w - r} ${bodyH}
      H ${tailX + tailW}
      L ${tailX} ${h}
      L ${tailX + tailW * 0.4} ${bodyH}
      H ${r}
      A ${r} ${r} 0 0 1 0 ${bodyH - r}
      V ${r}
      A ${r} ${r} 0 0 1 ${r} 0
      Z
    `.trim();
  }

  updateGeometry(geom) {
    if (geom.x !== undefined) {
      this.x = geom.x;
      this.konvaNode.x(geom.x);
    }
    if (geom.y !== undefined) {
      this.y = geom.y;
      this.konvaNode.y(geom.y);
    }
    if (geom.width !== undefined) this.width = geom.width;
    if (geom.height !== undefined) this.height = geom.height;

    this.konvaNode.data(this.calculatePath(this.width, this.height));

    if (this._roughMode) this._scheduleRoughRender();
  }

  getGeometry() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  renderRough() {
    this.renderRoughWith({ type: 'rectangle' });
  }
}
