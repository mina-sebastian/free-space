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
  
  //path is like "/folder1/folder2/folder3"
  const { path }: {path: string|string[]} = req.body;
  // console.log("path", path);

  let whereQuery = {};

  if (typeof path === 'string') {
    whereQuery = {
      name: path,
      outerFolderId: null
    };
  } else {
    const pathArray = Array.isArray(path) ? path : [path];
    whereQuery = generateRecursiveOuterFolder(pathArray.reverse());
  }
  // console.log("query", whereQuery);
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
        ...whereQuery
      },
    });
  // console.log("FILES:", folder.files);

  const updatedFiles = folder.files.map((file) => ({
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
