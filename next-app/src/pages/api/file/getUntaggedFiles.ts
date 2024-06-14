// /api/file/getUntaggedFiles.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';

// Default API handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if the request method is GET
  if (req.method === 'GET') {
    try {
      // Attempt to find files that are not tagged (tagged: false) in fileHash table using Prisma
      const files = await prisma.fileHash.findMany({
        where: { tagged: false }, // Filter files where tagged is false
        select: {
          path: true, // Select the 'path' field of each file
          hash: true, // Select the 'hash' field of each file
        }
      });

      // If no files are found, return a 404 error response
      if (!files || files.length === 0) {
        return res.status(404).json({ error: 'No untagged files found' });
      }

      // Return the found files as a JSON response
      res.json(files);
    } catch (error) {
      console.log(error); // Log any errors that occur during database operation
      res.status(500).json({ error: 'Failed to fetch files' }); // Return a 500 error response with a specific message
    }
  } else {
    // If the request method is not GET, set appropriate headers and return a 405 error response
    res.setHeader('Allow', ['GET']); // Set 'Allow' header to indicate that only GET method is allowed
    res.status(405).end(`Method ${req.method} Not Allowed`); // Return a 405 error with details of the disallowed method
  }
}
