import { Server, Socket } from 'socket.io';
import { RoomRepository } from '../../domain/repositories/RoomRepository';
import { RoomStateRepository } from '../../domain/repositories/RoomStateRepository';
import { UpdateCountUseCase } from '../../application/usecases/UpdateCountUseCase';
import { RoomService } from '../../domain/services/RoomService';

export class SocketController {
  constructor(
    private roomRepository: RoomRepository,
    private roomStateRepository: RoomStateRepository,
    private updateCountUseCase: UpdateCountUseCase
  ) { }

  handleConnection(io: Server, socket: Socket): void {
    socket.on('join', async ({ roomId, userId }) => {
      await this.handleJoin(io, socket, roomId, userId);
    });

    socket.on('count', async ({ roomId, userId, color, remove }) => {
      await this.handleCount(io, roomId, userId, color, remove);
    });

    socket.on("updateTemplate", async ({ roomId, prices }) => {
      const room = await this.roomRepository.findById(roomId);
      if (!room) return;
      const updatedRoom = {
        ...room,
        templateId: room.templateId,
        templateData: prices,
      };

      await this.roomRepository.update(room.id, updatedRoom);
      const roomState = this.roomStateRepository.getRoomState(roomId);
      if (!roomState) return;
      const members = RoomService.recordToMembers(roomState);
      io.to(roomId).emit("sync", {
        members,
        templateId: updatedRoom.templateData ?? {},
      });
    });
  }

  private async handleJoin(io: Server, socket: Socket, roomId: string, userId: string): Promise<void> {
    try {
      let room = await this.roomRepository.findById(roomId);
      if (!room) return;

      // メモリに状態がなければ復元
      if (!this.roomStateRepository.getRoomState(roomId)) {
        const membersRecord = RoomService.membersToRecord(room.members);
        this.roomStateRepository.setRoomState(roomId, membersRecord);
      }

      socket.join(roomId);

      // 現在のルーム状態を送信（メンバーとテンプレートID）
      const roomState = this.roomStateRepository.getRoomState(roomId);
      if (!roomState) return;
      const members = RoomService.recordToMembers(roomState);
      io.to(roomId).emit('sync', {
        members,
        templateId: room.templateId ?? '',
      });
    } catch (error) {
      console.error('Join error:', error);
    }
  }

  private async handleCount(
    io: Server,
    roomId: string,
    userId: string,
    color: string,
    remove: boolean
  ): Promise<void> {
    try {
      const updatedMembers = await this.updateCountUseCase.execute({
        roomId,
        userId,
        color,
        remove,
      });

      const room = await this.roomRepository.findById(roomId);
      const templateId = room?.templateId ?? '';

      io.to(roomId).emit("sync", {
        members: updatedMembers,
        templateId,
      });

    } catch (error) {
      console.error('Count update error:', error);
    }
  }
}
