import * as React from 'react';
import DocViewer, { BMPRenderer, CSVRenderer, DocRenderer, PDFRenderer, PNGRenderer, JPGRenderer, WebPRenderer, GIFRenderer, MSDocRenderer, TIFFRenderer, TXTRenderer,   } from "@cyntler/react-doc-viewer";
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import MyCustomVideoRenderer from '../../../components/renderer/CustomVideoRenderer';
import MyCustomTextRenderer from '../../../components/renderer/CustomCodingREnderer';

export default function FileViewer({ file }) {
  return (
    <DocViewer
    
      documents={[{ uri: `/api/file/${file.fileId}/get`, fileType: file.name.split('.').pop(), fileName: file.name}]}
      pluginRenderers={[ TXTRenderer, TIFFRenderer, BMPRenderer, CSVRenderer, PDFRenderer, PNGRenderer, JPGRenderer, WebPRenderer, MyCustomVideoRenderer, GIFRenderer, MSDocRenderer, MyCustomTextRenderer ]}
    />
  );
}

const isInFolder = async (folderId, sharedFolderId) => {
  if(folderId == sharedFolderId)
    return true;
  const folder = await prisma.folder.findUnique({
    where: {
      folderId: folderId
    },
    select: {
      outerFolderId: true
    }
  });
  if(folder.outerFolderId == null)
    return false;

  return isInFolder(folder.outerFolderId, sharedFolderId);
}

export async function getServerSideProps(context) {
  const { req, res } = context;
  const session = await getServerSession(req, res, authOptions);

  const query = context.query.q;

  console.log(query);

  const link_quest = await prisma.link.findUnique({
    where: {
      path: query,
    },
    select: {
      canSee: true,
      folderId: true
    }
  });

  if ((!link_quest || link_quest.canSee != "ALL") && !session) {
    return {
      notFound: true,
    };
  }

  const fileid = context.query.fileid[0];

  let file = await prisma.file.findUnique({
    where: {
      fileId: fileid,
    },
    select: {
      userId: true,
      folderId: true,
      name: true,
      fileId: true
    }
  });

  if(!!file && (!session || (file.userId != session.user.id))){
    //verify recursively if the file is in a folder that the user has access
    if(!isInFolder(file.folderId, link_quest.folderId)){
      return {
        notFound: true,
      };
    }
  }

  if(!file){
    const link_file = await prisma.link.findUnique({
      where: { path: fileid },
      select:{
        file: {
          include: {
            hashFile: true
          }
        }
      }
    });
    if(link_file && link_file.file)
      file = link_file.file;
  }

  if (!file) {
    return {
      notFound: true,
    };
  }

  console.log(file);
  console.log("TOTO BENE");

  return {
    props: {
      file: {
        fileId: file.fileId,
        name: file.name,
      },
    },
  };
}
