import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../libs/prismadb';
import { createId } from '@paralleldrive/cuid2';

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
      filename: string;
      creation_time: string;
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
  console.log('Received hook request:', req.body);
  const hookResponse: HookResponse = { HTTPResponse: { Headers: {} } };

  try {
    if (req.method !== 'POST') {
      throw new Error('Method Not Allowed');
    }

    const hookRequest: HookRequest = req.body;

    switch (hookRequest.Type) {
      case 'pre-create':
        await handlePreCreate(hookRequest, hookResponse);
        break;
      case 'post-finish':
        await handlePostFinish(hookRequest);
        break;
      default:
        throw new Error('Unsupported hook type');
    }

    console.log('Responding with hook response:', hookResponse);
    res.status(200).json(hookResponse);
  } catch (error) {
    console.error('Error processing hook:', error);
    hookResponse.RejectUpload = true;
    hookResponse.HTTPResponse.StatusCode = error.message === 'Method Not Allowed' ? 405 : 400;
    hookResponse.HTTPResponse.Body = error.message;
    res.status(hookResponse.HTTPResponse.StatusCode).json(hookResponse);
  }
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
    hookResponse.ChangeFileInfo = {
      ID: `frspc-${createId()}`,
      MetaData: {
        tkn: metaData.tkn,
        filename: metaData.filename,
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
  console.log(`Upload ${ID} (${Size} bytes) is finished.`);

  const user = await prisma.user.findUnique({
    where: {
      id: MetaData.tkn
    }
  });

  const folder = await prisma.folder.findFirst({
    where: {
      name: "home",
      userId: user.id
    },
    select: {
      folderId: true
    }
  }) || await prisma.folder.create({
    data: {
      name: "home",
      userId: user.id
    }
  });

  await prisma.file.create({
    data: {
      path: "http://localhost/files/" + ID,
      name: MetaData.filename,
      size: Size,
      userId: user.id,
      folderId: folder.folderId
    }
  });
}
