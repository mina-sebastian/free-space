import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import axios from 'axios';

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

const sendDeleteRequest = async (path: string) => {
  let config = {
    headers: {
      'Tus-Resumable': '1.0.0'
    }
  }
  const resp = await axios.delete("http://tusd:8080/files/"+path, config);

  if (resp.statusText === 'OK') {
    throw new Error('Failed to delete folder');
  }
}

const findHighestAncestor = async (folderId: string): Promise<any> => {
  let currentFolder = await prisma.folder.findUnique({
    where: { folderId },
    include: { outerFolder: true },
  });

  while (currentFolder?.outerFolder) {
    currentFolder = await prisma.folder.findUnique({
      where: { folderId: currentFolder.outerFolder.folderId },
      include: { outerFolder: true },
    });
  }

  return currentFolder;
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

  // Get the "Bin" folder
  const binFolder = await prisma.folder.findFirst({
    where: {
      userId: session.user.id,
      outerFolderId: null,
      name: "Bin"
    }
  });

  if (!binFolder) {
    return res.status(500).json({ message: 'Bin folder not found' });
  }

  // Function to delete folder and its children recursively
  const deleteFolderAndChildren = async (folderId: string) => {
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

    // Delete files in the folder
    const filesToDelete = await prisma.file.findMany({
      where: {
        folderId: folderId,
      },
      select: {
        hashFile:{
          select:{
            path: true
          }
        }
      }
    });

    for (const file of filesToDelete) {
      await sendDeleteRequest(file.hashFile.path);
    }

    await prisma.file.deleteMany({
      where: {
        folderId: folderId,
      },
    });

    // Finally, delete the folder itself
    await prisma.folder.delete({
      where: {
        folderId: folderId,
      },
    });
  };

  // Find the highest ancestor folder
  const highestAncestor = await findHighestAncestor(folderId as string);

  if (highestAncestor.folderId === binFolder.folderId) {
    // If the highest ancestor folder is the "Bin" folder, delete the folder and its children
    await deleteFolderAndChildren(folderId as string);
  } else {
    // If the highest ancestor folder is not the "Bin" folder, move the folder to the "Bin" folder
    await prisma.folder.update({
      where: {
        folderId: folderId as string,
      },
      data: {
        outerFolderId: binFolder.folderId,
      },
    });
  }

  res.status(200).json({ message: 'Operation completed successfully' });
}