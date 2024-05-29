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
        include: { tags: true },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (action === 'add') {
        let tag = await prisma.tag.findFirst({ where: { name: tagName } });

        if (!tag) {
          tag = await prisma.tag.create({ data: { name: tagName } });
        }
        await prisma.file.update({
          where: { fileId: file.fileId },
          data: { tags: { connect: { tagId: tag.tagId } } },
        });

        res.status(200).json(tag);
      } else if (action === 'remove') {
        const tag = await prisma.tag.findFirst({ where: { name: tagName } });

        if (!tag) {
          return res.status(404).json({ error: 'Tag not found' });
        }

        await prisma.file.update({
          where: { fileId: file.fileId },
          data: { tags: { disconnect: { tagId: tag.tagId } } },
        });

        res.status(200).json({ message: 'Tag removed' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Failed to ${action} tag` });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
