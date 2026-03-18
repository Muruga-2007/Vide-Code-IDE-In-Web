import React from 'react';
import { Watch } from '@/types';
import Button from './Button';

interface WatchCardProps {
  /** The watch object to display in the card. */
  watch: Watch;
  /** Optional callback function when the "View Details" button is clicked.
   * It receives the ID of the watch as an argument.
   */
  onViewDetails?: (watchId: string) => void;
}

/**
 * WatchCard component displays a single luxury watch model with its image, name,
 * description, price, and a "View Details" button.
 * It's designed to be responsive and visually appealing within the Aeterna Watches theme.
 */
const WatchCard: React.FC<WatchCardProps> = ({ watch, onViewDetails }) => {
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(watch.id);
    } else {
      // Fallback or placeholder action if no onViewDetails prop is provided
      console.log(`Navigating to details for watch: ${watch.name} (ID: ${watch.id})`);
      // In a real application, this might trigger a modal, a route change, etc.
    }
  };

  return (
    <div className="bg-neutral-800 rounded-lg shadow-xl overflow-hidden flex flex-col items-center justify-between p-6 m-4 max-w-sm mx-auto transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
      {/* Watch Image */}
      <div className="w-full h-64 flex items-center justify-center mb-4">
        <img
          src={watch.imageUrl}
          alt={watch.name}
          className="max-w-full max-h-full object-contain"
          loading="lazy" // Optimize image loading
        />
      </div>

      {/* Watch Details */}
      <div className="text-center mb-6 flex-grow">
        <h3 className="text-2xl font-semibold text-text-light mb-2">
          {watch.name}
        </h3>
        <p className="text-text-light text-opacity-75 mb-4 line-clamp-3">
          {watch.description}
        </p>
        <p className="text-accent text-xl font-bold">
          {watch.price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* View Details Button */}
      <Button variant="accent" onClick={handleViewDetails} className="w-full">
        View Details
      </Button>
    </div>
  );
};

export default WatchCard;