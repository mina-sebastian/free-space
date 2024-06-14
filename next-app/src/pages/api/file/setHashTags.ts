// /api/file/getUntaggedFiles.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';

// Default API handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { hash, tags }: {hash: string, tags: string[]} = req.body; // Extract hash and tags from request body
    try {
      const fileHash = await prisma.fileHash.update({ // Update the fileHash entry with the provided hash
        where: { hash: hash },
        data: {
          tagged: true,
          tags: {
            connectOrCreate: tags.map(tag => ({ // Connect or create tags for the fileHash entry
              where: { name: tag },
              create: { name: tag }, // Create the tag if it doesn't exist
            })),
          }
        },
        include: { files: true }, // Include the files associated with the fileHash entry
      });

      if (!fileHash) { // Check if the fileHash entry is not found
        return res.status(404).json({ error: 'No fileHash found!' }); // Return a 404 error response
      }

      await prisma.file.findFirst({ // Find the files associated with the fileHash entry
        where: {
          fileId: { in: fileHash.files.map(file => file.fileId) } // Filter files by fileId
        },
        include: { tags: true },
      }
      )

      for(const file of fileHash.files) { // Iterate over each file associated with the fileHash entry
        await prisma.file.update({ // Update the file with the provided fileId
          where: { fileId: file.fileId },
          data: {
            tags: {
              connect: tags.map(tag => ({ name: tag })) // Connect the tags to the file
            }
          }
        });
      }

      res.status(200).json({ error: 'Ok!' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to fetch files' }); // Return a 500 error response with a specific message
    }
  } else {
    res.setHeader('Allow', ['POST']); // Set 'Allow' header to indicate that only POST method is allowed
    res.status(405).end(`Method ${req.method} Not Allowed`); // Return a 405 error with details of the disallowed method
  }
}
