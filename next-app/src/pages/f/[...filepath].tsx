import * as React from 'react';
import DefaultBg from "../../../components/DefaultBg";
import FileMenu from "../../../components/main/FileMenu";
import axios from 'axios';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/router';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import cuid2 from '@paralleldrive/cuid2';

export default function FolderPath({ fetchedDataInit }) {
  const router = useRouter();
  const [fetchedData, setFetchedData] = React.useState<any>(fetchedDataInit);
  const [refetchId, setRefetchId] = React.useState("initial");

  const getFolderByPath = async (path: string) => {
    try {
      const response = await axios.post('/api/folder/getFolderByPath', { path });
      setFetchedData(response.data);
    } catch (error) {
      console.error('Error getting folder by path:', error);
    }
  };

  React.useEffect(() => {
    const filepath = router.query.filepath;
    if (filepath) {
      getFolderByPath(filepath as string);
    }
    setRefetchId(cuid2.createId());
  }, [router.query.filepath]);

  const breadcrumbItems = React.useMemo(() => {
    const path = router.query.filepath as string[];
    return path ? path.filter(Boolean) : [];
  }, [router.query.filepath]);

  const handleBreadcrumbClick = (path: string) => {
    router.push(`/f/${path}`);
  };

  return (
    <DefaultBg currentlyOpen={router.query.filepath} folderId={fetchedData?.folderId} refetchId={refetchId}>
      <div role="presentation">
        <Breadcrumbs separator="›" aria-label="breadcrumb">
          {breadcrumbItems.map((item, index) => (
            <Link
              key={index}
              underline="hover"
              color={index === breadcrumbItems.length - 1 ? "text.primary" : "inherit"}
              href="#"
              onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
                event.preventDefault(); // Prevent default anchor click behavior
                handleBreadcrumbClick(breadcrumbItems.slice(0, index + 1).join('/'));
              }}
              aria-current={index === breadcrumbItems.length - 1 ? "page" : undefined}
            >
              {item}
            </Link>
          ))}
        </Breadcrumbs>
      </div>
      <FileMenu folders={fetchedData?.folders || []} files={fetchedData?.files || []} />
    </DefaultBg>
  );
}

const generateRecursiveOuterFolder = (paths) => {
  if (paths.length <= 1) {
    return {
      name: paths[0],
      outerFolder: null
    };
  }
  return {
    name: paths[0],
    outerFolder: generateRecursiveOuterFolder(paths.slice(1))
  };
};

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

  const user = session.user;
  const path = context.query.filepath;

  const userDb = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  const homeFolder = await prisma.folder.findFirst({
    where: {
      userId: userDb.id,
      outerFolderId: null,
      name: "Home",
    },
  });

  const binFolder = await prisma.folder.findFirst({
    where: {
      userId: userDb.id,
      outerFolderId: null,
      name: "Bin",
    },
  });

  if (!homeFolder) {
    await prisma.folder.create({
      data: {
        name: "Home",
        userId: userDb.id,
      },
    });
  }

  if (!binFolder) {
    await prisma.folder.create({
      data: {
        name: "Bin",
        userId: userDb.id,
      },
    });
  }

  const whereQuery = generateRecursiveOuterFolder([...path].reverse());

  const folder = await prisma.folder.findFirst({
    select: {
      folderId: true,
      name: true,
      outerFolderId: true,
      innerFolders: {
        select: {
          folderId: true,
          name: true,
          outerFolderId: true,
        },
      },
      files: {
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
      },
    },
    where: {
      userId: user.id,
      ...whereQuery,
    },
  });

  if (!folder) {
    return { notFound: true };
  }

  return {
    props: {
      fetchedDataInit: {
        folders: folder.innerFolders,
        files: folder.files,
        folderId: folder.folderId,
      },
    },
  };
}
