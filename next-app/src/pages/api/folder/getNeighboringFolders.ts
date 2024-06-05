import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async (req, res) => {
  const { folderId } = req.query;

  if (!folderId) {
    return res.status(400).json({ error: 'Folder ID is required' });
  }

  try {
    const folder = await prisma.folder.findUnique({
      where: { folderId },
      include: { outerFolder: true }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const parentFolderId = folder.outerFolderId;
    const neighboringFolders = await prisma.folder.findMany({
      where: {
        outerFolderId: parentFolderId
      }
    });

    const specialFolders = await prisma.folder.findMany({
      where: {
        name: { in: ['Home', 'Bin'] }
      }
    });

    const result = [...neighboringFolders.filter(f => f.folderId !== folderId), ...specialFolders];

    res.json({ folders: result });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
