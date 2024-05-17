import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import axios from 'axios';

const sendDeleteRequest = async (path: string) => {
  let config = {
    headers: {
      'Tus-Resumable': '1.0.0'
    }
  }
  try{
    const resp = await axios.delete("http://tusd:8080/files/"+path, config);
  }catch(e){
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
  if (!session && !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { fileId } = req.query; // Extract fileId from request query parameters

  const fileToDelete = await prisma.file.findUnique({
    where: {
      fileId: fileId as string,
    },
    select: {
      folder: true,
    }
  });

  if (!fileToDelete) {
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
    
      
      for (const toDelHash of emptyHashes) {
        await sendDeleteRequest(toDelHash.path);
      }



      res.status(200).json({ message: 'File successfully deleted', dels: emptyHashes });
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
