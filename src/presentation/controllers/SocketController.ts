import {Server, Socket} from "socket.io";
import {UpdateCountUseCase} from "@/application/usecases/UpdateCountUseCase";
import {RoomService} from "@/domain/services/RoomService";
import {logger} from "@/infrastructure/logging/logger";
import {Member} from "@/domain/entities/Room";
import {CountEvent, JoinEvent, UpdateTemplateEvent} from "@/shared";
import {RoomUseCase} from "@/application/usecases/RoomUseCase";

export class SocketController {
  constructor(
    private updateCountUseCase: UpdateCountUseCase,
    private roomUseCase: RoomUseCase
  ) {}

  handleConnection(io: Server, socket: Socket): void {
    socket.on("join", async ({roomId, userId}: JoinEvent) => {
      await this.handleJoin(io, socket, roomId, userId);
    });

    socket.on("count", async ({roomId, userId, color, remove}: CountEvent) => {
      await this.handleCount(io, roomId, userId, color, remove);
    });

    socket.on(
      "updateTemplate",
      async ({roomId, prices}: UpdateTemplateEvent) => {
        const room = await this.roomUseCase.getRoom(roomId);
        if (!room) return;

        const rawTemplate = prices ?? {};
        const numericEntries = Object.entries(rawTemplate).filter(
          ([, value]) => typeof value === "number"
        );
        const newTemplate = Object.fromEntries(numericEntries) as Record<
          string,
          number
        >;
        const validColors = Object.keys(newTemplate);

        const roomState = await this.roomUseCase.getRoomState(roomId);
        let members: Member[];

        if (roomState) {
          Object.values(roomState).forEach((member) => {
            member.counts = Object.fromEntries(
              Object.entries(member.counts).filter(([color]) =>
                validColors.includes(color)
              )
            );
          });
          this.roomUseCase.setRoomState(roomId, roomState);
          members = RoomService.recordToMembers(roomState);
        } else {
          members = room.members.map((m) => ({
            ...m,
            counts: Object.fromEntries(
              Object.entries(m.counts).filter(([color]) =>
                validColors.includes(color)
              )
            ),
          }));
        }

        const updatedRoom = {
          ...room,
          templateId: validColors.length > 0 ? room.templateId : "",
          templateData: validColors.length > 0 ? newTemplate : {},
          members,
        };

        await this.roomUseCase.update(room.id, updatedRoom);

        io.to(roomId).emit("sync", {
          members,
          templateData: updatedRoom.templateData ?? {},
        });
      }
    );
  }

  private async handleJoin(
    io: Server,
    socket: Socket,
    roomId: string,
    userId: string
  ): Promise<void> {
    try {
      const room = await this.roomUseCase.getRoom(roomId);
      if (!room) return;

      if (!this.roomUseCase.getRoomState(roomId)) {
        const membersRecord = RoomService.membersToRecord(room.members);
        this.roomUseCase.setRoomState(roomId, membersRecord);
      }

      socket.join(roomId);

      const roomState = await this.roomUseCase.getRoomState(roomId);
      if (!roomState) return;
      const members = RoomService.recordToMembers(roomState);
      io.to(roomId).emit("sync", {
        members,
        templateData: room.templateData ?? {},
      });
    } catch (error) {
      logger.error("Join error:", error);
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

      const room = await this.roomUseCase.getRoom(roomId);
      const templateId = room?.templateId ?? "";

      io.to(roomId).emit("sync", {
        members: updatedMembers,
        templateId,
      });
    } catch (error) {
      logger.error("Count update error:", error);
    }
  }
}
