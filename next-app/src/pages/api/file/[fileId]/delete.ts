import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import axios from 'axios';

// Function to send a DELETE request to the Tus server
const sendDeleteRequest = async (path: string) => {
  let config = {
    headers: {
      'Tus-Resumable': '1.0.0' // Required header for Tus server
    }
  }
  try{
    const resp = await axios.delete("http://tusd:8080/files/"+path, config); // Send DELETE request to Tus server
  }catch(e){
    console.log(e);
  }
}

// Function to find the highest ancestor folder of a given folder
const findHighestAncestor = async (folderId: string): Promise<any> => {
  let currentFolder = await prisma.folder.findUnique({ // Find the folder by folderId
    where: { folderId },
    include: { outerFolder: true },
  });

  while (currentFolder?.outerFolder) { // Loop until the outerFolder is null
    currentFolder = await prisma.folder.findUnique({ // Find the folder by folderId
      where: { folderId: currentFolder.outerFolder.folderId }, // Get the outerFolder by folderId
      include: { outerFolder: true },
    });
  }

  return currentFolder;
};

// API handler to delete a file
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string, dels?: any }> // Response data type definition
) {
  const session = await getServerSession(req, res, authOptions); // Get the session from the request
  if (!session && !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { fileId } = req.query; // Extract fileId from request query parameters

  // Find the file to delete
  const fileToDelete = await prisma.file.findUnique({
    where: {
      fileId: fileId as string,
    },
    select: {
      folder: true,
    }
  });

  if (!fileToDelete) { // Check if the file exists
    return res.status(404).json({ message: 'File not found' });
  }

  try {
    // Get the highest ancestor folder
    const highestAncestor = await findHighestAncestor(fileToDelete.folder.folderId);

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

    if (highestAncestor.folderId === binFolder.folderId) {
      // If the highest ancestor folder is the "Bin" folder, delete the file

      await prisma.file.delete({
        where: {
          fileId: fileId as string,
        },
      });

      
      // Find all fileHashes that are not associated with any files
      const emptyHashes = await prisma.fileHash.findMany({
        where: {
          size: {
            gte: 0 //if the size is lower than 0, it means that the file is not uploaded yet
          },
          files: {
            none: {}
          }
        }
      });
    
      // Delete the fileHashes
      for (const toDelHash of emptyHashes) {
        await sendDeleteRequest(toDelHash.path);
      }



      res.status(200).json({ message: 'File successfully deleted', dels: emptyHashes }); // Send success response
    } else {
      // If the highest ancestor folder is not the "Bin" folder, move the file to the "Bin" folder
      await prisma.file.update({
        where: {
          fileId: fileId as string,
        },
        data: {
          folderId: binFolder.folderId,
        },
      });

      res.status(200).json({ message: 'File moved to Bin' });
    }
  } catch (error) {
    console.error('Error handling file:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
