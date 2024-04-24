import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

type FileType = {
  fileId: string;
  denumire: string;
  folderId: string;
};

type FolderType = {
  folderId: string;
  name: string;
  outerFolderId?: string | null;
};

type ResponseData = {
  folders: FolderType[];
  files: FileType[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { message: string }>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { folderId } = req.query; // Extract folderId from request query parameters

  // Function to delete folder and its children recursively
  const deleteFolderAndChildren = async (folderId: string) => {
    // Delete files in the folder
    await prisma.file.deleteMany({
      where: {
        folderId: folderId,
      },
    });

    // Find subfolders of the current folder
    const subfolders = await prisma.folder.findMany({
      where: {
        outerFolderId: folderId,
      },
    });

    // Recursively delete subfolders and their children
    for (const subfolder of subfolders) {
      await deleteFolderAndChildren(subfolder.folderId);
    }

    // Finally, delete the folder itself
    await prisma.folder.delete({
      where: {
        folderId: folderId,
      },
    });
  };

  // Start cascade deletion
  await deleteFolderAndChildren(folderId as string);

  res.status(204).end(); // Return success with no content
}
