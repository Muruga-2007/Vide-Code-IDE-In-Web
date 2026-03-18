import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

import Button from '@components/ui/Button';
import AnimatedText from '@components/animations/AnimatedText';

import watchClassic from '@assets/images/watch-classic.png';
import watchChrono from '@assets/images/watch-chrono.png';

const HomePage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="bg-gray-100">
      <motion.div
        ref={heroRef}
        className="relative h-screen flex flex-col justify-center items-center bg-cover bg-center"
        style={{ opacity: heroOpacity }}
      >
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-gray-900 mb-4">
          <AnimatedText text="Timeless Watches" />
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8 text-center">
          Explore our collection of meticulously crafted timepieces.
        </p>
        <Button>Discover More</Button>
      </motion.div>

      <section className="py-16 bg-white">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-around">
          <div className="md:w-1/2 p-4">
            <img src={watchClassic} alt="Classic Watch" className="w-full rounded-lg shadow-md" />
          </div>
          <div className="md:w-1/2 p-4">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">Classic Design</h2>
            <p className="text-gray-600">
              Experience the elegance of our classic watch collection. Perfect for any occasion.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-around">
          <div className="md:w-1/2 p-4">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">Chrono Performance</h2>
            <p className="text-gray-600">
              Unleash the power of precision with our Chrono series. Built for performance and style.
            </p>
          </div>
          <div className="md:w-1/2 p-4">
            <img src={watchChrono} alt="Chrono Watch" className="w-full rounded-lg shadow-md" />
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8 text-center">
        <p>&copy; {new Date().getFullYear()} Watch Company. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;