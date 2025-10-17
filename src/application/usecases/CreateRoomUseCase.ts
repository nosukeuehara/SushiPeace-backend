import {nanoid} from "nanoid";
import {Room} from "@/domain/entities/Room";
import {RoomRepository} from "@/domain/repositories/RoomRepository";
import {TemplateRepository} from "@/domain/repositories/TemplateRepository";
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
    private templateRepository: TemplateRepository,
    private roomStateRepository: RoomStateRepository
  ) {}

  async execute(dto: CreateRoomDto): Promise<CreateRoomResponseDto> {
    const templateId = dto.templateId || "";
    const template = templateId
      ? await this.templateRepository.findById(templateId)
      : null;

    // countsをテンプレートがある場合は生成、ない場合は空の配列やオブジェクトを返すようにサービス側を修正
    const roomId = nanoid();
    const room: Room = {
      id: roomId,
      groupName: dto.groupName,
      members: dto.members.map((m) => ({
        userId: m.userId,
        name: m.name,
        counts: RoomService.createInitialCounts(template), // null対応
      })),
      templateId: templateId || "", // 空文字を許容
      createdAt: new Date(),
    };

    await this.roomRepository.create(room);

    const membersRecord = RoomService.membersToRecord(room.members);
    this.roomStateRepository.setRoomState(roomId, membersRecord);

    return {
      roomId,
      shareUrl: `http://${HOST}/group/${roomId}`,
    };
  }
}
