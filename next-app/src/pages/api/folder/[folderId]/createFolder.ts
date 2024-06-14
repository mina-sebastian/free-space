import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { Folder } from '@prisma/client';

// Default API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string, folder?: Folder }> // Response type that includes a message string and optionally a folder
) {
  // Retrieve the session using getServerSession with the provided authOptions
  const session = await getServerSession(req, res, authOptions);
  
  // Check if session exists; if not, return unauthorized
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract userId from session
  const userId = session.user.id;

  // Extract folderId from request query parameters and newName from request body
  const { folderId } = req.query;
  const { newName } = req.body;

  // Log userId, folderId, and newName for debugging purposes
  console.log('userId', userId);
  console.log('folderId', folderId);
  console.log('name', newName);

  try {
    // Create a new folder in the database
    const newFolder = await prisma.folder.create({
      data: {
        name: newName,
        userId: userId,
        outerFolderId: folderId !== '0' ? folderId as string : null // Set outerFolderId based on folderId; null if folderId is '0'
      }
    });

    // Respond with a success message and the created folder object
    res.status(200).json({ message: 'Folder created successfully', folder: newFolder });
  } catch (error) {
    console.error('Error creating folder:', error); // Log any errors that occur during folder creation
    res.status(500).json({ message: 'Internal Server Error' }); // Return a 500 error response with a specific message
  }
}

