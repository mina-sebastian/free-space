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

    switch (hookRequest.Type) {
      case 'pre-create':
        await handlePreCreate(hookRequest, hookResponse);
        break;
      case 'post-finish':
        await handlePostFinish(hookRequest);
        break;
      case 'post-terminate':
        await handlePostDelete(hookRequest);
      default:
        hookResponse.RejectUpload = true;
        hookResponse.HTTPResponse.StatusCode = 200;
        return res.status(200).json(hookResponse);
    }

    res.status(200).json(hookResponse);
  } catch (error) {
    console.error('Error processing hook:', error);
    hookResponse.RejectUpload = true;
    hookResponse.HTTPResponse.StatusCode = error.message === 'Method Not Allowed' ? 405 : 400;
    hookResponse.HTTPResponse.Body = error.message;
    res.status(hookResponse.HTTPResponse.StatusCode).json(hookResponse);
  }
}

async function handlePostDelete(hookRequest: HookRequest) {
  const { MetaData } = hookRequest.Event.Upload;

  // console.log("DELETIING");
  // console.log(hookRequest);

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

/**
 * Handle pre-create hook type by validating user and upload metadata.
 */
async function handlePreCreate(hookRequest: HookRequest, hookResponse: HookResponse) {
  const metaData = hookRequest.Event.Upload.MetaData;
  const isValid = metaData && 'filename' in metaData;

  const user = await prisma.user.findUnique({
    where: {
      id: metaData.tkn
    }
  });


  if (!user) {
    throw new Error('Not Authorized');
  } else if (!isValid) {
    throw new Error('No filename provided');
  } else {
    
    const hashedFs = await prisma.fileHash.count({
      where: {
        hash: metaData.hash,
        size:{
          gt: -1
        }
      }
    });
    
    if(hashedFs > 0){
      hookResponse.RejectUpload = true;
      hookResponse.HTTPResponse.StatusCode = 201;
      hookResponse.HTTPResponse.Body = "File already in the system.";
      return;
    }

    
    
    hookResponse.ChangeFileInfo = {
      ID: metaData.gvnid,
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

/**
 * Handle post-finish hook type by logging the upload completion and storing the file details in the database.
 */
async function handlePostFinish(hookRequest: HookRequest) {
  const { ID, Size, MetaData } = hookRequest.Event.Upload;

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

  await prisma.fileHash.update({
    where: {
      hash: MetaData.hash,
    },
    data: {
      size: Size,
    }
  });

  await prisma.file.create({
    data: {
      userId: user.id,
      folderId: folder.folderId,
      name: MetaData.filename,
      hash: MetaData.hash,
      }
    });
}
