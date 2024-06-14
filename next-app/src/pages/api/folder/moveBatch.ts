import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

// Function to send a DELETE request to the Tus server
const sendDeleteRequest = async (paths: string[]) => {
  let config = { // Define the config object with headers
    headers: {
      'Tus-Resumable': '1.0.0' 
    }
  };
  try {
    for (const path of paths) {
      await axios.delete("http://tusd:8080/files/" + path, config); // Send DELETE request to Tus server for each path
    }
  } catch (e) {
    console.log(e);
  }
};

const findHighestAncestor = async (folderId: string): Promise<any> => { // Function to find the highest ancestor folder of a given folder
  let currentFolder = await prisma.folder.findUnique({ // Find the folder by folderId
    where: { folderId },
    include: { outerFolder: true },
  });

  while (currentFolder?.outerFolder) { // Loop until the outerFolder is null
    currentFolder = await prisma.folder.findUnique({ // Find the folder by folderId
      where: { folderId: currentFolder.outerFolder.folderId },
      include: { outerFolder: true }, // Include the outerFolder in the query
    });
  }

  return currentFolder;
};

const deleteFolderRecursively = async (folderId: string) => { // Function to delete folder and its children recursively
  const folder = await prisma.folder.findUnique({ // Find the folder by folderId
    where: { folderId },
    include: {
      files: true,
      innerFolders: true,
      links: true,
    },
  });

  if (!folder) return; // Return if folder is not found

  for (const file of folder.files) {
    await prisma.file.delete({ where: { fileId: file.fileId } }); // Delete the file from the database
  }

  for (const innerFolder of folder.innerFolders) { // Loop through each inner folder in the folder
    await deleteFolderRecursively(innerFolder.folderId); // Recursively delete the inner folder
  }

  await prisma.link.deleteMany({ where: { folderId: folderId } }); // Delete all links associated with the folder

  await prisma.folder.delete({ where: { folderId } }); // Delete the folder from the database
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) { // Default API handler function
  const session = await getServerSession(req, res, authOptions); // Retrieve session information using NextAuth
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' }); // Return unauthorized if no session found
  }

  if (req.method === 'DELETE') {
    const { folderIds } = req.body; // Extract folderIds from request body

    if (!Array.isArray(folderIds) || folderIds.length === 0) {
      return res.status(400).json({ message: 'Invalid folderIds' }); // Return invalid folderIds if folderIds is not an array or is empty
    }

    try {
      const binFolder = await prisma.folder.findFirst({ // Find the bin folder for the user
        where: {
          userId: session.user.id,
          outerFolderId: null,
          name: "Bin"
        }
      });

      if (!binFolder) {
        return res.status(500).json({ message: 'Bin folder not found' }); // Return a 500 error if the "Bin" folder is not found
      }

      const firstFolderToDelete = await prisma.folder.findUnique({
        where: { folderId: folderIds[0] }, // Find the first folder to delete
      });

      if (!firstFolderToDelete) {
        return res.status(404).json({ message: `Folder with ID ${folderIds[0]} not found` }); // Return a 404 error if the folder is not found
      }

      const highestAncestor = await findHighestAncestor(firstFolderToDelete.folderId); // Find the highest ancestor folder

      const processedFolders = []; // Initialize an array to store processed folders

      for (const folderId of folderIds) {
        const folderToDelete = await prisma.folder.findUnique({ // Find the folder by folderId
          where: { folderId },
        });

        if (!folderToDelete) {
          return res.status(404).json({ message: `Folder with ID ${folderId} not found` }); // Return a 404 error if the folder is not found
        }

        if (highestAncestor.folderId === binFolder.folderId) { // If the highest ancestor folder is the "Bin" folder
          await deleteFolderRecursively(folderId); // Recursively delete the folder and its children
        } else {
          await prisma.folder.update({
            where: { folderId },
            data: { outerFolderId: binFolder.folderId }, // Move the folder to the "Bin" folder
          });
        }

        processedFolders.push(folderId);
      }

      res.status(200).json({ message: 'Folders successfully processed', processedFolders }); // Return success message
    } catch (error) {
      console.error('Error handling folders:', error);
      res.status(500).json({ message: 'Internal Server Error' }); // Return a 500 error response with a specific message
    }
  } else if (req.method === 'PUT') {
    // Handling PUT requests to move folders
    const { folderIds, destinationFolderId } = req.body; // Extract folderIds and destinationFolderId from request body

    if (!Array.isArray(folderIds) || folderIds.length === 0 || !destinationFolderId) { // Check if folderIds is an array and not empty, and destinationFolderId is provided
      return res.status(400).json({ message: 'Invalid request' });
    }

    try {
      await prisma.folder.updateMany({ // Update the folders with the provided folderIds
        where: {
          folderId: { in: folderIds },
          userId: session.user.id
        },
        data: {
          outerFolderId: destinationFolderId
        }
      });

      res.status(200).json({ message: 'Folders moved successfully' }); // Return a success message
    } catch (error) {
      console.error('Error moving folders:', error);
      res.status(500).json({ message: 'Internal Server Error' }); // Return a 500 error response with a specific message
    }
  } else {
    res.setHeader('Allow', ['DELETE', 'PUT']); // Set the allowed methods in the response header
    res.status(405).end(`Method ${req.method} Not Allowed`); // Return a 405 error if the method is not allowed
  }
}