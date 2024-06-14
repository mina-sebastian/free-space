import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

// Function to send a DELETE request to the Tus server
const sendDeleteRequest = async (paths: string[]) => {
  let config = {
    headers: {
      'Tus-Resumable': '1.0.0' // Set the Tus-Resumable header to '1.0.0'
    }
  };
  try {
    for (const path of paths) { // Loop through each path in the paths array
      await axios.delete("http://tusd:8080/files/" + path, config); // Send DELETE request to Tus server
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
      include: { outerFolder: true },
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

  for (const file of folder.files) { // Loop through each file in the folder
    await prisma.file.delete({ where: { fileId: file.fileId } }); // Delete the file from the database
  }

  for (const innerFolder of folder.innerFolders) { // Loop through each inner folder in the folder
    await deleteFolderRecursively(innerFolder.folderId); // Recursively delete the inner folder
  }

  await prisma.link.deleteMany({ where: { folderId: folderId } }); // Delete all links associated with the folder

  await prisma.folder.delete({ where: { folderId } });  // Delete the folder from the database
};

export default async function handler( // Default API handler function
  req: NextApiRequest,
  res: NextApiResponse<{ message: string, dels?: any }>
) {
  const session = await getServerSession(req, res, authOptions); // Retrieve session information using NextAuth
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' }); // Return unauthorized if no session found
  }

  const { folderIds } = req.body; // Extract folderIds from request body

  if (!Array.isArray(folderIds) || folderIds.length === 0) { 
    return res.status(400).json({ message: 'Invalid folderIds' }); // Return a 400 error if folderIds is not an array or is empty
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
      return res.status(500).json({ message: 'Bin folder not found' }); // Return a 500 error if the "Bin" folder is not found
    }

    // Find the highest ancestor for the first folder
    const firstFolderToDelete = await prisma.folder.findUnique({
      where: { folderId: folderIds[0] },
    });

    if (!firstFolderToDelete) {
      return res.status(404).json({ message: `Folder with ID ${folderIds[0]} not found` }); // Return a 404 error if the folder is not found
    }

    const highestAncestor = await findHighestAncestor(firstFolderToDelete.folderId); // Find the highest ancestor folder

    // Process each folder
    const processedFolders = [];

    for (const folderId of folderIds) {
      const folderToDelete = await prisma.folder.findUnique({ // Find the folder by folderId
        where: { folderId },
      });

      if (!folderToDelete) {
        return res.status(404).json({ message: `Folder with ID ${folderId} not found` }); // Return a 404 error if the folder is not found
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

    res.status(200).json({ message: 'Folders successfully processed' }); // Respond with a success message
  } catch (error) {
    console.error('Error handling folders:', error);
    res.status(500).json({ message: 'Internal Server Error' }); // Return a 500 error response with a specific message
  }
}