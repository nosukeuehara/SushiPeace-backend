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
    socket.on("join", async ({roomId}, ack: (res: {ok: boolean}) => void) => {
      try {
        await this.handleJoin(io, socket, roomId);
        ack({ok: true});
      } catch {
        ack({ok: false});
      }
    });

    socket.on("count", async ({roomId, userId, color, delta, seq}) => {
      const updatedMembers = await this.updateCountUseCase.execute({
        roomId,
        userId,
        color,
        delta,
      });

      io.to(roomId).emit("sync", {
        members: updatedMembers,
        templateData: null,
        meta: {sourceUserId: userId, sourceSeq: seq},
      });
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
          await this.roomUseCase.setRoomState(roomId, roomState);
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
          templateData: validColors.length > 0 ? newTemplate : {},
          members,
        };

        await this.roomUseCase.setRoomState(
          roomId,
          RoomService.membersToRecord(members)
        );

        await this.roomUseCase.update(room.id, updatedRoom);

        io.to(roomId).emit("sync", {
          members,
          templateData: updatedRoom.templateData ?? {},
          meta: null,
        });
      }
    );
  }

  private async handleJoin(
    io: Server,
    socket: Socket,
    roomId: string
  ): Promise<void> {
    try {
      const room = await this.roomUseCase.getRoom(roomId);
      if (!room) return;

      let state = await this.roomUseCase.getRoomState(roomId);
      if (state === null) {
        const membersRecord = RoomService.membersToRecord(room.members);
        await this.roomUseCase.setRoomState(roomId, membersRecord);
      }

      socket.join(roomId);

      const roomState = await this.roomUseCase.getRoomState(roomId);
      if (!roomState) return;
      const members = RoomService.recordToMembers(roomState);
      io.to(roomId).emit("sync", {
        members,
        templateData: room.templateData ?? {},
        meta: null,
      });
    } catch (error) {
      logger.error("Join error:", error);
    }
  }
}
