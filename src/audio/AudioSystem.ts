export class AudioSystem {
  private context: AudioContext | undefined;
  private unlocked = false;

  public unlock(): void {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    this.unlocked = true;
  }

  public attack(): void {
    this.tone(180, 0.06, 'sawtooth', 0.035);
  }

  public hit(): void {
    this.tone(90, 0.08, 'square', 0.045);
  }

  public kill(): void {
    this.tone(320, 0.11, 'triangle', 0.04);
  }

  public damage(): void {
    this.tone(70, 0.16, 'sawtooth', 0.05);
  }

  public ability(): void {
    this.tone(460, 0.22, 'sine', 0.045);
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    if (!this.context || !this.unlocked) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.45, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
