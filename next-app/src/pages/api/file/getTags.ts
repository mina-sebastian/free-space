// pages/api/file/getTags.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';

// Default API handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fileId } = req.query; // Extract fileId from query parameters

  // Check if the request method is GET
  if (req.method === 'GET') {
    try {
      // Attempt to find the file by fileId and include its associated tags using Prisma
      const file = await prisma.file.findUnique({
        where: { fileId: String(fileId) },
        include: { tags: true }, // Include tags associated with the file
      });

      // If file is not found, return a 404 error response
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Return the tags associated with the file as a JSON response
      res.json(file.tags);
    } catch (error) {
      // Handle errors during database operation
      res.status(500).json({ error: 'Failed to fetch tags' }); // Return a 500 error response with a specific message
    }
  } else {
    // If the request method is not GET, set appropriate headers and return a 405 error response
    res.setHeader('Allow', ['GET']); // Set 'Allow' header to indicate that only GET method is allowed
    res.status(405).end(`Method ${req.method} Not Allowed`); // Return a 405 error with details of the disallowed method
  }
}