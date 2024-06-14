import * as React from 'react';
import DocViewer, { BMPRenderer, CSVRenderer, DocRenderer, PDFRenderer, PNGRenderer, JPGRenderer, WebPRenderer, GIFRenderer, MSDocRenderer, TIFFRenderer, TXTRenderer,   } from "@cyntler/react-doc-viewer";
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import MyCustomVideoRenderer from '../../../components/renderer/CustomVideoRenderer';
import MyCustomTextRenderer from '../../../components/renderer/CustomCodingRenderer';

// Define the FileViewer component
export default function FileViewer({ file }) {
  return (
    <DocViewer
    
      documents={[{ uri: `/api/file/${file.fileId}/get`, fileType: file.name.split('.').pop(), fileName: file.name}]}
      pluginRenderers={[ TXTRenderer, TIFFRenderer, BMPRenderer, CSVRenderer, PDFRenderer, PNGRenderer, JPGRenderer, WebPRenderer, MyCustomVideoRenderer, GIFRenderer, MSDocRenderer, MyCustomTextRenderer ]}
    />
  );
}

const isInFolder = async (folderId, sharedFolderId) => { // Function to check if a folder is in another folder
  if(folderId == sharedFolderId)
    return true;
  const folder = await prisma.folder.findUnique({ // Find the folder by folderId
    where: {
      folderId: folderId
    },
    select: {
      outerFolderId: true
    }
  });
  if(folder.outerFolderId == null)
    return false;

  return isInFolder(folder.outerFolderId, sharedFolderId); // Recursively check the outer folder
}

export async function getServerSideProps(context) { // Get server-side props
  const { req, res } = context;
  const session = await getServerSession(req, res, authOptions); // Retrieve the session using getServerSession with the provided authOptions

  const query = context.query.q;

  console.log(query);

  const link_quest = await prisma.link.findUnique({ // Find the link by path
    where: {
      path: !!query ? query : "UNKNOWN_PATH",
    },
    select: {
      canSee: true,
      folderId: true
    }
  });

  if ((!link_quest || link_quest.canSee != "ALL") && !session) { // If the link requires authentication and no session is found
    return {
      notFound: true,
    };
  }

  const fileid = context.query.fileid[0]; // Extract the fileid from the context query

  let file = await prisma.file.findUnique({ // Find the file by fileId
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
    const link_file = await prisma.link.findUnique({ // Find the link by path
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
      notFound: true, // Return not found if the file is not found
    };
  }

  return {
    props: { // Return the file as props
      file: {
        fileId: file.fileId,
        name: file.name,
      },
    },
  };
}
