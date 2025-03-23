import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, LogIn } from 'lucide-react';

export default function RegistrationSuccess() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Registration Successful!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your account has been created successfully. You can now sign in to access your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Link
            to="/signin"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#3498db] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3498db]"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}