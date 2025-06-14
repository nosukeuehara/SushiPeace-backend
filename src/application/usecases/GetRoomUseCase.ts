import { Room } from '../../domain/entities/Room';
import { RoomRepository } from '../../domain/repositories/RoomRepository';
import { RoomService } from '../../domain/services/RoomService';

export class GetRoomUseCase {
  constructor(private roomRepository: RoomRepository) { }

  async execute(roomId: string): Promise<Room> {
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new Error('ルームが存在しません');
    }

    // 期限チェック
    if (RoomService.isRoomExpired(room.createdAt)) {
      await this.roomRepository.delete(roomId);
      throw new Error('ルームの有効期限が切れています');
    }

    return room;
  }
}