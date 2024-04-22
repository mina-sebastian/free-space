import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../libs/prismadb'

import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

import { createId } from '@paralleldrive/cuid2';

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
  
  type HookResponse = {
    RejectUpload?: boolean;
    ChangeFileInfo?: {
      ID: string;
      MetaData: {
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
  

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HookResponse>
) {
    console.log('Received hook request:', req.body);
    const hookResponse: HookResponse = {
      HTTPResponse: {
        Headers: {},
      },
    };
    if (req.method === 'POST') {
        console.log('Received hook request:', req.body);
        const hookRequest: HookRequest = req.body;
    
        console.log('Received hook request:', hookRequest);

        if (hookRequest.Type === 'pre-create') {
          const metaData = hookRequest.Event.Upload.MetaData;
          const isValid = metaData && 'filename' in metaData;
          if (!isValid) {
            hookResponse.RejectUpload = true;
            hookResponse.HTTPResponse.StatusCode = 400;
            hookResponse.HTTPResponse.Body = 'no filename provided';
          } else {
            hookResponse.ChangeFileInfo = {
              ID: `frspc-${createId()}`,
              MetaData: {
                filename: metaData.filename,
                creation_time: new Date().toUTCString(),
              },
            };
          }
        }
    
        if (hookRequest.Type === 'post-finish') {
          const { ID, Size, Storage } = hookRequest.Event.Upload;
          console.log(`Upload ${ID} (${Size} bytes) is finished. Find the file at: ${Storage}`);
        }
    
        console.log('Responding with hook response:');
        console.log(hookResponse);
    
        return res.status(200).json(hookResponse);
      }else{
        hookResponse.RejectUpload = true;
        hookResponse.HTTPResponse.StatusCode = 405;
        hookResponse.HTTPResponse.Body = 'Method Not Allowed';
        return res.status(405).json(hookResponse);
      }
}