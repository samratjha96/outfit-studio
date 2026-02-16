import { useState, useEffect } from 'react';

interface StatusBarProps {
  message: string | null;
  duration?: number;
}

export function StatusBar({ message, duration = 2000 }: StatusBarProps) {
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setDisplayMessage(message);
      const timer = setTimeout(() => {
        setDisplayMessage(null);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  if (!displayMessage) return null;

  return (
    <div className="toast">
      {displayMessage}
    </div>
  );
}
