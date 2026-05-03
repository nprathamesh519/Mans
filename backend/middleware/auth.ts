import { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from '../firebase.ts';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split("Bearer ")[1];

    // ✅ VERIFY FIREBASE TOKEN
    const decodedToken = await getAdminAuth().verifyIdToken(token);

    // ✅ Attach user to request
    (req as any).user = {
      id: decodedToken.uid,
      email: decodedToken.email || null
    };

    next();

  } catch (err: any) {
    console.error("AUTH ERROR:", err);
    res.status(403).json({ message: 'Invalid token' });
  }
};