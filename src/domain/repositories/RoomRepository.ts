import { Room } from '../entities/Room';

export interface RoomRepository {
  create(room: Room): Promise<void>;
  findById(id: string): Promise<Room | null>;
  update(id: string, room: Partial<Room>): Promise<void>;
  delete(id: string): Promise<void>;
}