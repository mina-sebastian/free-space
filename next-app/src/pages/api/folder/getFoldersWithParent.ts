import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';


type FolderType = {
  folderId: string;
  name: string;
  outerFolderId?: string | null;
};

type ResponseData = {
  folders: FolderType[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | {message: string}>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await session.user;
  
  const { parent } = req.body;

  const folders = await prisma.folder.findMany({
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
