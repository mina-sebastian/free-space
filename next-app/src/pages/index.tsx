import * as React from 'react';
import DefaultBg from "../../components/DefaultBg";
import axios from 'axios';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/router';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';
import cuid2 from '@paralleldrive/cuid2';
import WelcomeBg from '../../components/WelcomeBg';
import { Typography } from '@mui/material';
import IndexFileMenu from '../../components/main/IndexFileMenu';

export default function FolderPath({ fetchedDataInit }) {
  const router = useRouter();
  const [fetchedData, setFetchedData] = React.useState<any>(fetchedDataInit);
  const [refetchId, setRefetchId] = React.useState("initial");

  const getAllUserFilesAndFolders = async () => {
    try {
      const response = await axios.get('/api/folder/getAllUserFilesAndFolders');
      setFetchedData(response.data);
    } catch (error) {
      console.error('Error getting all user files and folders:', error);
    }
  };

  React.useEffect(() => {
    getAllUserFilesAndFolders();
    setRefetchId(cuid2.createId());
  }, []);

  return (
    <DefaultBg currentlyOpen={router.query.filepath} folderId={fetchedData?.folderId} refetchId={refetchId}>
      <WelcomeBg>
          <Typography variant="h4" align="center">
            free-space is a local cloud storage service that allows you to store your files on your server!
          </Typography>      
          <IndexFileMenu files={fetchedData?.files || []} />
      </WelcomeBg>

    </DefaultBg>
  );
}

export async function getServerSideProps(context) {
  const { req, res } = context;
  const session = await getServerSession(req, res, authOptions);
  // if (!session) {
  //   return {
  //     redirect: {
  //       destination: '/login',
  //       permanent: false,
  //     },
  //   };
  // }

  const homeFolder = await prisma.folder.findFirst({
    where: {
      userId: session?.user.id,
      outerFolderId: null,
      name: "Home",
    },
  });

  const binFolder = await prisma.folder.findFirst({
    where: {
      userId: session?.user.id,
      outerFolderId: null,
      name: "Bin",
    },
  });

  if (!homeFolder) {
    await prisma.folder.create({
      data: {
        name: "Home",
        userId: session?.user.id,
      },
    });
  }

  if (!binFolder) {
    await prisma.folder.create({
      data: {
        name: "Bin",
        userId: session?.user.id,
      },
    });
  }


  const files = await prisma.file.findMany({
    where: {
      userId: session?.user.id,
    },
    select: {
      fileId: true,
      hashFile: {
        select: {
          size: true,
        },
      },
      name: true,
      user: {
        select: {
          image: true,
          name: true,
          email: true,
        },
      },
      folderId: true,
    },
  });

  return {
    props: {
      fetchedDataInit: {
        files: files,
      },
    },
  };
}
