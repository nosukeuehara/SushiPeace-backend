import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({
    credential:
      process.env.NODE_ENV === "production"
        ? applicationDefault()
        : cert(require("../../../serviceAccountKey.json")),
  });
}

export const db = getFirestore();
