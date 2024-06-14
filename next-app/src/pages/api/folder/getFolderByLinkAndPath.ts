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
const generateRecursiveOuterFolder = (paths, sharedFolderId) => {
  if (paths.length <= 1) { // If there is only one path left
    return {
      name: paths[0],
      outerFolderId: sharedFolderId
    };
  }
  return {
    name: paths[0],
    outerFolder: generateRecursiveOuterFolder(paths.slice(1), sharedFolderId) // Recursively generate outer folders
  };
};

export default async function handler( // Default API handler function
    req: NextApiRequest, 
    res: NextApiResponse<ResponseData | {message: string}> // Response type that includes a message string and optionally a folder
  ) {
    const session = await getServerSession(req, res, authOptions); // Retrieve the session using getServerSession with the provided authOptions
    
    // Extract linkId and path from the query
    const { pathLink }: { pathLink: string } = req.body;

    const initPath = pathLink.split('/'); // Split the pathLink by '/' to get the linkId and path

    const linkId = initPath[0];
    const path = initPath.slice(1); // Extract the linkId and path from the initPath

    // console.log("LINKID: " + linkId + ", PATH: " + initPath);

    
  const link = await prisma.link.findUnique({ // Find the link by linkId
    where: {
      path: linkId,
    },
    select: {
      folderId: true,
      fileId: true,
      canSee: true,
      file: {
        select: {
          fileId: true,
          hashFile: {
            select: {
              size: true,
            },
          },
          name: true,
        },
      },
      folder: {
        select: {
          userId: true,
        }
      }
    },
  });

  if(link.canSee == "AUTH" && !session){
    return res.status(403).json({ message: "Unauthorized" }); // Return unauthorized if no session found
  }


  if(!link || !link.folderId){
    return res.status(404).json({ message: "Link not found" }); // Return a 404 error if the link is not found
  }

  let whereQuery = {}; // Initialize an empty object to store the folder query
  // console.log(path)
  if(!path || path.length === 0){ // If path is empty
    whereQuery = {
      folderId: link.folderId // Filter folders by the provided folderId
    };
  }else{
    whereQuery = generateRecursiveOuterFolder([...path].reverse(), link.folderId); // Generate the outer folder query
  }
    
  const folder = await prisma.folder.findFirst({ // Find the folder based on the query
    select: {
      folderId: true,
      name: true,
      outerFolderId: true,
      innerFolders: {
        select: {
          folderId: true,
          name: true,
          outerFolderId: true,
        },
      },
      files: {
        select: {
          fileId: true,
          hashFile: {
            select: {
              size: true,
            },
          },
          name: true,
          user: {
            select: {
              image: true,
              name: true,
              email: true,
            },
          },
          folderId: true,
        },
      },
    },
    where: {
      ...whereQuery,
    },
  });



    // Assume we handle 'folder' being possibly null (not found)
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
  
    const updatedFiles = folder.files.map((file) => ({
      ...file,
      path: '', // Add the missing 'path' property
      dimensiune: 0, // Adjust as necessary to match actual data requirements
    }));
  
    // Return the response with folders, files, and folderId
    res.status(200).json({
      folders: folder.innerFolders,
      files: updatedFiles,
      folderId: folder.folderId,
    });
  }