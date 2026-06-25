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
}
