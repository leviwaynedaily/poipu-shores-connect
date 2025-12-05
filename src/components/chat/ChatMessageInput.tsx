import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Send, Image, X, Loader2, Smile } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';

const EMOJI_PICKER = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👋', '❤️', '🎉', '🔥', '✨', '💯', '🙏', '👏', '😢'];

interface ChatMessageInputProps {
  onSendMessage: (content: string, imageUrl?: string, replyToId?: string) => Promise<any>;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  onTyping: () => void;
  disabled?: boolean;
}

export function ChatMessageInput({
  onSendMessage,
  replyingTo,
  onCancelReply,
  onTyping,
  disabled
}: ChatMessageInputProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea with animation
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if ((!message.trim() && !imagePreview) || disabled) return;

    setIsSending(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const url = await uploadImage();
        if (!url && !message.trim()) return; // Abort if image upload failed and no text
        imageUrl = url || undefined;
      }

      await onSendMessage(message.trim(), imageUrl, replyingTo?.id);
      
      setMessage('');
      setImagePreview(null);
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel reply on Escape
    if (e.key === 'Escape' && replyingTo) {
      onCancelReply();
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-3">
      {/* Reply preview */}
      {replyingTo && (
        <div className={cn(
          'flex items-center gap-2 mb-2 px-3 py-2 bg-muted/80 rounded-lg border-l-2 border-primary',
          'animate-in slide-in-from-bottom-2 duration-200'
        )}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">
              Replying to {replyingTo.profiles.full_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyingTo.content || '[Image]'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 rounded-full hover:bg-background"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block mb-2 animate-in fade-in zoom-in-95 duration-200">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-20 rounded-lg object-cover shadow-md"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
            onClick={clearImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <div className="flex gap-0.5">
          {/* Emoji picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9 rounded-full hover:bg-muted"
                disabled={disabled}
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" side="top" align="start">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_PICKER.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-xl hover:scale-125 transition-transform duration-150 p-1.5 rounded-md hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Image upload */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 rounded-full hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Image className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              onTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={cn(
              'min-h-[40px] max-h-[120px] resize-none',
              'py-2.5 px-4 pr-12',
              'bg-muted/50 border-transparent rounded-2xl',
              'focus:bg-background focus:border-border',
              'transition-all duration-200',
              'placeholder:text-muted-foreground/60'
            )}
            disabled={disabled}
            rows={1}
          />
        </div>

        <Button
          type="submit"
          size="icon"
          className={cn(
            'shrink-0 h-9 w-9 rounded-full',
            'transition-all duration-200',
            'shadow-md hover:shadow-lg',
            (!message.trim() && !imagePreview) && 'opacity-50'
          )}
          disabled={(!message.trim() && !imagePreview) || disabled || isSending || isUploading}
        >
          {isSending || isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}