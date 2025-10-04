export type RoomId = string;
export type UserId = string;
export type Color = string;
export type Prices = Record<string, number>;

export interface JoinEvent {
  roomId: RoomId;
  userId: UserId;
}

export interface CountEvent {
  roomId: RoomId;
  userId: UserId;
  color: Color;
  remove: boolean;
}

export interface UpdateTemplateEvent {
  roomId: RoomId;
  prices: Prices;
}

export const EventNames = {
  join: "join",
  count: "count",
  updateTemplate: "updateTemplate",
} as const;
export type EventTypes = keyof typeof EventNames;

export interface ClientToServerEvents {
  join: (payload: JoinEvent) => void;
  count: (payload: CountEvent) => void;
  updateTemplate: (payload: UpdateTemplateEvent) => void;
}

export interface ServerToClientEvents {
  sync: (payload: {
    members: Array<{
      userId: UserId;
      name: string;
      counts: Record<Color, number>;
    }>;
    prices?: Prices;
    version?: number;
  }) => void;
  errorMessage: (msg: string) => void;
}

export interface InterServerEvents {}
export interface SocketData {
  userId?: UserId;
  roomId?: RoomId;
}
