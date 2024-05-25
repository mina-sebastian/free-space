import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { fileIds, destinationFolderId } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0 || !destinationFolderId) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  try {
    // Move each file to the destination folder
    for (const fileId of fileIds) {
      await prisma.file.update({
        where: { fileId },
        data: { folderId: destinationFolderId },
      });
    }

    res.status(200).json({ message: 'Files moved successfully' });
  } catch (error) {
    console.error('Error moving files:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
