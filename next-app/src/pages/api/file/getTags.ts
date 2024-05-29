// pages/api/file/getTags.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fileId } = req.query;

  if (req.method === 'GET') {
    try {
      const file = await prisma.file.findUnique({
        where: { fileId: String(fileId) },
        include: { tags: true },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json(file.tags);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
