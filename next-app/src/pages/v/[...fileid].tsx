import * as React from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import { useState } from 'react';



export default function FileViewer({ file }) {

  const [docs, setDocs] = useState([]);

  const handleFetchFile = async () => {
    const fileUrl = `/api/file/${file.fileId}/get`;

    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    setDocs([{ uri: url, fileType: file.name.split('.').pop(), fileName: file.name}]);
  };

  React.useEffect(() => {
    handleFetchFile();
  }, []);

  return (
    <DocViewer
      documents={docs}
      pluginRenderers={DocViewerRenderers}
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

  const file = await prisma.file.findUnique({
    where: {
      fileId: fileid,
    },
  });

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
