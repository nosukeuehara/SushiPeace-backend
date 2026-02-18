import {nanoid} from "nanoid";
import {Room} from "@/domain/entities/Room";
import {RoomRepository} from "@/domain/repositories/RoomRepository";
import {RoomStateRepository} from "@/domain/repositories/RoomStateRepository";
import {RoomService} from "@/domain/services/RoomService";
import {
  CreateRoomDto,
  CreateRoomResponseDto,
} from "@/application/dto/CreateRoomDto";

const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

export class CreateRoomUseCase {
  constructor(
    private roomRepository: RoomRepository,
    private roomStateRepository: RoomStateRepository
  ) {}

  async execute(dto: CreateRoomDto): Promise<CreateRoomResponseDto> {
    // countsをテンプレートがある場合は生成、ない場合は空の配列やオブジェクトを返すようにサービス側を修正
    const roomId = nanoid();
    const room: Room = {
      id: roomId,
      groupName: dto.groupName,
      members: dto.members.map((m) => ({
        userId: m.userId,
        name: m.name,
        counts: RoomService.createInitialCounts(null), // null対応
      })),
      createdAt: new Date(),
    };

    await this.roomRepository.create(room);

    const membersRecord = RoomService.membersToRecord(room.members);
    await this.roomStateRepository.setRoomState(roomId, membersRecord);

    return {
      roomId,
      shareUrl: `https://${HOST}/group/${roomId}`,
    };
  }
}
