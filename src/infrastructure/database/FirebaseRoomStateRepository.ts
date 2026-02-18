import {Firestore} from "firebase-admin/firestore";
import {Member} from "@/domain/entities/Room";
import {RoomStateRepository} from "@/domain/repositories/RoomStateRepository";

export class FirebaseRoomStateRepository implements RoomStateRepository {
  constructor(private db: Firestore) {}

  async getRoomState(roomId: string): Promise<Record<string, Member> | null> {
    try {
      const docRef = this.db
        .collection("rooms")
        .doc(roomId)
        .collection("state")
        .doc("members");
      const snap = await docRef.get();
      if (!snap.exists) return null;
      return snap.data() as Record<string, Member>;
    } catch (error) {
      console.error(
        "[FirestoreRoomStateRepository] getRoomState error:",
        error
      );
      return null;
    }
  }

  async setRoomState(
    roomId: string,
    members: Record<string, Member>
  ): Promise<void> {
    try {
      const docRef = this.db
        .collection("rooms")
        .doc(roomId)
        .collection("state")
        .doc("members");
      await docRef.set(members, {merge: true});
    } catch (error) {
      console.error(
        "[FirestoreRoomStateRepository] setRoomState error:",
        error
      );
    }
  }

  async updateMemberCount(
    roomId: string,
    userId: string,
    color: string,
    count: number
  ): Promise<Record<string, Member> | void> {
    try {
      const state = await this.getRoomState(roomId);
      if (!state) return;

      if (!state[userId]) {
        state[userId] = {userId: userId, counts: {}} as Member;
      }

      state[userId].counts[color] = count;
      await this.setRoomState(roomId, state);

      return state;
    } catch (error) {
      console.error(
        "[FirestoreRoomStateRepository] updateMemberCount error:",
        error
      );
    }
  }
}
