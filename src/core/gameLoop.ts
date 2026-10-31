import { GAME_CONFIG } from '../config/gameConfig';

export interface GameLoopCallbacks {
  update: (delta: number) => void;
  render: (alpha: number) => void;
}

export class GameLoop {
  private accumulator = 0;
  private previousTime = 0;
  private animationFrame = 0;
  private paused = false;
  private readonly callbacks: GameLoopCallbacks;

  public constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks;
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('blur', this.pause);
    window.addEventListener('focus', this.resume);
  }

  public start(): void {
    this.previousTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    cancelAnimationFrame(this.animationFrame);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.pause);
    window.removeEventListener('focus', this.resume);
  }

  private readonly tick = (time: number): void => {
    const frameDelta = Math.min((time - this.previousTime) / 1000, GAME_CONFIG.maxFrameDelta);
    this.previousTime = time;

    if (!this.paused) {
      this.accumulator += frameDelta;
      while (this.accumulator >= GAME_CONFIG.fixedStep) {
        this.callbacks.update(GAME_CONFIG.fixedStep);
        this.accumulator -= GAME_CONFIG.fixedStep;
      }
      this.callbacks.render(this.accumulator / GAME_CONFIG.fixedStep);
    }

    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  };

  private readonly pause = (): void => {
    this.paused = true;
  };

  private readonly resume = (): void => {
    this.paused = false;
    this.previousTime = performance.now();
  };
}
