import express from 'express';
import { getAdminDb } from '../firebase.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// ==========================
// GET MEMORIES
// ==========================
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userRef = getAdminDb().collection('users').doc(req.user.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });

    const userData = userDoc.data()!;
    const patientId = userData.role === 'patient' ? req.user.id : userData.patientId;

    // Return empty array instead of 500 if no patient linked
    if (!patientId) return res.json([]);

    const snapshot = await getAdminDb()
      .collection('memories')
      .where('patientId', '==', patientId)
      .get();

    const memories = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      });

    res.json(memories);
  } catch (err: any) {
    console.error('GET MEMORY ERROR:', err.message);
    // If index missing, return empty array instead of crashing
    if (err.code === 9 || (err.message && err.message.includes('index'))) {
      return res.json([]);
    }
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// ADD MEMORY — base64 image stored in Firestore
// ==========================
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userRef = getAdminDb().collection('users').doc(req.user.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });

    const userData = userDoc.data()!;
    const patientId = userData.role === 'patient' ? req.user.id : userData.patientId;

    if (!patientId) return res.status(400).json({ message: 'No patient linked' });

    const { title, description, date, imageUrl } = req.body;

    const memoryData = {
      title,
      description,
      date: date || new Date().toISOString(),
      patientId,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString()
    };

    const docRef = await getAdminDb().collection('memories').add(memoryData);
    res.status(201).json({ id: docRef.id, ...memoryData });

  } catch (err: any) {
    console.error('ADD MEMORY ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// UPDATE MEMORY
// ==========================
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const id = req.params.id as string;
    const { title, description, date, imageUrl } = req.body;
    const updates: any = {};
    if (title !== undefined)       updates.title       = title;
    if (description !== undefined) updates.description = description;
    if (date !== undefined)        updates.date        = date;
    if (imageUrl !== undefined)    updates.imageUrl    = imageUrl;

    const ref = getAdminDb().collection('memories').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    // Use set with merge so partial updates always work
    await ref.set(updates, { merge: true });
    const updated = await ref.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err: any) {
    console.error('UPDATE MEMORY ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// DELETE MEMORY
// ==========================
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const id = req.params.id as string;
    if (!id) return res.status(400).json({ message: 'Invalid memory id' });
    await getAdminDb().collection('memories').doc(id).delete();
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    console.error('DELETE MEMORY ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;