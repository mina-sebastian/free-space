import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';


type FolderType = {
  folderId: string;
  name: string;
  outerFolderId?: string | null;
};

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

type ResponseData = {
  folders: FolderType[];
  files: FileType[];
  folderId: string;
};

//generate a recursive folder where name = path[i]
const generateRecursiveOuterFolder = (paths, sharedFolderId) => {
  if (paths.length <= 1) {
    return {
      name: paths[0],
      outerFolderId: sharedFolderId
    };
  }
  return {
    name: paths[0],
    outerFolder: generateRecursiveOuterFolder(paths.slice(1), sharedFolderId)
  };
};

export default async function handler(
    req: NextApiRequest, 
    res: NextApiResponse<ResponseData | {message: string}>
  ) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Extract linkId and path from the query
    const { pathLink }: { pathLink: string } = req.body;

    const initPath = pathLink.split('/');

    const linkId = initPath[0];
    const path = initPath.slice(1);

    // console.log("LINKID: " + linkId + ", PATH: " + initPath);

    
  const link = await prisma.link.findUnique({
    where: {
      path: linkId,
    },
    select: {
      folderId: true,
      fileId: true,
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


  if(!link || !link.folderId){
    return res.status(404).json({ message: "Link not found" });
  }

  let whereQuery = {};
  // console.log(path)
  if(!path || path.length === 0){
    whereQuery = {
      folderId: link.folderId
    };
  }else{
    whereQuery = generateRecursiveOuterFolder([...path].reverse(), link.folderId);
  }
    
  const folder = await prisma.folder.findFirst({
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
      // userId: user.id,
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