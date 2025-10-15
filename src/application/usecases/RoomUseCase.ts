import {Member, Room} from "@/domain/entities/Room";
import {RoomRepository} from "@/domain/repositories/RoomRepository";
import {RoomStateRepository} from "@/domain/repositories/RoomStateRepository";
import {RoomService} from "@/domain/services/RoomService";

export class RoomUseCase {
  constructor(
    private roomRepository: RoomRepository,
    private roomStateRepository: RoomStateRepository
  ) {}

  async getRoom(roomId: string): Promise<Room> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new Error("ルームが存在しません");
    }

    // 期限チェック
    if (RoomService.isRoomExpired(room.createdAt)) {
      await this.roomRepository.delete(roomId);
      throw new Error("ルームの有効期限が切れています");
    }

    return room;
  }

  async getRoomState(roomId: string): Promise<Record<string, Member> | null> {
    const room = await this.roomStateRepository.getRoomState(roomId);
    return room;
  }

  async setRoomState(
    roomId: string,
    roomState: Record<string, Member>
  ): Promise<void> {
    this.roomStateRepository.setRoomState(roomId, roomState);
  }

  async update(roomId: string, room: Partial<Room>): Promise<void> {
    await this.roomRepository.update(roomId, room);
  }
}
