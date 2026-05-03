import express from 'express';
import { getAdminDb } from '../firebase.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// Get location for a user
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const locationDoc = await getAdminDb().collection('locations').doc(req.params.userId as string).get();
    if (!locationDoc.exists) return res.status(404).json({ message: 'Location not found' });
    res.json(locationDoc.data());
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update location
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { lat, lng } = req.body;
    const locationData = {
      userId: req.user.id,
      lat,
      lng,
      timestamp: new Date().toISOString()
    };
    await getAdminDb().collection('locations').doc(req.user.id).set(locationData, { merge: true });
    res.json(locationData);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
