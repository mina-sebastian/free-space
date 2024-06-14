import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { createId } from '@paralleldrive/cuid2';

// Type definitions for the response data
type ResponseData = {
  alreadyUploaded: string[];
  toUpload: string[];
};

// API handler to preprocess files before uploading
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | { message: string }> // Response data type definition
) {
  const session = await getServerSession(req, res, authOptions); // Get the session from the request
  if (!session && !session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // console.log('Received preprocess request:', req.body);

  const { files, outerFolderId } = req.body; // Get the files and folder ID from the request body

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({ message: 'Bad Request' });
  }
  
  const alreadyUploaded: string[] = []; // Array to store the IDs of already uploaded files
  const toUpload: string[] = []; // Array to store the IDs of files to be uploaded


  // const existingFiles = await prisma.fileHash.findMany({
  //   where: {
  //     hash: { in: fileHashes }
  //   },
  //   select: {
  //     hash: true,
  //     path: true,
  //     size: true
  //   }
  // });

  // Get the folder ID for the user
  const folder = await prisma.folder.findFirst({
    where: {
      folderId: outerFolderId,
    },
    select: {
      folderId: true,
    }
  }) || await prisma.folder.create({ // Create the folder if it doesn't exist
    data: {
      name: "Home",
      userId: session.user.id,
    }
  });

  // Iterate over the files to preprocess them
  for (const file of files) {
    try{
      const newAssignedId = `frspc-${createId()}`; // Generate a new ID for the file
      await prisma.fileHash.create({ // Create the file hash entry
        data: {
          hash: file.hash,
          size: -1,
          path: newAssignedId,
        }
      })
      toUpload.push({ // Add the file to the list of files to be uploaded
        ...file,
        gvnid: newAssignedId
      })
    }
    catch(e){
      // console.log(e);
      //get tags list for the file
      const tagsFH = await prisma.fileHash.findUnique({ // Find the file hash entry
        where: {
          hash: file.hash
        },
        select: {
          tags: {
            select: {
              name: true
            }
          }
        }
      });
      //create the file with the list of the tags
      await prisma.file.create({ // Create the file entry
        data: {
          name: file.name,
          hash: file.hash,
          userId: session.user.id,
          folderId: outerFolderId,
          tags: {
            connect: tagsFH.tags
          }
        }
      });
      alreadyUploaded.push(file.id);
    }
  }

  res.status(200).json({ alreadyUploaded, toUpload }); // Return the response
}
