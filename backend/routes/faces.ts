import express from 'express';
import { getAdminDb } from '../firebase.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// 🔥 Helper to safely get userData
const getUserData = async (userId: string) => {
  const userRef = getAdminDb().collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const userData = userDoc.data();

  if (!userData) {
    throw new Error("User data missing");
  }

  return userData;
};

// =============================
// ✅ GET ALL FACES
// =============================
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userData = await getUserData(req.user.id);

    let patientId = userData.patientId;

    // ✅ If patient → use own ID
    if (userData.role === 'patient') {
      patientId = req.user.id;
    }

    if (!patientId) {
      return res.status(400).json({ message: "No patient linked" });
    }

    const querySnapshot = await getAdminDb()
      .collection('faces')
      .where('patientId', '==', patientId)
      .get();

    const faces = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(faces);

  } catch (err: any) {
    console.error("GET FACES ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// =============================
// ✅ ADD FACE (ONLY CARETAKER)
// =============================
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userData = await getUserData(req.user.id);

    // ❌ Block patient
    if (userData.role !== 'caretaker') {
      return res.status(403).json({ message: "Only caretaker can add faces" });
    }

    if (!userData.patientId) {
      return res.status(400).json({ message: "No patient linked" });
    }

    const faceData = {
      ...req.body,
      patientId: userData.patientId,
      createdAt: new Date().toISOString()
    };

    const docRef = await getAdminDb().collection('faces').add(faceData);

    res.status(201).json({
      id: docRef.id,
      ...faceData
    });

  } catch (err: any) {
    console.error("ADD FACE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// =============================
// ✅ UPDATE FACE
// =============================
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userData = await getUserData(req.user.id);

    const faceRef = getAdminDb().collection('faces').doc(req.params.id);
    const faceDoc = await faceRef.get();

    if (!faceDoc.exists) {
      return res.status(404).json({ message: "Face not found" });
    }

    const faceData = faceDoc.data();

    // 🔐 Security check
    if (faceData?.patientId !== userData.patientId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await faceRef.update(req.body);

    const updatedDoc = await faceRef.get();

    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });

  } catch (err: any) {
    console.error("UPDATE FACE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// =============================
// ✅ DELETE FACE
// =============================
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userData = await getUserData(req.user.id);

    const faceRef = getAdminDb().collection('faces').doc(req.params.id);
    const faceDoc = await faceRef.get();

    if (!faceDoc.exists) {
      return res.status(404).json({ message: "Face not found" });
    }

    const faceData = faceDoc.data();

    if (faceData?.patientId !== userData.patientId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await faceRef.delete();

    res.json({ message: "Face deleted" });

  } catch (err: any) {
    console.error("DELETE FACE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;