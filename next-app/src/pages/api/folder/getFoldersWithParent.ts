import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Define type for folder data
type FolderType = {
  folderId: string;
  name: string;
  outerFolderId?: string | null;
};

// Define response data type
type ResponseData = {
  folders: FolderType[];
};

// Default API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | {message: string}> // Response type that includes a message string and optionally a folder
) {
  const session = await getServerSession(req, res, authOptions); // Retrieve the session using getServerSession with the provided authOptions
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' }); // Return unauthorized if no session found
  }

  const user = await session.user; // Extract user information from the session
  
  const { parent } = req.body; // Extract parent folder id from request body

  const folders = await prisma.folder.findMany({ // Retrieve all folders associated with the user
    select: {
        folderId: true,
        name: true,
        innerFolders: {
          select: {
            folderId: true,
            name: true,
          }
        }
    },
    where: {
      userId: user.id,
      outerFolderId: parent //parent folder id
    },
  });
  // console.log(folders);
  // Return the list of users
  if (folders.length > 0) {
    res.status(200).json({ folders });
  } else {
    res.status(200).json({ folders: [] }); // Return an empty array if no users found
  }

}
