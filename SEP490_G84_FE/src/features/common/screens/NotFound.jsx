import React from 'react';
import { useNavigate } from 'react-router-dom';
import Buttons from '@/components/ui/Buttons';
import { APP_STRINGS } from '@/constants';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-6">
      <div className="mb-6 opacity-50">
        <i className="bi bi-cone-striped text-[5rem] text-brand" />
      </div>
      <h1 className="text-7xl font-bold text-brand tracking-widest">404</h1>
      <h2 className="text-2xl font-bold mb-3 text-gray-900 mt-2">Room Not Found?</h2>
      <p className="text-gray-500 mb-8 max-w-[500px]">
        Sorry, it looks like you're trying to open a door that doesn't exist or this page is under maintenance.
        Please return to the main dashboard.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Buttons variant="outline" onClick={() => navigate(-1)} icon={<i className="bi bi-arrow-left" />}>
          Go Back
        </Buttons>
        <Buttons onClick={() => navigate('/dashboard')} icon={<i className="bi bi-house-door-fill" />} className="shadow-sm">
          Return to Dashboard
        </Buttons>
      </div>
      <div className="mt-12 text-gray-500 text-sm fixed bottom-0 pb-4">
        {APP_STRINGS.APP_NAME} System
      </div>
    </div>
  );
};

export default NotFound;