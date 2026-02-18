import {Request, Response} from "express";
import {CreateRoomUseCase} from "@/application/usecases/CreateRoomUseCase";
import {RoomUseCase} from "@/application/usecases/RoomUseCase";
import {logger} from "@/infrastructure/logging/logger";
import {GetTemplateUseCase} from "@/application/usecases/GetTemplateUseCase";

export class RoomController {
  constructor(
    private createRoomUseCase: CreateRoomUseCase,
    private getRoomUseCase: RoomUseCase,
    private getTemplateUseCase: GetTemplateUseCase
  ) {}

  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const {groupName, members} = req.body;

      const result = await this.createRoomUseCase.execute({
        groupName,
        members,
      });

      res.json(result);
    } catch (error) {
      logger.error("Create room error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "ルーム作成中にエラーが発生しました";
      res.status(400).json({error: message});
    }
  }

  async getRoom(req: Request, res: Response): Promise<void> {
    try {
      const {roomId} = req.params;
      const room = await this.getRoomUseCase.getRoom(roomId);
      res.json(room);
    } catch (error) {
      logger.error("Get room error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "ルーム情報の取得に失敗しました";
      const status = message.includes("存在しません")
        ? 404
        : message.includes("期限切れ")
          ? 410
          : 500;
      res.status(status).json({error: message});
    }
  }

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await this.getTemplateUseCase.findAll();
      res.json(templates);
    } catch (error) {
      logger.error("Get templates error:", error);
      res.status(500).json({error: "テンプレート取得に失敗しました"});
    }
  }
}
