import React from 'react';
import { motion } from 'framer-motion';

interface TransmissionStatus {
  sent: { 
    status: boolean;
    timestamp: string | null;
  };
  delivered: { 
    status: boolean;
    timestamp: string | null;
  };
  received: { 
    status: boolean;
    timestamp: string | null;
    deviceInfo: string | null;
  };
  seen: { 
    status: boolean;
    timestamp: string | null;
    viewDuration: number;
  };
}

interface MessageStatusProps {
  transmission: TransmissionStatus;
  className?: string;
  animate?: boolean;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ 
  transmission, 
  className = '',
  animate = true
}) => {
  // Determine the current status stage (sent, delivered, received, seen)
  const stage = transmission.seen.status ? 3 
    : transmission.received.status ? 2 
    : transmission.delivered.status ? 1 
    : 0;
  
  // Define colors for each stage
  const stageColors = ['#cccccc', '#aaee66', '#66ddee', '#aa66ff'];
  
  // Tooltip text based on stage
  const getTooltipText = () => {
    if (transmission.seen.status) {
      const timestamp = transmission.seen.timestamp ? new Date(transmission.seen.timestamp).toLocaleTimeString() : 'unknown time';
      return `Seen at ${timestamp}`;
    }
    if (transmission.received.status) {
      const timestamp = transmission.received.timestamp ? new Date(transmission.received.timestamp).toLocaleTimeString() : 'unknown time';
      const device = transmission.received.deviceInfo ? JSON.stringify(transmission.received.deviceInfo).substring(0, 20) + '...' : 'unknown device';
      return `Received at ${timestamp} on ${device}`;
    }
    if (transmission.delivered.status) {
      const timestamp = transmission.delivered.timestamp ? new Date(transmission.delivered.timestamp).toLocaleTimeString() : 'unknown time';
      return `Delivered at ${timestamp}`;
    }
    return 'Sent';
  };
  
  // Custom unique indicators instead of traditional checkmarks
  const renderUniqueIndicator = () => {
    return (
      <div className="flex items-center space-x-1" title={getTooltipText()}>
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={animate ? { scale: 0.5, opacity: 0.3 } : { scale: 1, opacity: i <= stage ? 1 : 0.3 }}
            animate={animate ? { 
              scale: i <= stage ? [0.5, 1.2, 1] : 0.5,
              opacity: i <= stage ? 1 : 0.3
            } : { scale: 1, opacity: i <= stage ? 1 : 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.15 }}
            className="relative"
          >
            {/* Use unique shapes for each stage */}
            {i === 0 && (
              // Sent - pulse circle
              <motion.div 
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: i <= stage ? stageColors[i] : '#555' }}
                animate={animate && i <= stage ? { scale: [1, 1.5, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
              />
            )}
            {i === 1 && (
              // Delivered - square
              <div 
                className="w-1.5 h-1.5 rotate-45"
                style={{ backgroundColor: i <= stage ? stageColors[i] : '#555' }}
              />
            )}
            {i === 2 && (
              // Received - triangle
              <div className="relative w-2 h-2">
                <div 
                  className="absolute transform w-0 h-0 
                    border-l-[4px] border-l-transparent 
                    border-r-[4px] border-r-transparent 
                    border-b-[6px]"
                  style={{ borderBottomColor: i <= stage ? stageColors[i] : '#555' }}
                />
              </div>
            )}
            {i === 3 && (
              // Seen - hexagon
              <div 
                className="w-2 h-1.5"
                style={{ backgroundColor: i <= stage ? stageColors[i] : '#555', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
              />
            )}
          </motion.div>
        ))}
      </div>
    );
  };
  
  return (
    <div className={`inline-flex items-center ${className}`}>
      {renderUniqueIndicator()}
    </div>
  );
};

export default MessageStatus; 