import type { Request, Response } from 'express';
import { prisma } from '../src/db/prisma';

/**
 * GET: Fetch existing user profile along with health conditions
 */
export const getUserProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID missing from token.' });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { 
        healthConditions: true, // Includes related health conditions so front-end forms can pre-fill
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found. Please create one.' });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const upsertUserProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId; // Provided by the auth middleware
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { weightKg, heightCm, allergies, healthConditions } = req.body;

    // Perform database upsert using Prisma
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: {
        weightKg,
        heightCm,
        allergies: allergies || [],
        healthConditions: {
          deleteMany: {},
          create: healthConditions || [],
        },
      },
      create: {
        userId,
        weightKg,
        heightCm,
        allergies: allergies || [],
        healthConditions: {
          create: healthConditions || [],
        },
      },
      include: { healthConditions: true },
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

