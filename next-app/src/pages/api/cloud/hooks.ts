import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { createId } from '@paralleldrive/cuid2';
import { log } from 'console';

// Type definitions for incoming hook requests
type HookRequest = {
  Type: string;
  Event: {
    Upload: {
      MetaData?: { [key: string]: any };
      ID?: string;
      Size?: number;
      Storage?: string;
    };
  };
};

// Type definitions for outgoing hook responses
type HookResponse = {
  RejectUpload?: boolean;
  ChangeFileInfo?: {
    ID: string;
    MetaData: {
      tkn: string;
      folderId: string;
      filename: string;
      creation_time: string;
      hash: string;
    };
  };
  HTTPResponse?: {
    StatusCode?: number;
    Body?: string;
    Headers?: { [key: string]: string };
  };
};

/**
 * API handler to process TUS (resumable file upload protocol) server hooks.
 * 
 * @param req - The incoming request object from the tusd server.
 * @param res - The outgoing response object to the tusd server.
 * @returns {Promise<void>} - The response to the tusd server indicating success or failure.
 */
export default async function (
  req: NextApiRequest,
  res: NextApiResponse<HookResponse>
): Promise<void> {
  const hookResponse: HookResponse = { HTTPResponse: { Headers: {} } };

  try {
    if (req.method !== 'POST') {
      throw new Error('Method Not Allowed');
    }

    // console.log('Received hook request:', req.body, req.body.Event.Upload.MetaData, req.body.Event.Upload.Storage);

    const hookRequest: HookRequest = req.body;

    // Switch based on the type of hook request
    switch (hookRequest.Type) {
      case 'pre-create':
        await handlePreCreate(hookRequest, hookResponse); // Handle pre-create hook type
        break;
      case 'post-finish':
        await handlePostFinish(hookRequest); // Handle post-finish hook type
        break;
      case 'post-terminate':
        await handlePostDelete(hookRequest); // Handle post-terminate hook type
      default:
        hookResponse.RejectUpload = true; // Reject the upload if the hook type is not recognized
        hookResponse.HTTPResponse.StatusCode = 200; // Set the status code to 200
        return res.status(200).json(hookResponse); // Return the response to the tusd server
    }

    res.status(200).json(hookResponse); // Return the response to the tusd server
  } catch (error) {
    console.error('Error processing hook:', error);
    hookResponse.RejectUpload = true; // Reject the upload if an error occurs
    hookResponse.HTTPResponse.StatusCode = error.message === 'Method Not Allowed' ? 405 : 400; // Set the status code based on the error
    hookResponse.HTTPResponse.Body = error.message; // Set the error message in the response body
    res.status(hookResponse.HTTPResponse.StatusCode).json(hookResponse); // Return the response to the tusd server
  }
}

// Function to handle post-terminate hook type
async function handlePostDelete(hookRequest: HookRequest) {
  const { MetaData } = hookRequest.Event.Upload; // Destructure the MetaData from the hook request

  // console.log("DELETIING");
  // console.log(hookRequest);

  // Find the user based on the token in the MetaData
  const user = await prisma.user.findUnique({
    where: {
      id: MetaData.tkn
    },
    select: {
      id: true
    }
  });

  if (!user) {
    throw new Error('Not Authorized');
  }

  // console.log("DELETIING");
  await prisma.fileHash.delete({
    where: {
      hash: MetaData.hash,
    }
  });
  // console.log(rez);
}

// Function to handle pre-create hook type
async function handlePreCreate(hookRequest: HookRequest, hookResponse: HookResponse) {
  const metaData = hookRequest.Event.Upload.MetaData; // Destructure the MetaData from the hook request
  const isValid = metaData && 'filename' in metaData; // Check if the MetaData contains a filename

  // Get the user based on the token in the MetaData
  const user = await prisma.user.findUnique({
    where: {
      id: metaData.tkn
    }
  });

  // Check if the user is authorized and a filename is provided
  if (!user) {
    throw new Error('Not Authorized');
  } else if (!isValid) {
    throw new Error('No filename provided');
  } else {
    
    // Check if the file already exists in the system
    const hashedFs = await prisma.fileHash.count({
      where: {
        hash: metaData.hash,
        size:{
          gt: -1
        }
      }
    });
  
    if(hashedFs > 0){
      hookResponse.RejectUpload = true; // Reject the upload if the file already exists
      hookResponse.HTTPResponse.StatusCode = 201; 
      hookResponse.HTTPResponse.Body = "File already in the system.";
      return;
    }

    
    // Set the response to change the file info
    hookResponse.ChangeFileInfo = {
      ID: metaData.gvnid, // Set the ID to the gvnid in the MetaData
      MetaData: {
        tkn: metaData.tkn,
        folderId: metaData.folderId,
        filename: metaData.filename,
        hash: metaData.hash,
        creation_time: new Date().toUTCString(),
      },
    };
  }
}

// Function to handle post-finish hook type
async function handlePostFinish(hookRequest: HookRequest) {
  const { ID, Size, MetaData } = hookRequest.Event.Upload; // Destructure the ID, Size, and MetaData from the hook request

  // Find the user based on the token in the MetaData
  const user = await prisma.user.findUnique({
    where: {
      id: MetaData.tkn
    },
    select: {
      id: true
    }
  });

  if (!user) {
    throw new Error('Not Authorized');
  }

  // Find the folder based on the folderId in the MetaData
  const folder = await prisma.folder.findFirst({
    where: {
      folderId: MetaData.folderId,
    },
    select: {
      folderId: true
    }
  }) || await prisma.folder.create({
    data: {
      folderId: MetaData.folderId,
      name: "Home",
      userId: user.id,
    }
  });

  if(!folder) {
    throw new Error('Folder not found');
  }

  // Create the file hash in the database
  await prisma.fileHash.update({
    where: {
      hash: MetaData.hash,
    },
    data: {
      size: Size,
    }
  });

  // Create the file in the database
  await prisma.file.create({
    data: {
      userId: user.id,
      folderId: folder.folderId,
      name: MetaData.filename,
      hash: MetaData.hash,
      }
    });
}
