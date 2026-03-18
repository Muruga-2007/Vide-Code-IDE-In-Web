import React, { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation, Variants } from 'framer-motion';

// Define the props for the AnimatedText component
interface AnimatedTextProps {
  /** The string content to animate. */
  text: string;
  /** How to split the text for animation: 'character' or 'word'. Defaults to 'word'. */
  type?: 'character' | 'word';
  /** Initial delay before the entire animation starts for the container. Defaults to 0. */