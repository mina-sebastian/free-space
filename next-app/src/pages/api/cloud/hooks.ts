import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../../libs/prismadb'

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
        const hookRequest: HookRequest = req.body;
    
        // console.log('Received hook request:', hookRequest);

        if (hookRequest.Type === 'pre-create') {
          const metaData = hookRequest.Event.Upload.MetaData;
          // console.log("MetaData: ", metaData);
          const isValid = metaData && 'filename' in metaData;

          const user = await prisma.user.findUnique({
            where: {
              id: metaData.tkn
            }
          });

          if(!user){
            hookResponse.RejectUpload = true;
            hookResponse.HTTPResponse.StatusCode = 401;
            hookResponse.HTTPResponse.Body = 'Not Authorized';
          }else if (!isValid) {
            hookResponse.RejectUpload = true;
            hookResponse.HTTPResponse.StatusCode = 400;
            hookResponse.HTTPResponse.Body = 'No filename provided';
          } else {
            hookResponse.RejectUpload = false;
            hookResponse.HTTPResponse.StatusCode = 200;
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
    
        if (hookRequest.Type === 'post-finish') {
          const { ID, Size, MetaData } = hookRequest.Event.Upload;
          console.log("MetaData: ", MetaData);
          console.log(`Upload ${ID} (${Size} bytes) is finished.`);

          const user = await prisma.user.findUnique({
            where: {
              id: MetaData.tkn
            }
          });

          const folders = await prisma.folder.findMany({
            where: {
              name: "home",
              userId: user.id
            }
          });
          let folder = folders[0];
          if(!folder){
            folder = await prisma.folder.create({
              data: {
                name: "home",
                userId: user.id
              }
            });
          }

          const file = await prisma.file.create({
            data: {
              path: "http://localhost/files/"+ID,
              name: MetaData.filename,
              size: Size,
              userId: user.id,
              folderId: folder.folderId
            }
          });
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