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

export async function getServerSideProps(context) {
  const { req, res } = context;
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const fileid = context.query.fileid[0];

  let file = await prisma.file.findUnique({
    where: {
      fileId: fileid,
    },
  });

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

  return {
    props: {
      file: {
        fileId: file.fileId,
        name: file.name,
      },
    },
  };
}
