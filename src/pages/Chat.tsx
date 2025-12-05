import { useState } from 'react';
import { useChat } from '@/hooks/use-chat';
import { usePageConfig } from '@/hooks/use-page-config';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageHeader } from '@/components/PageHeader';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { ChatView } from '@/components/chat/ChatView';
import { cn } from '@/lib/utils';

const Chat = () => {
  const { pageConfig } = usePageConfig();
  const isMobile = useMobile();
  const [showSidebar, setShowSidebar] = useState(true);

  const {
    conversations,
    selectedChannelId,
    setSelectedChannelId,
    messages,
    typingUsers,
    sendMessage,
    deleteMessage,
    addReaction,
    startDirectMessage,
    createGroup,
    startTyping
  } = useChat();

  const selectedConversation = conversations.find(c => c.id === selectedChannelId) || null;

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBack = () => {
    setShowSidebar(true);
  };

  return (
    <div className="space-y-3 md:space-y-6">
      <PageHeader
        title={pageConfig?.title || "Community Chat"}
        description={pageConfig?.subtitle || "Connect with your neighbors and community"}
        logoUrl={pageConfig?.headerLogoUrl}
      />

      <div className="h-[calc(100dvh-12rem)] md:h-[calc(100vh-14rem)] rounded-lg border border-border overflow-hidden bg-card">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className={cn(
            'h-full border-r border-border',
            isMobile ? 'w-full' : 'w-80 shrink-0',
            isMobile && !showSidebar && 'hidden'
          )}>
            <ConversationSidebar
              conversations={conversations}
              selectedChannelId={selectedChannelId}
              onSelectChannel={handleSelectChannel}
              onStartDM={startDirectMessage}
              onCreateGroup={createGroup}
            />
          </div>

          {/* Chat View */}
          <div className={cn(
            'flex-1 h-full',
            isMobile && showSidebar && 'hidden'
          )}>
            <ChatView
              conversation={selectedConversation}
              messages={messages}
              typingUsers={typingUsers}
              onSendMessage={sendMessage}
              onDeleteMessage={deleteMessage}
              onReaction={addReaction}
              onTyping={startTyping}
              onBack={handleBack}
              showBackButton={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
