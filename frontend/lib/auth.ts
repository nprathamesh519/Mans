import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export const registerUser = async (
  email: string,
  password: string,
  extraData: any = {}
) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;

  const userData = {
    id: uid,
    email,
    name: extraData.name || "",
    role: extraData.role || "patient",
    patientCode: extraData.patientCode || null,
    patientId: extraData.patientId || null,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "users", uid), userData);

  const token = await userCred.user.getIdToken();
  localStorage.setItem("token", token);

  return { user: userData };
};
