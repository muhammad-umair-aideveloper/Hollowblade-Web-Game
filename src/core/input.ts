import type { AttackDirection } from './types';

export class Input {
  private attackQueue: AttackDirection[] = [];
  private readonly canvas: HTMLCanvasElement;

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  public consumeAttack(): AttackDirection | undefined {
    return this.attackQueue.shift();
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }

    if (event.key === 'a' || event.key === 'ArrowLeft') {
      this.queueAttack(-1);
    } else if (event.key === 'd' || event.key === 'ArrowRight') {
      this.queueAttack(1);
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const bounds = this.canvas.getBoundingClientRect();
    this.queueAttack(event.clientX - bounds.left < bounds.width / 2 ? -1 : 1);
  };

  private queueAttack(direction: AttackDirection): void {
    if (this.attackQueue.length < 3) {
      this.attackQueue.push(direction);
    }
  }
}
