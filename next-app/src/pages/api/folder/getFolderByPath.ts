import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Define types for file and folder data
type FolderType = {
  folderId: string;
  name: string;
  outerFolderId?: string | null;
};

// Define type for file data
type FileType = {
  path: string;
  user: {
      image: string;
      name: string;
      email: string;
  };
  folderId: string;
  fileId: string;
  hashFile: {
      size: number;
  };
  name: string;
  dimensiune: number;
};

// Define response data type
type ResponseData = {
  folders: FolderType[];
  files: FileType[];
  folderId: string;
};

//generate a recursive folder where name = path[i]
const generateRecursiveOuterFolder = (paths: string[]) => {
    if(paths.length <= 1){
        return {
            name: paths[0],
            outerFolder: null // If there is only one path left
        };
    }

    return {
        name: paths[0],
        outerFolder: generateRecursiveOuterFolder(paths.slice(1)) // Recursively generate outer folders
    }
}


export default async function handler( // Default API handler function
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | {message: string}> // Response type that includes a message string and optionally a folder
) {
  const session = await getServerSession(req, res, authOptions); // Retrieve the session using getServerSession with the provided authOptions
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' }); // Return unauthorized if no session found
  }

  

  const user = await session.user; // Extract user information from the session
  
  //path is like "/folder1/folder2/folder3"
  const { path }: {path: string|string[]} = req.body; // Extract path from the request body
  // console.log("path", path);

  let whereQuery = {}; // Initialize an empty object to store the folder query

  if (typeof path === 'string') { // If path is a string
    whereQuery = {
      name: path,
      outerFolderId: null
    };
  } else {
    const pathArray = Array.isArray(path) ? path : [path]; // Convert path to an array if it is not already
    whereQuery = generateRecursiveOuterFolder(pathArray.reverse()); // Generate the recursive outer folder based on the path
  }
  // console.log("query", whereQuery);
    const folder = await prisma.folder.findFirst({ // Retrieve the folder based on the query
      select: {
          folderId: true,
          name: true, 
          outerFolderId: true,
          innerFolders: {
            select: {
              folderId: true,
              name: true,
              outerFolderId: true
            },
          },
          files: {
            select: {
              fileId: true,
              hashFile:{
                select:{
                  size: true
                }
              },
              name: true,
              user:{
                select:{
                  image: true,
                  name: true,
                  email: true,
                }
              },
              folderId: true
            }
          }
      },
      where: {
        user: user,
        ...whereQuery
      },
    });
  // console.log("FILES:", folder.files);

  const updatedFiles = folder.files.map((file) => ({ // Map the files to include the missing 'path' and 'dimensiune' properties
    ...file,
    path: '', // Add the missing 'path' property
    dimensiune: 0, // Add the missing 'dimensiune' property
  }));

  // Return the list of users
  res.status(200).json({
    folders: folder.innerFolders,
    files: updatedFiles,
    folderId: folder.folderId,
  });
}
