import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

const sendDeleteRequest = async (paths: string[]) => {
  let config = {
    headers: {
      'Tus-Resumable': '1.0.0'
    }
  };
  try {
    for (const path of paths) {
      await axios.delete("http://tusd:8080/files/" + path, config);
    }
  } catch (e) {
    console.log(e);
  }
};

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

const deleteFolderRecursively = async (folderId: string) => {
  const folder = await prisma.folder.findUnique({
    where: { folderId },
    include: {
      files: true,
      innerFolders: true,
      links: true,
    },
  });

  if (!folder) return;

  for (const file of folder.files) {
    await prisma.file.delete({ where: { fileId: file.fileId } });
  }

  for (const innerFolder of folder.innerFolders) {
    await deleteFolderRecursively(innerFolder.folderId);
  }

  await prisma.link.deleteMany({ where: { folderId: folderId } });

  await prisma.folder.delete({ where: { folderId } });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string, dels?: any }>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { folderIds } = req.body; // Extract folderIds from request body

  if (!Array.isArray(folderIds) || folderIds.length === 0) {
    return res.status(400).json({ message: 'Invalid folderIds' });
  }

  try {

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

    // Find the highest ancestor for the first folder
    const firstFolderToDelete = await prisma.folder.findUnique({
      where: { folderId: folderIds[0] },
    });

    if (!firstFolderToDelete) {
      return res.status(404).json({ message: `Folder with ID ${folderIds[0]} not found` });
    }

    const highestAncestor = await findHighestAncestor(firstFolderToDelete.folderId);

    // Process each folder
    const processedFolders = [];

    for (const folderId of folderIds) {
      const folderToDelete = await prisma.folder.findUnique({
        where: { folderId },
      });

      if (!folderToDelete) {
        return res.status(404).json({ message: `Folder with ID ${folderId} not found` });
      }

      if (highestAncestor.folderId === binFolder.folderId) {
        // If the highest ancestor folder is the "Bin" folder, delete the folder recursively
        await deleteFolderRecursively(folderId);
      } else {
        // If the highest ancestor folder is not the "Bin" folder, move the folder to the "Bin" folder
        await prisma.folder.update({
          where: { folderId },
          data: { outerFolderId: binFolder.folderId },
        });
      }

      processedFolders.push(folderId);
    }

    res.status(200).json({ message: 'Folders successfully processed' });
  } catch (error) {
    console.error('Error handling folders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}