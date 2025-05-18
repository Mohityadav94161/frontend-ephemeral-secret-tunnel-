import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
}

const CopyButton = ({ text, className = '', label }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      size="sm"
      variant="ghost" 
      onClick={handleCopy}
      className={`hover:bg-neon/10 hover:text-neon ${className}`}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-1" />
      ) : (
        <Copy className="h-4 w-4 mr-1" />
      )}
      {copied ? "Copied" : label || "Copy"}
    </Button>
  );
};

export default CopyButton;
