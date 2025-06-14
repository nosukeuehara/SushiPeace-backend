export interface Room {
  id: string;
  groupName: string;
  members: Member[];
  templateId: string;
  createdAt: Date;
}

export interface Member {
  userId: string;
  name: string;
  counts: Record<string, number>;
}