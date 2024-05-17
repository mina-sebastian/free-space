import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { Folder } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string, folder?: Folder }>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id; // Extract userId from session
  
  const { folderId } = req.query; // Extract folderId from request query parameters
  const { newName } = req.body; // Extract the new folder name from the request body

  console.log('userId', userId), console.log('folderId', folderId), console.log('name', newName);
  try {
    const newFolder = await prisma.folder.create({
      data: {
        name: newName,
        userId: userId,
        outerFolderId: folderId !== '0' ? folderId as string : null
      }
    });

    res.status(200).json({ message: 'Folder created successfully', folder: newFolder });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
