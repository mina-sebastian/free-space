// pages/api/file/getAllTags.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';

// Default API handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if the request method is GET
  if (req.method === 'GET') {
    try {
      // Fetch all tags from the database using Prisma
      const tags = await prisma.tag.findMany({
        select: {
          name: true, // Select only the 'name' field of each tag
        },
      });

      // Return the fetched tags as a JSON response
      res.json(tags);
    } catch (error) {
      // Handle errors during database operation
      res.status(500).json({ error: 'Failed to fetch all tags' }); // Return a 500 error response with a specific message
    }
  } else {
    // If the request method is not GET, set appropriate headers and return a 405 error response
    res.setHeader('Allow', ['GET']); // Set 'Allow' header to indicate that only GET method is allowed
    res.status(405).end(`Method ${req.method} Not Allowed`); // Return a 405 error with details of the disallowed method
  }
}