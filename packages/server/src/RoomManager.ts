import { Room } from "./Room";

/** Houdt alle rooms bij, op spelcode. */
export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  getOrCreate(code: string): Room {
    let room = this.rooms.get(code);
    if (!room) {
      room = new Room(code);
      this.rooms.set(code, room);
    }
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  /**
   * Sluit alle rooms die langer dan maxAgeMs geen activiteit hadden. Voor elke
   * gesloten room wordt eerst onClose aangeroepen (bv. om de spelers te
   * waarschuwen), waarna de timers worden gestopt en de room verdwijnt.
   */
  sweepInactive(now: number, maxAgeMs: number, onClose: (room: Room) => void): void {
    for (const [code, room] of this.rooms) {
      if (now - room.lastActivity > maxAgeMs) {
        onClose(room);
        room.dispose();
        this.rooms.delete(code);
      }
    }
  }
}
