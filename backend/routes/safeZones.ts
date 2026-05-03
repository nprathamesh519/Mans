import express from 'express';
import { getAdminDb } from '../firebase.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// Get all safe zones for a user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const ownerId = req.query.ownerId || req.user.id;
    const zonesRef = getAdminDb().collection('safeZones');
    const q = zonesRef.where('ownerId', '==', ownerId);
    const querySnapshot = await q.get();
    
    const zones = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(zones);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Add a safe zone
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const zoneData = {
      ...req.body,
      ownerId: req.user.id,
      createdAt: new Date().toISOString()
    };
    const docRef = await getAdminDb().collection('safeZones').add(zoneData);
    res.status(201).json({ id: docRef.id, ...zoneData });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update a safe zone
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const zoneRef = getAdminDb().collection('safeZones').doc(req.params.id as string);
    await zoneRef.update(req.body);
    const updatedDoc = await zoneRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a safe zone
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await getAdminDb().collection('safeZones').doc(req.params.id as string).delete();
    res.json({ message: 'Safe zone deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
