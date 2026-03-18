import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-800 text-text-light py-6 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="mb-4 md:mb-0">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Aeterna Watches. All rights reserved.
          </p>
        </div>
        <div>
          <ul className="flex space-x-4">
            <li>
              <a href="#" className="hover:text-accent transition-colors duration-200">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-accent transition-colors duration-200">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-accent transition-colors duration-200">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;