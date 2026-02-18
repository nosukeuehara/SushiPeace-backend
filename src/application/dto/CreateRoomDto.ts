export interface CreateRoomDto {
  groupName: string;
  members: Array<{
    userId: string;
    name: string;
  }>;
}

export interface CreateRoomResponseDto {
  roomId: string;
  shareUrl: string;
}
