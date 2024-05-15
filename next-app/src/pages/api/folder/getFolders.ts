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
  


  const folders = await prisma.folder.findMany({
    select: { // Specify fields to select for reducing payload and enhancing privacy
        folderId: true,
        name: true,
        outerFolderId: true
    },
    where: {
      user: user,
    },
  });
  console.log(folders);
  // Return the list of users
  if (folders.length > 0) {
    res.status(200).json({ folders });
  } else {
    res.status(200).json({ folders: [] }); // Return an empty array if no users found
  }

}
