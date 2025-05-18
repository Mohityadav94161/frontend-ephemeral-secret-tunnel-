import { useEffect, useState, useRef } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface TimerProps {
  expiryTime: Date;
  onExpire: () => void;
  onNearExpiry?: () => void;
  compact?: boolean;
}

const Timer = ({ expiryTime, onExpire, onNearExpiry, compact = false }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    percentage: number;
  }>({ hours: 0, minutes: 0, seconds: 0, percentage: 0 });
  
  const [isExpired, setIsExpired] = useState(false);
  const [nearExpiry, setNearExpiry] = useState(false);
  
  const totalDurationRef = useRef<number>(0);

  useEffect(() => {
    const now = new Date();
    totalDurationRef.current = expiryTime.getTime() - now.getTime();
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = expiryTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        onExpire();
        return { hours: 0, minutes: 0, seconds: 0, percentage: 100 };
      }
      
      const percentage = 100 - (difference / totalDurationRef.current * 100);
      
      if (percentage >= 90 && !nearExpiry) {
        setNearExpiry(true);
        if (onNearExpiry) {
          onNearExpiry();
        }
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds, percentage };
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expiryTime, onExpire, onNearExpiry, nearExpiry]);
  
  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const getTimerColor = () => {
    const totalSeconds = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
    
    if (isExpired) return 'text-warning';
    if (timeLeft.percentage >= 90) return 'text-warning';
    if (timeLeft.percentage >= 75) return 'text-yellow-500';
    return 'text-neon';
  };

  const getDisplayTime = () => {
    if (isExpired) return "Expired";
    
    if (compact) {
      if (timeLeft.hours > 0) {
        return `${timeLeft.hours}h ${timeLeft.minutes}m`;
      } else if (timeLeft.minutes > 0) {
        return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
      } else {
        return `${timeLeft.seconds}s`;
      }
    } else {
      return `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`;
    }
  };

  return (
    <div className={`flex items-center ${getTimerColor()}`}>
      {!compact && <Clock className="h-3 w-3 mr-1" />}
      {nearExpiry && !compact && <AlertCircle className="h-3 w-3 mr-1" />}
      <span className="text-xs">{getDisplayTime()}</span>
    </div>
  );
};

export default Timer;
