import express from 'express';
import { getAdminDb } from '../firebase.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// Get all alerts for a user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const ownerId = req.query.ownerId || req.user.id;
    const querySnapshot = await getAdminDb()
      .collection('alerts')
      .where('ownerId', '==', ownerId)
      .get();

    const alerts = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Add an alert
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const alertData = {
      ...req.body,
      ownerId: req.user.id,
      timestamp: new Date().toISOString()
    };
    const docRef = await getAdminDb().collection('alerts').add(alertData);
    res.status(201).json({ id: docRef.id, ...alertData });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update an alert (e.g. mark as read)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const alertRef = getAdminDb().collection('alerts').doc(req.params.id as string);
    await alertRef.update(req.body);
    const updatedDoc = await alertRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
