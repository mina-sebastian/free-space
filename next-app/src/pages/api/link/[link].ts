// pages/api/link/[link].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from "../../../../libs/prismadb";

// Define response data type
type ApiResponse = {
  data?: any;
  error?: string;
}

// Default API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse> // Response data type definition
) {
  const { link } = req.query; // Extract link from request query parameters

  if (!link) {
    return res.status(400).json({ error: 'Link parameter is required' }); // Return a 400 error if link is not provided
  }

  try {
    const linkData = await prisma.link.findUnique({ // Retrieve link data from the database
      where: { path: link as string }, // Filter links by the provided link
      include: {
        file: {
          select: {
            fileId: true,
            name: true,
            hashFile: {
              select: {
                size: true
              }
            },
            folder: true,
          }
        },
        folder: {
          include: {
            files: true,
            innerFolders: true
          }
        }
      }
    });

    if (!linkData) {
      return res.status(404).json({ error: 'Link not found' }); // Return a 404 error if the link is not found
    }

    if (linkData.expires && new Date() > linkData.expires) {
      return res.status(403).json({ error: 'Link expired' }); // Return a 403 error if the link has expired
    }

    console.log(linkData);

    if(linkData.file){
      res.redirect(`/v/${linkData.fileId}`); // Redirect to the file view page
    }
    else if(linkData.folder){
        res.redirect(`/l/${linkData.path}`); // Redirect to the folder view page
    }
   
  } catch (error) {
    console.error('Database or server error:', error);
    res.status(500).json({ error: 'Internal server error' }); // Return a 500 error response with a specific message
  }
}
