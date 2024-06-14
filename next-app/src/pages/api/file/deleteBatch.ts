import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

// Function to send delete requests to a Tus server for given paths
const sendDeleteRequest = async (paths: string[]) => {
  let config = {
    headers: {
      'Tus-Resumable': '1.0.0' // Set Tus-Resumable header for Tus protocol
    }
  };
  try {
    for (const path of paths) {
      await axios.delete("http://tusd:8080/files/" + path, config); // Send delete request to Tus server for each path
    }
  } catch (e) {
    console.log(e); // Log any errors that occur during delete requests
  }
};

// Function to find the highest ancestor folder given a folderId using Prisma
const findHighestAncestor = async (folderId: string): Promise<any> => {
  let currentFolder = await prisma.folder.findUnique({
    where: { folderId },
    include: { outerFolder: true }, // Include outerFolder relation to navigate up the folder hierarchy
  });

  while (currentFolder?.outerFolder) {
    currentFolder = await prisma.folder.findUnique({
      where: { folderId: currentFolder.outerFolder.folderId },
      include: { outerFolder: true }, // Navigate up to the next outer folder
    });
  }

  return currentFolder; // Return the highest ancestor folder found
};

// Default API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string, dels?: any }>
) {
  const session = await getServerSession(req, res, authOptions); // Retrieve session information using NextAuth
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' }); // Return unauthorized if no session or user found
  }

  const { fileIds } = req.body; // Extract fileIds from request body

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: 'Invalid fileIds' }); // Validate fileIds; return error if invalid
  }

  try {
    // Get the "Bin" folder associated with the current user
    const binFolder = await prisma.folder.findFirst({
      where: {
        userId: session.user.id,
        outerFolderId: null,
        name: "Bin" // Name of the Bin folder
      }
    });

    if (!binFolder) {
      return res.status(500).json({ message: 'Bin folder not found' }); // Return error if Bin folder not found
    }

    // Find the highest ancestor folder for the first file to delete
    const firstFileToDelete = await prisma.file.findUnique({
      where: { fileId: fileIds[0] },
      select: { folder: true }, // Select the folder relation for the file
    });

    if (!firstFileToDelete) {
      return res.status(404).json({ message: `File with ID ${fileIds[0]} not found` }); // Return error if file not found
    }

    const highestAncestor = await findHighestAncestor(firstFileToDelete.folder.folderId);

    // Process each file in fileIds array
    const processedFiles = [];

    for (const fileId of fileIds) {
      const fileToDelete = await prisma.file.findUnique({
        where: { fileId },
        select: { folder: true }, // Select the folder relation for the file
      });

      if (!fileToDelete) {
        return res.status(404).json({ message: `File with ID ${fileId} not found` }); // Return error if file not found
      }

      if (highestAncestor.folderId === binFolder.folderId) {
        // If the highest ancestor folder is the "Bin" folder, delete the file from database
        await prisma.file.delete({
          where: { fileId },
        });
      } else {
        // If the highest ancestor folder is not the "Bin" folder, move the file to the "Bin" folder
        await prisma.file.update({
          where: { fileId },
          data: { folderId: binFolder.folderId }, // Update the folderId to move the file to the Bin folder
        });
      }

      processedFiles.push(fileId); // Track processed files
    }

    // Get paths of files with no references (empty hashes)
    const emptyHashes = await prisma.fileHash.findMany({
      where: {
        size: { gte: 0 },
        files: { none: {} } // Find fileHashes with no associated files
      }
    });

    // Extract paths from emptyHashes for deletion from storage
    const pathsToDelete = emptyHashes.map(hash => hash.path);
    await sendDeleteRequest(pathsToDelete); // Send delete requests to storage for the paths

    res.status(200).json({ message: 'Files successfully processed', processedFiles, dels: emptyHashes }); // Return success message with processed files and empty hashes
  } catch (error) {
    console.error('Error handling files:', error); // Log any errors that occur during file handling
    res.status(500).json({ message: 'Internal Server Error' }); // Return internal server error
  }
}