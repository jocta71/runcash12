
import React from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}

const ChatInput = ({ newMessage, setNewMessage, handleSendMessage }: ChatInputProps) => {
  return (
    <form onSubmit={handleSendMessage} className="p-3 border-t border-[#33333359] bg-[#0b0a0f]">
      <div className="flex items-center gap-1 bg-[#1A191F] rounded-md px-2 py-1">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Hi guys! What are you doing?"
          className="border-none bg-transparent text-white text-sm focus-visible:ring-0 focus-visible:ring-offset-0 h-8 placeholder:text-gray-500"
        />
        <div className="p-1 bg-[#1A191F] rounded-md">
          <Button type="submit" size="icon" variant="ghost" className="h-6 w-6 text-vegas-green hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0">
            <Send size={14} />
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
