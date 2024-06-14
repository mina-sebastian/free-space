import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Default API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }> // Response type that includes a message string
) {
  // Retrieve the session using getServerSession with the provided authOptions
  const session = await getServerSession(req, res, authOptions);
  
  // Check if session exists and contains a user object; if not, return unauthorized
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract fileIds and destinationFolderId from request body
  const { fileIds, destinationFolderId } = req.body;

  // Validate request parameters: fileIds must be an array with at least one element, and destinationFolderId must exist
  if (!Array.isArray(fileIds) || fileIds.length === 0 || !destinationFolderId) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  try {
    // Iterate over each fileId and update its folderId to destinationFolderId in the database
    for (const fileId of fileIds) {
      await prisma.file.update({
        where: { fileId },
        data: { folderId: destinationFolderId },
      });
    }

    // Respond with a success message if all updates were successful
    res.status(200).json({ message: 'Files moved successfully' });
  } catch (error) {
    console.error('Error moving files:', error); // Log any errors that occur during the file moving process
    res.status(500).json({ message: 'Internal Server Error' }); // Return a 500 error response with a specific message
  }
}