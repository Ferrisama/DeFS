import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Decentralized File Storage
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Secure, encrypted, and decentralized file management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <button
            onClick={() => loginWithRedirect()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in to get started
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
