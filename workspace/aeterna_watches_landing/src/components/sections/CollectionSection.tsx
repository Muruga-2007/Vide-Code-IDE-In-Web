import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Watch } from '@types';
import Button from '@components/ui/Button';

// Image imports - ensure these paths are correct and images exist
import watchChrono from '@assets/images/watch-chrono.png';
import watchClassic from '@assets/images/watch-classic.png';

// Mock data for watches
const MOCK_WATCHES: Watch[] = [