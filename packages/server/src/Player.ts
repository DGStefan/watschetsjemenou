/** Eén speler in een room. */
export class Player {
  private gone = false;

  constructor(
    public readonly id: string, // socket-id
    public name: string,
    public avatar: string, // id van de gekozen avatar
  ) {}

  /** Markeer de speler als weggevallen (verbinding verbroken tijdens een potje). */
  markGone(): void {
    if (!this.gone) {
      this.name += " (weg)";
      this.gone = true;
    }
  }

  get isGone(): boolean {
    return this.gone;
  }
}
