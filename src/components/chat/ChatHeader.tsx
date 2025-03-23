
import React from 'react';
import { ArrowUpRight, Users } from 'lucide-react';
import { useActiveUsers } from '@/hooks/use-active-users';

const ChatHeader = () => {
  const activeUsers = useActiveUsers(124);
  
  return (
    <div className="bg-[#1A191F] p-3 border-b border-[#33333359]">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-medium">Chat ao Vivo</h3>
        <div className="flex items-center gap-1 text-xs">
          <Users size={14} className="text-vegas-green" />
          <span className="text-white">{activeUsers.count}</span>
          {activeUsers.trend === 'up' && <ArrowUpRight size={14} className="text-vegas-green" />}
          {activeUsers.trend === 'down' && <ArrowUpRight size={14} className="text-red-500 rotate-180" />}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
