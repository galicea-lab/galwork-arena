// pages/_error.tsx
import { NextPage } from 'next';

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div>
      <h1>Error {statusCode || 'Client'}</h1>
      <p>
        {statusCode
          ? `An error ${statusCode} occurred on the server`
          : 'An error occurred on the client'}
      </p>
    </div>
  );
};

Error.getInitialProps = async ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;