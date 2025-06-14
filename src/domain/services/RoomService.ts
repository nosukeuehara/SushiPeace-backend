import { Member } from '../entities/Room';
import { PlateTemplate } from '../entities/PlateTemplate';

export class RoomService {
  static createInitialCounts(template: PlateTemplate): Record<string, number> {
    return Object.keys(template.prices).reduce((acc, color) => {
      acc[color] = 0;
      return acc;
    }, {} as Record<string, number>);
  }

  static isRoomExpired(createdAt: Date, hoursLimit: number = 2): boolean {
    const now = new Date();
    const limitMs = hoursLimit * 60 * 60 * 1000;
    return now.getTime() - createdAt.getTime() > limitMs;
  }

  static membersToRecord(members: Member[]): Record<string, Member> {
    return Object.fromEntries(
      members.map(member => [member.userId, member])
    );
  }

  static recordToMembers(record: Record<string, Member>): Member[] {
    return Object.entries(record).map(([userId, member]) => ({
      ...member,
      userId,
    }));
  }
}