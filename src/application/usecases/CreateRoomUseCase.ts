import { nanoid } from 'nanoid';
import { Room } from '../../domain/entities/Room';
import { RoomRepository } from '../../domain/repositories/RoomRepository';
import { TemplateRepository } from '../../domain/repositories/TemplateRepository';
import { RoomStateRepository } from '../../domain/repositories/RoomStateRepository';
import { RoomService } from '../../domain/services/RoomService';
import { CreateRoomDto, CreateRoomResponseDto } from '../dto/CreateRoomDto';

export class CreateRoomUseCase {
  constructor(
    private roomRepository: RoomRepository,
    private templateRepository: TemplateRepository,
    private roomStateRepository: RoomStateRepository
  ) { }

  async execute(dto: CreateRoomDto): Promise<CreateRoomResponseDto> {
    // テンプレート存在チェック
    const template = await this.templateRepository.findById(dto.templateId);
    if (!template) {
      throw new Error('テンプレートが不正です');
    }

    // ルーム作成
    const roomId = nanoid();
    const room: Room = {
      id: roomId,
      groupName: dto.groupName,
      members: dto.members.map(m => ({
        userId: m.userId,
        name: m.name,
        counts: RoomService.createInitialCounts(template),
      })),
      templateId: dto.templateId,
      createdAt: new Date(),
    };

    // データベースに保存
    await this.roomRepository.create(room);

    // メモリストアに登録
    const membersRecord = RoomService.membersToRecord(room.members);
    this.roomStateRepository.setRoomState(roomId, membersRecord);

    return {
      roomId,
      shareUrl: `http://localhost:3000/group/${roomId}`,
    };
  }
}