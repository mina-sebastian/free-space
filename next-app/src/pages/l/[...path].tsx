
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

  const getFolderByPath = async (pathLink: string) => {
    try {
      const response = await axios.post('/api/folder/getFolderByLinkAndPath', { pathLink });
      setFetchedData(response.data);
    } catch (error) {
      console.error('Error getting folder by path:', error);
    }
  };

  React.useEffect(() => {
    const filepath = router.query.path as string[];
    // console.log("File path: " + filepath.join('/'));
    if (filepath) {
      getFolderByPath(filepath.join('/'));
    }
    setRefetchId(cuid2.createId());
  }, [router.query.path]);

  const breadcrumbItems = React.useMemo(() => {
    const path = router.query.path as string[];
    return path ? path.filter(Boolean) : [];
  }, [router.query.path]);

  const handleBreadcrumbClick = (path: string) => {
    router.push(`/l/${path}`);
  };

  return (
    <DefaultBg currentlyOpen={router.query.path} folderId={fetchedData?.folderId} refetchId={refetchId}>
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

const generateRecursiveOuterFolder = (paths, sharedFolderId) => {
  if (paths.length <= 1) {
    return {
      name: paths[0],
      outerFolderId: sharedFolderId
    };
  }
  return {
    name: paths[0],
    outerFolder: generateRecursiveOuterFolder(paths.slice(1), sharedFolderId)
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
  const initPath: string[] = context.query.path;

  // console.log("Path: ");
  // console.log(initPath);

  const linkId = initPath[0];
  const path = initPath.slice(1);

  // console.log("Link ID: " + linkId);

  const link = await prisma.link.findUnique({
    where: {
      path: linkId,
    },
    select: {
      folderId: true,
      fileId: true,
      file: {
        select: {
          fileId: true,
          hashFile: {
            select: {
              size: true,
            },
          },
          name: true,
        },
      },
      folder: {
        select: {
          userId: true,
        }
      }
    },
  });

  if (!link || !link.folderId) {
    return { notFound: true };
  }
  
  let whereQuery = {};
  // console.log(path)
  if(!path || path.length === 0){
    whereQuery = {
      folderId: link.folderId
    };
  }else{
  whereQuery = generateRecursiveOuterFolder([...path].reverse(), link.folderId);
  }

  // console.log("Where query: ");
  // console.log(whereQuery);

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
      // userId: user.id,
      ...whereQuery,
    },
  });

  // console.log("Folder: ");
  // console.log(folder);

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
