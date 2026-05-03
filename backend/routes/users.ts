import express from 'express';
import { getAdminDb } from '../firebase.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();


// =============================
// ✅ GET CURRENT USER PROFILE
// =============================
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const userRef = getAdminDb().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const data = userDoc.data();

    res.json({
      id: userDoc.id,
      name: data?.name || "Unknown",
      email: data?.email || null,
      role: data?.role || null,
      patientId: data?.patientId || null
    });

  } catch (err: any) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// =============================
// ✅ FIND PATIENT BY CODE
// =============================
router.get('/find-patient/:code', authenticateToken, async (req, res) => {
  try {
    const rawCode = req.params.code;

    if (!rawCode || Array.isArray(rawCode)) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    const code = rawCode.toUpperCase();

    const usersRef = getAdminDb().collection('users');

    const querySnapshot = await usersRef
      .where('patientCode', '==', code)
      .where('role', '==', 'patient')
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    res.json({
      id: doc.id,
      name: data?.name || "Unknown",
      email: data?.email || null,
      role: data?.role || "patient",
      patientId: data?.patientId || null
    });

  } catch (err: any) {
    console.error("FIND PATIENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// =============================
// ✅ LINK PATIENT TO CARETAKER
// =============================
router.put('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { name, patientId } = req.body;

    const userRef = getAdminDb().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates: any = {};

    if (name) updates.name = name;

    if (patientId !== undefined) {
      if (typeof patientId !== 'string' || !patientId.trim()) {
        return res.status(400).json({ message: 'Invalid patientId' });
      }
      updates.patientId = patientId;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    await userRef.update(updates);

    const updatedDoc = await userRef.get();
    const data = updatedDoc.data();

    res.json({
      id: updatedDoc.id,
      name: data?.name || "Unknown",
      email: data?.email || null,
      role: data?.role || null,
      patientId: data?.patientId || null
    });

  } catch (err: any) {
    console.error("LINK ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// =============================
// ✅ GET USER BY ID (FIXED)
// =============================
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const id = req.params.id;

    const userRef = getAdminDb().collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const data = userDoc.data();

    res.json({
      id: userDoc.id,
      name: data?.name || "Unknown",
      email: data?.email || null,
      role: data?.role || null,
      patientId: data?.patientId || null
    });

  } catch (err: any) {
    console.error("GET USER BY ID ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;