import React from 'react';
import { APP_STRINGS } from '@/constants';

const Footer = () => {
  return (
    <footer className="layout-footer">
      <small>{APP_STRINGS.COPYRIGHT} {APP_STRINGS.FOOTER}</small>
    </footer>
  );
};

export default Footer;