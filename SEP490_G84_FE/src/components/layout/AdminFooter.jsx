import React from 'react';
import { APP_STRINGS } from '@/constants';

const AdminFooter = () => {
  return (
    <footer className="py-3 px-4 mt-auto bg-light border-top text-center">
      <small className="text-muted">
        {APP_STRINGS.COPYRIGHT} {APP_STRINGS.FOOTER}
      </small>
    </footer>
  );
};

export default AdminFooter;