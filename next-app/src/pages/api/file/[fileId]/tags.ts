// pages/api/file/[fileId]/tags.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action, fileId, tagName } = req.body;

    if (!action || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    try {
      const file = await prisma.file.findUnique({
        where: { fileId: String(fileId) },
        include: { hashFile: { include: { tags: true } } },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (action === 'add') {
        let tag = await prisma.tag.findUnique({ where: { name: tagName } });

        if (!tag) {
          tag = await prisma.tag.create({ data: { name: tagName } });
        }

        await prisma.fileHash.update({
          where: { hash: file.hash },
          data: { tags: { connect: { tagId: tag.tagId } } },
        });

        res.json(tag);
      } else if (action === 'remove') {
        const tag = await prisma.tag.findUnique({ where: { name: tagName } });

        if (!tag) {
          return res.status(404).json({ error: 'Tag not found' });
        }

        await prisma.fileHash.update({
          where: { hash: file.hash },
          data: { tags: { disconnect: { tagId: tag.tagId } } },
        });

        res.json({ message: 'Tag removed' });
      }
    } catch (error) {
      res.status(500).json({ error: `Failed to ${action} tag` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
