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
const generateRecursiveOuterFolder = (paths: string[]) => {
    if(paths.length <= 1){
        return {
            name: paths[0],
            outerFolder: null
        };
    }

    return {
        name: paths[0],
        outerFolder: generateRecursiveOuterFolder(paths.slice(1))
    }
}

export default async function handler(
    req: NextApiRequest, 
    res: NextApiResponse<ResponseData | {message: string}>
  ) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    const user = await session.user;
    
    // Extract linkId and path from the query
    const { combinedPath }: { combinedPath: string } = req.query as {combinedPath: string};
    const [linkId, ...pathParts] = combinedPath.split('/'); // sa am grija la cazul in care am doar linkId si nu path

    console.log("LINKID: " + linkId + ", PATHPARTS: " + pathParts);

    const path = pathParts.join('/'); // Recombine the remaining parts back into a full path
  
    let whereQuery = {};
  
    if (path) {
      if (path.includes('/')) {
        // If path is hierarchical, resolve it using a recursive function
        const pathArray = path.split('/').reverse(); // Split and reverse for recursive function compatibility
        whereQuery = generateRecursiveOuterFolder(pathArray);
      } else {
        // Simple case, path is a single folder name
        whereQuery = {
          name: path,
          outerFolderId: null
        };
      }
    }
  
    // Include condition to fetch folders based on linkId
    const folder = await prisma.folder.findFirst({
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
        ...whereQuery,
        links: {
          some: {
            path: linkId
          }
        }
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