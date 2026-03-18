import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import AnimatedText from '@components/animations/AnimatedText';

// Image imports
import watchChrono from '@assets/images/watch-chrono.png';
import watchClassic from '@assets/images/watch-classic.png'; // Assuming this image will be present

/**
 * Props for the AnimatedCraftsmanshipStep component.
 */
interface AnimatedCraftsmanshipStepProps {
  /** The title of the craftsmanship step. */
  title: string;
  /** A detailed description of the craftsmanship step. */
  description: string;
  /** URL of the image illustrating the step. */
  imageUrl: string;