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
  fileId: string;
  path: string;
  denumire: string;
  deleted: boolean;
  dimensiune: number;
  userId: string;
  folderId: string;
};

type ResponseData = {
  folders: FolderType[];
  files: FileType[];
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
  console.log("path", path);

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
  const folders = await prisma.folder.findMany({
    select: {
        folderId: true,
        name: true,
        outerFolderId: true,
    },
    where: {
      user: user,
      outerFolder: whereQuery
    },
  });
  const files = await prisma.file.findMany({
    select: {
        fileId: true,
        path: true,
        name: true,
        deleted: true,
        size: true,
        folder: true
    },
    where: {
      user: user,
      folder: whereQuery
    }
  });
  // console.log("FOLDERS:",folders);
  // console.log("FILES:",files);
  // Return the list of users

  res.status(200).json({ folders: folders, files: files });


}
