import { Member } from '../../domain/entities/Room';
import { RoomStateRepository } from '../../domain/repositories/RoomStateRepository';

export class InMemoryRoomStateRepository implements RoomStateRepository {
  private roomStore: Record<string, Record<string, Member>> = {};

  getRoomState(roomId: string): Record<string, Member> | null {
    return this.roomStore[roomId] || null;
  }

  setRoomState(roomId: string, members: Record<string, Member>): void {
    this.roomStore[roomId] = members;
  }

  updateMemberCount(roomId: string, userId: string, color: string, count: number): void {
    if (!this.roomStore[roomId] || !this.roomStore[roomId][userId]) return;

    this.roomStore[roomId][userId].counts[color] = Math.max(0, count);
  }
}