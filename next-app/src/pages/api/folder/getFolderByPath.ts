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
  name: string;
  size: Number;
  deleted: boolean;
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

    if(typeof whereQuery === 'string'){
        whereQuery = {
                name: path,
                outerFolderId: null
        }
    }else{
        whereQuery = generateRecursiveOuterFolder(path.reverse());
    }
    console.log("query", whereQuery);
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
              path: true,
              deleted: true,
              name: true,
              size: true,
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
  console.log("FILES:",folder.files);
  // Return the list of users

  res.status(200).json({ folders: folder.innerFolders, files: folder.files, folderId: folder.folderId});


}
