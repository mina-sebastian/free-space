import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../libs/prismadb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import axios from 'axios';

// Define types for file and folder data
type FileType = {
  fileId: string;
  denumire: string;
  folderId: string;
};

// Define type for folder data
type FolderType = {
  folderId: string;
  name: string;
  outerFolderId?: string | null;
};

// Define response data type
type ResponseData = {
  folders: FolderType[];
  files: FileType[];
};

// Function to send a DELETE request to the Tus server
const sendDeleteRequest = async (path: string) => {
  let config = {
    headers: {
      'Tus-Resumable': '1.0.0'
    }
  }
  try{
    const resp = await axios.delete("http://tusd:8080/files/"+path, config); // Send DELETE request to Tus server
  }catch(e){
    console.log(e);
  }
}


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

  // Default API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { message: string }>
) {
  const session = await getServerSession(req, res, authOptions); // Retrieve session information using NextAuth
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' }); // Return unauthorized if no session found
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
    return res.status(500).json({ message: 'Bin folder not found' }); // Return error if Bin folder not found
  }



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

  const emptyHashes = await prisma.fileHash.findMany({ // Find all fileHashes that are not associated with any files
    where: {
      size: {
        gte: 0 //if the size is lower than 0, it means that the file is not uploaded yet
      },
      files: {
        none: {}
      }
    }
  });

  
  for (const toDelHash of emptyHashes) { // Loop through each empty fileHash
    await sendDeleteRequest(toDelHash.path);
  }

  res.status(200).json({ message: 'Operation completed successfully' }); // Return a success message
}