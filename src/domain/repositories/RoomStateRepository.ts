import {Member} from "@/domain/entities/Room";

export interface RoomStateRepository {
  getRoomState(roomId: string): Promise<Record<string, Member> | null>;
  setRoomState(roomId: string, members: Record<string, Member>): Promise<void>;
  updateMemberCount(
    roomId: string,
    userId: string,
    color: string,
    count: number
  ): Promise<void>;
}
