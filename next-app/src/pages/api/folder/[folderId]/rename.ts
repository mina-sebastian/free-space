import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

// API handler to rename a folder
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }> // Response data type definition
) {
  const session = await getServerSession(req, res, authOptions); // Get the session from the request
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' }); // Return unauthorized if no session found
  }

  const { folderId } = req.query; // Extract folderId from request query parameters
  const { newName } = req.body; // Extract the new folder name from the request body

  console.log('folderId', folderId), console.log('newName', newName);
  try {
    // Update the folder name in the database
    await prisma.folder.update({
      where: {
        folderId: folderId as string, // Filter folders by the provided folderId
      },
      data: {
        name: newName,
      },
    });

    res.status(200).json({ message: 'Folder name updated successfully' }); // Respond with a success message
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ message: 'Internal Server Error' }); // Return a 500 error response with a specific message
  }
}
