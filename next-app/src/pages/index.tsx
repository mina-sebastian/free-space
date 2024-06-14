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

// Define the FolderPath component
export default function FolderPath({ fetchedDataInit }) {
  const session = useSession(); // Initialize session for authentication
  const router = useRouter(); // Initialize router for navigation
  const [fetchedData, setFetchedData] = React.useState<any>(fetchedDataInit); // Initialize fetchedData state
  const [refetchId, setRefetchId] = React.useState("initial"); // Initialize refetchId state

  const getAllUserFilesAndFolders = async () => { // Function to get all user files and folders
    try {
      const response = await axios.get('/api/folder/getAllUserFilesAndFolders'); // Send a GET request to the getAllUserFilesAndFolders API
      setFetchedData(response.data); // Set the fetchedData state with the response data
    } catch (error) {
      console.error('Error getting all user files and folders:', error);
    }
  };

  React.useEffect(() => { // Fetch all user files and folders on component mount
    getAllUserFilesAndFolders();
    setRefetchId(cuid2.createId()); // Generate a new refetchId
  }, []);

  return (
    <DefaultBg currentlyOpen={router.query.filepath} folderId={fetchedData?.folderId} refetchId={refetchId}>
      <WelcomeBg>
          <Typography variant="h4" align="center">
            free-space is a local cloud storage service that allows you to store your files on your server!
          </Typography>      
          
      </WelcomeBg>

      {!!session.data && <IndexFileMenu files={fetchedData?.files || []} />}
    </DefaultBg>
  );
}

export async function getServerSideProps(context) { // Get server-side props
  const { req, res } = context;
  const session = await getServerSession(req, res, authOptions); // Retrieve the session using getServerSession with the provided authOptions
  // if (!session) {
  //   return {
  //     redirect: {
  //       destination: '/login',
  //       permanent: false,
  //     },
  //   };
  // }

  const homeFolder = await prisma.folder.findFirst({ // Find the home folder
    where: {
      userId: session?.user.id,
      outerFolderId: null,
      name: "Home",
    },
  });

  const binFolder = await prisma.folder.findFirst({ // Find the bin folder
    where: {
      userId: session?.user.id,
      outerFolderId: null,
      name: "Bin",
    },
  });

  if (!homeFolder) {
    await prisma.folder.create({ // Create the home folder
      data: {
        name: "Home",
        userId: session?.user.id,
      },
    });
  }

  if (!binFolder) {
    await prisma.folder.create({ // Create the bin folder
      data: {
        name: "Bin",
        userId: session?.user.id,
      },
    });
  }


  const files = await prisma.file.findMany({ // Find all files
    where: {
      userId: session ? session.user.id : "UNKNOWN_USER_ID", // Use the session user id or a placeholder
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
