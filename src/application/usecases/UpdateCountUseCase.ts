import { Member } from '../../domain/entities/Room';
import { RoomRepository } from '../../domain/repositories/RoomRepository';
import { RoomStateRepository } from '../../domain/repositories/RoomStateRepository';
import { RoomService } from '../../domain/services/RoomService';
import { UpdateCountDto } from '../dto/UpdateCountDto';

export class UpdateCountUseCase {
  constructor(
    private roomRepository: RoomRepository,
    private roomStateRepository: RoomStateRepository
  ) { }

  async execute(dto: UpdateCountDto): Promise<Member[]> {
    const roomState = this.roomStateRepository.getRoomState(dto.roomId);
    if (!roomState || !roomState[dto.userId]) {
      throw new Error('ユーザーまたはルームが存在しません');
    }

    // カウント更新
    const currentCount = roomState[dto.userId].counts[dto.color] ?? 0;
    const newCount = currentCount + (dto.remove ? -1 : 1);

    this.roomStateRepository.updateMemberCount(
      dto.roomId,
      dto.userId,
      dto.color,
      newCount
    );

    // Firestoreに反映
    const updatedMembers = RoomService.recordToMembers(roomState);
    await this.roomRepository.update(dto.roomId, { members: updatedMembers });

    return updatedMembers;
  }
}