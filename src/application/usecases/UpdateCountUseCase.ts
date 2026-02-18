import {Member} from "@/domain/entities/Room";
import {RoomRepository} from "@/domain/repositories/RoomRepository";
import {RoomStateRepository} from "@/domain/repositories/RoomStateRepository";
import {RoomService} from "@/domain/services/RoomService";
import {UpdateCountDto} from "@/application/dto/UpdateCountDto";

export class UpdateCountUseCase {
  constructor(
    private roomRepository: RoomRepository,
    private roomStateRepository: RoomStateRepository
  ) {}

  async execute(dto: UpdateCountDto): Promise<Member[]> {
    const roomState = await this.roomStateRepository.getRoomState(dto.roomId);
    if (!roomState || !roomState[dto.userId]) {
      throw new Error("ユーザーまたはルームが存在しません");
    }

    // カウント更新
    const currentCount = roomState[dto.userId].counts[dto.color] ?? 0;
    const newCount = Math.max(0, currentCount + dto.delta);

    const updatedRoomState = await this.roomStateRepository.updateMemberCount(
      dto.roomId,
      dto.userId,
      dto.color,
      newCount
    );

    if (!updatedRoomState) {
      throw new Error("ルームの状態を更新できませんでした");
    }
    // Firestoreに反映
    const updatedMembers = RoomService.recordToMembers(updatedRoomState);
    await this.roomRepository.update(dto.roomId, {members: updatedMembers});

    return updatedMembers;
  }
}
