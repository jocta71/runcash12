
import React from 'react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from './types';

interface ChatMessageListProps {
  messages: ChatMessageType[];
}

const ChatMessageList = ({ messages }: ChatMessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-none bg-[#0b0a0f]">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
    </div>
  );
};

export default ChatMessageList;
