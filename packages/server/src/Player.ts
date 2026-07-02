/** Eén speler in een room. */
export class Player {
  private gone = false;

  constructor(
    public readonly id: string, // stabiele client-id (overleeft een refresh)
    public socketId: string, // huidige verbinding; verandert bij (her)verbinden
    public name: string,
    public avatar: string, // id van de gekozen avatar
  ) {}

  /** Markeer de speler als weggevallen (verbinding verbroken tijdens een potje). */
  markGone(): void {
    this.gone = true;
  }

  /** De speler is teruggekomen op een nieuwe verbinding. */
  reconnect(socketId: string): void {
    this.socketId = socketId;
    this.gone = false;
  }

  get isGone(): boolean {
    return this.gone;
  }

  /** Naam zoals getoond aan anderen; een weggevallen speler krijgt "(weg)". */
  get displayName(): string {
    return this.gone ? `${this.name} (weg)` : this.name;
  }
}
