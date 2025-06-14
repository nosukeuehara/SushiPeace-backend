import { Member } from '../entities/Room';

export interface RoomStateRepository {
  getRoomState(roomId: string): Record<string, Member> | null;
  setRoomState(roomId: string, members: Record<string, Member>): void;
  updateMemberCount(roomId: string, userId: string, color: string, count: number): void;
}