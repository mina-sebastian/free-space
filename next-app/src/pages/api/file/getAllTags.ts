// pages/api/file/getAllTags.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const tags = await prisma.tag.findMany({
        select: {
          name: true,
        },
      });

      res.json(tags);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all tags' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
