// /api/file/getUntaggedFiles.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { hash, tags }: {hash: string, tags: string[]} = req.body;
    try {
      const fileHash = await prisma.fileHash.update({
        where: { hash: hash },
        data: {
          tagged: true,
          tags: {
            connectOrCreate: tags.map(tag => ({
              where: { name: tag },
              create: { name: tag },
            })),
          }
        },
        include: { files: true },
      });

      if (!fileHash) {
        return res.status(404).json({ error: 'No fileHash found!' });
      }

      await prisma.file.findFirst({
        where: {
          fileId: { in: fileHash.files.map(file => file.fileId) }
        },
        include: { tags: true },
      }
      )

      for(const file of fileHash.files) {
        await prisma.file.update({
          where: { fileId: file.fileId },
          data: {
            tags: {
              connect: tags.map(tag => ({ name: tag }))
            }
          }
        });
      }

      res.status(200).json({ error: 'Ok!' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
