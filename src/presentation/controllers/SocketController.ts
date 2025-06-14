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
      await this.handleJoin(socket, roomId, userId);
    });

    socket.on('count', async ({ roomId, userId, color, remove }) => {
      await this.handleCount(io, roomId, userId, color, remove);
    });
  }

  private async handleJoin(socket: Socket, roomId: string, userId: string): Promise<void> {
    try {
      // メモリストアにルーム情報がなければFirestoreから復元
      if (!this.roomStateRepository.getRoomState(roomId)) {
        const room = await this.roomRepository.findById(roomId);
        if (!room) return;

        const membersRecord = RoomService.membersToRecord(room.members);
        this.roomStateRepository.setRoomState(roomId, membersRecord);
      }

      socket.join(roomId);
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

      io.to(roomId).emit("sync", updatedMembers);
    } catch (error) {
      console.error('Count update error:', error);
    }
  }
}