import express from 'express';
import { getAdminDb } from '../firebase.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// GET reminders
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userRef = getAdminDb().collection('users').doc(req.user.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });

    const userData = userDoc.data()!;
    const patientId = userData.role === 'patient' ? req.user.id : userData.patientId;

    if (!patientId) return res.json([]); // caretaker not linked yet

    const snapshot = await getAdminDb()
      .collection('reminders')
      .where('patientId', '==', patientId)
      .get();

    const reminders = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());

    res.json(reminders);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ ADD reminder (ONLY caretaker)
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userRef = getAdminDb().collection('users').doc(req.user.id);
    const userDoc = await userRef.get();
    const userData = userDoc.data()!;

    if (userData.role !== 'caretaker') {
      return res.status(403).json({ message: 'Only caretaker can add reminder' });
    }

    const reminderData = {
      ...req.body,
      patientId: userData.patientId,
      createdAt: new Date().toISOString()
    };

    const docRef = await getAdminDb().collection('reminders').add(reminderData);

    res.status(201).json({ id: docRef.id, ...reminderData });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE reminder (mark completed / notified)
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const reminderRef = getAdminDb().collection('reminders').doc(req.params.id);
    const reminderDoc = await reminderRef.get();

    if (!reminderDoc.exists) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Only allow these fields to be updated
    const { isCompleted, notified } = req.body;
    const updates: Record<string, boolean> = {};
    if (typeof isCompleted === 'boolean') updates.isCompleted = isCompleted;
    if (typeof notified   === 'boolean') updates.notified   = notified;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    await reminderRef.update(updates);
    const updated = await reminderRef.get();
    res.json({ id: updated.id, ...updated.data() });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;