import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * HeroSection component displays a cinematic video background with an animated headline.
 * It uses Framer Motion for both initial load animation and scroll-based parallax effects.
 */
const HeroSection: React.FC = () => {
  const ref = React.useRef<HTMLElement>(null);

  // Track scroll progress within the HeroSection
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'], // Animation starts when target's top hits viewport top, ends when target's bottom hits viewport top
  });

  // Transform scroll progress to control opacity for a fade-out effect
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]); // Fades out over the first 50% of the scroll range

  // Transform scroll progress to control Y position for a parallax effect
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']); // Moves down 50% of its height as the section scrolls

  return (
    <motion.section
      ref={ref}
      className="relative h-screen w-full flex items-center justify-center overflow-hidden"
      // Ensure the section takes full viewport height and clips content
    >
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/hero-background.mp4" // Path to the video asset in the public folder
        autoPlay
        loop
        muted // Mute for autoplay best practice
        playsInline // Important for autoplay on mobile devices
        preload="auto" // Preload video for faster display
        aria-label="Background video of a luxury watch"
      >
        Your browser does not support the video tag.
      </video>

      {/* Overlay for content and darkening effect */}
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4">
        <motion.h1
          // Apply scroll-based transformations to style
          style={{ opacity, y }}
          // Initial animation for when the component mounts
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-text-light text-center leading-tight tracking-tight drop-shadow-lg max-w-4xl"
        >
          AETERNA
          <br />
          TIMELESS ELEGANCE
        </motion.h1>
      </div>
    </motion.section>
  );
};

export default HeroSection;