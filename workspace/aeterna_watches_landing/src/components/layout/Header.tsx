import React from 'react';
import { motion } from 'framer-motion';

// Define navigation items for the header
const navItems = [
  { name: 'Home', href: '#home' },
  { name: 'Collections', href: '#collections' },
  { name: 'Craftsmanship', href: '#craftsmanship' },
  { name: 'Boutiques', href: '#boutiques' },
  { name: 'Contact', href: '#contact' },
];

// Framer Motion variants for the header container animation
const headerVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      delay: 0.2, // Delay the header's appearance slightly
      when: 'beforeChildren', // Animate header first, then its direct children
    },
  },
};

// Framer Motion variants for individual navigation items
const navItemVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const Header: React.FC = () => {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-primary bg-opacity-80 backdrop-blur-sm shadow-lg"
      variants