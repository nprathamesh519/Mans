import express from 'express';
import { getAdminAuth, getAdminDb } from '../firebase.ts';

const router = express.Router();

// ================= REGISTER =================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, patientId, patientCode } = req.body;

    const userRecord = await getAdminAuth().createUser({
      email,
      password,
      displayName: name
    });

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
router.post('/login', async (req, res) => {
  res.json({
    message: "Login handled on frontend using Firebase Client SDK"
  });
});

export default router;