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
  }
  try {
    for (const path of paths) {
      await axios.delete("http://tusd:8080/files/" + path, config);
    }
  } catch (e) {
    console.log(e);
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
  res: NextApiResponse<{ message: string, dels?: any }>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { fileIds } = req.body; // Extract fileIds from request body

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: 'Invalid fileIds' });
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

    // Process each file
    const processedFiles = [];
    
    for (const fileId of fileIds) {
      const fileToDelete = await prisma.file.findUnique({
        where: { fileId },
        select: { folder: true },
      });

      if (!fileToDelete) {
        return res.status(404).json({ message: `File with ID ${fileId} not found` });
      }

      const highestAncestor = await findHighestAncestor(fileToDelete.folder.folderId);


      if (highestAncestor.folderId === binFolder.folderId) {
        // If the highest ancestor folder is the "Bin" folder, delete the file
        await prisma.file.delete({
          where: { fileId },
        });
      } else {
        // If the highest ancestor folder is not the "Bin" folder, move the file to the "Bin" folder
        await prisma.file.update({
          where: { fileId },
          data: { folderId: binFolder.folderId },
        });
      }

      processedFiles.push(fileId);
    }

    // Get paths of files with no references
    const emptyHashes = await prisma.fileHash.findMany({
      where: {
        size: { gte: 0 },
        files: { none: {} }
      }
    });

    // Delete the files from storage
    const pathsToDelete = emptyHashes.map(hash => hash.path);
    await sendDeleteRequest(pathsToDelete);

    res.status(200).json({ message: 'Files successfully processed', processedFiles, dels: emptyHashes });
  } catch (error) {
    console.error('Error handling files:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
