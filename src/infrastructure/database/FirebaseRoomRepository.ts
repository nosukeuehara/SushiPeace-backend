import { Firestore } from 'firebase-admin/firestore';
import { Room } from '../../domain/entities/Room';
import { RoomRepository } from '../../domain/repositories/RoomRepository';

export class FirebaseRoomRepository implements RoomRepository {
  constructor(private db: Firestore) { }

  async create(room: Room): Promise<void> {
    await this.db.collection('rooms').doc(room.id).set({
      groupName: room.groupName,
      members: room.members,
      templateId: room.templateId,
      createdAt: room.createdAt,
    });
  }

  async findById(id: string): Promise<Room | null> {
    const doc = await this.db.collection('rooms').doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    return {
      id,
      groupName: data.groupName,
      members: data.members || [],
      templateId: data.templateId,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }

  async update(id: string, room: Partial<Room>): Promise<void> {
    const updateData: any = { ...room };
    if (updateData.createdAt) {
      // Firestoreの場合、Dateオブジェクトをそのまま渡す
    }
    await this.db.collection('rooms').doc(id).update(updateData);
  }

  async delete(id: string): Promise<void> {
    await this.db.collection('rooms').doc(id).delete();
  }
}