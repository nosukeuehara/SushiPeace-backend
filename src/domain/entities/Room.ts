export interface Room {
  id: string;
  groupName: string;
  members: Member[];
  templateData?: Record<string, number>;
  createdAt: Date;
}

export interface Member {
  userId: string;
  name: string;
  counts: Record<string, number>;
}
