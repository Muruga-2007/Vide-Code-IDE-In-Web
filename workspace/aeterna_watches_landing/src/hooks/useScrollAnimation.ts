import { useRef } from 'react';
import { useScroll, useTransform, MotionValue } from 'framer-motion';

// Define a type for the scroll offset property from useScroll
type ScrollOffset = Parameters<typeof useScroll>[0]['offset'];

interface ScrollAnimationOptions<T extends HTMLElement> {
  /**
   * The scroll offset for the target element.
   * Defines when the animation starts and ends relative to the viewport.
   * Example: ["start end", "end start"] means animation starts when element's start hits viewport'