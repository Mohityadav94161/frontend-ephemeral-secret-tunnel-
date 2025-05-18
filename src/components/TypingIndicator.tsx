import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const [dots, setDots] = useState('.');

  // Animate dots to create typing effect
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [typingUsers]);

  if (typingUsers.length === 0) return null;

  let typingText = '';
  if (typingUsers.length === 1) {
    typingText = `${typingUsers[0]} is typing${dots}`;
  } else if (typingUsers.length === 2) {
    typingText = `${typingUsers[0]} and ${typingUsers[1]} are typing${dots}`;
  } else {
    typingText = `${typingUsers.length} people are typing${dots}`;
  }

  return (
    <div className="text-xs text-muted-foreground italic py-1 px-3">
      {typingText}
    </div>
  );
} 