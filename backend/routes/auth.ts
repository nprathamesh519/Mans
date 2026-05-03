import express from 'express';
import { getAdminAuth, getAdminDb } from '../firebase.ts';

const router = express.Router();

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, patientId, patientCode } = req.body;

    // 🔹 Create user using Firebase Admin
    const userRecord = await getAdminAuth().createUser({
      email,
      password,
      displayName: name
    });

    // 🔹 Save extra data in Firestore
    const userData = {
      id: userRecord.uid,
      name,
      email,
      role,
      patientId: patientId || null,
      patientCode: patientCode || null,
      createdAt: new Date().toISOString()
    };

    await getAdminDb().collection('users').doc(userRecord.uid).set(userData);

    // 🔹 Send success response (NO login here)
    res.status(201).json({
      message: "User registered successfully",
      user: userData
    });

  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// ================= LOGIN =================
// ⚠️ Login should be handled in FRONTEND using Firebase Client SDK
router.post('/login', async (req, res) => {
  try {
    res.json({
      message: "Login handled on frontend using Firebase Client SDK"
    });
  } catch (err: any) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;