import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { fileId } = req.query; // Extract fileId from request query parameters
  const { newName } = req.body; // Extract the new file name from the request body

  console.log('fileId', fileId), console.log('newName', newName);
  try {
    // Update the folder name in the database
    await prisma.file.update({
      where: {
        fileId: fileId, // Filter files by the provided fileId
      },
      data: {
        name: newName,
      },
    });

    res.status(200).json({ message: 'File name updated successfully' });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
