type RoomState = {
  members: Record<string, {
    name: string;
    counts: Record<string, number>;
  }>;
};

export const roomStore: Record<string, RoomState> = {};
