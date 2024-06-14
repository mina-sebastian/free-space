// pages/api/file/[fileId]/tags.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';

// API handler to add or remove tags from a file
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action, fileId, tagNameConst } = req.body; // Extract action, fileId, and tagName from the request body

    // Remove all special characters and convert to lowercase
    const tagName = tagNameConst.toLowerCase().replace(/[^a-z]/g, '').trim();

    if (!action || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' }); // Check if the action is invalid
    }

    try {
      const file = await prisma.file.findUnique({ // Find the file by fileId
        where: { fileId: String(fileId) },
        include: { tags: true },
      });

      if (!file) {
        return res.status(404).json({ error: 'File not found' }); // Check if the file exists
      }

      if (action === 'add') {
        let tag = await prisma.tag.findFirst({ where: { name: tagName } }); // Find the tag by name

        if (!tag) {
          tag = await prisma.tag.create({ data: { name: tagName } }); // Create the tag if it doesn't exist
        }
        await prisma.file.update({ // Update the file with the new tag
          where: { fileId: file.fileId },
          data: { tags: { connect: { name: tag.name } } }, // Connect the tag to the file
        });

        res.status(200).json(tag); // Return the tag
      } else if (action === 'remove') { // Check if the action is remove
        const tag = await prisma.tag.findFirst({ where: { name: tagName } }); // Find the tag by name

        if (!tag) {
          return res.status(404).json({ error: 'Tag not found' }); // Check if the tag exists
        }

        await prisma.file.update({
          where: { fileId: file.fileId },
          data: { tags: { disconnect: { name: tag.name } } }, // Disconnect the tag from the file
        });

        res.status(200).json({ message: 'Tag removed' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: `Failed to ${action} tag` }); // Return an error response
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`); // Return a method not allowed error
  }
}
