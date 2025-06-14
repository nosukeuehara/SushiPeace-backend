import { Request, Response } from 'express';
import { CreateRoomUseCase } from '../../application/usecases/CreateRoomUseCase';
import { GetRoomUseCase } from '../../application/usecases/GetRoomUseCase';
import { TemplateRepository } from '../../domain/repositories/TemplateRepository';

export class RoomController {
  constructor(
    private createRoomUseCase: CreateRoomUseCase,
    private getRoomUseCase: GetRoomUseCase,
    private templateRepository: TemplateRepository
  ) { }

  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const { groupName, members, templateId } = req.body;

      if (!templateId) {
        res.status(400).json({ error: "テンプレートが選択されていません" });
        return;
      }

      const result = await this.createRoomUseCase.execute({
        groupName,
        members,
        templateId,
      });

      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ルーム作成中にエラーが発生しました";
      res.status(400).json({ error: message });
    }
  }

  async getRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const room = await this.getRoomUseCase.execute(roomId);
      res.json(room);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ルーム情報の取得に失敗しました";
      const status = message.includes('存在しません') ? 404 :
        message.includes('期限切れ') ? 410 : 500;
      res.status(status).json({ error: message });
    }
  }

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await this.templateRepository.findAll();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "テンプレート取得に失敗しました" });
    }
  }
}