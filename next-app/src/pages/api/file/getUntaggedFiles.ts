// /api/file/getUntaggedFiles.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const files = await prisma.fileHash.findMany({
        where: { tagged: false },
        select:{
          path: true,
          hash: true,
        }
      });

      if (!files) {
        return res.status(404).json({ error: 'No files to upload!' });
      }

      res.json(files);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
