import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

// Define types for file and folder data
type FileType = {
  fileId: string;
  name: string;
  folderId: string;
};

// Define type for folder data
type FolderType = {
  folderId: string;
  name: string;
  outerFolderId?: string | null;
};

// Define response data type
type ResponseData = {
  folders: FolderType[];
  files: FileType[];
};

// Default API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { message: string }>
) {
  const session = await getServerSession(req, res, authOptions); // Get the session from the request
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' }); // Return unauthorized if no session found
  }

  const user = await session.user; // Extract user information from the session

  const { folderId } = req.query // Extract folderId from request query parameters
  // console.log("folderId", folderId);

  let folderQuery = {}; // Initialize an empty object to store the folder query

  if (folderId === '0') {
    // If folderId is '0', query folders and files where outerFolderId is null
    folderQuery = { outerFolderId: null };
  } else {
    // Retrieve subfolders associated with the specified folder
    folderQuery = {
      user: user,
      outerFolderId: folderId, // Filter folders by the provided folderId
    };
  }

  // Retrieve files directly associated with the specified folder
  const files = await prisma.file.findMany({
    where: {
      folderId: folderId as string, // Filter files by the provided folderId
    },
  });

  // Retrieve folders based on the query
  const folders = await prisma.folder.findMany({
    where: folderQuery,
  });

  const responseData: ResponseData = { // Define the response data object
    folders,
    files,
  };

  res.status(200).json(responseData); // Return the response data
}
