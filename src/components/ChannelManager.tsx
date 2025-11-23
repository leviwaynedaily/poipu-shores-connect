import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, X } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean | null;
}

interface ChannelManagerProps {
  onClose: () => void;
}

export const ChannelManager = ({ onClose }: ChannelManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [newChannel, setNewChannel] = useState({
    name: "",
    description: "",
    is_private: false,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    const { data } = await supabase
      .from("chat_channels")
      .select("*")
      .order("name");

    if (data) setChannels(data);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newChannel.name.trim()) return;

    const { error } = await supabase
      .from("chat_channels")
      .insert({
        name: newChannel.name.trim(),
        description: newChannel.description.trim() || null,
        is_private: newChannel.is_private,
        created_by: user.id,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Channel created successfully",
      });
      setNewChannel({ name: "", description: "", is_private: false });
      setShowCreateForm(false);
      fetchChannels();
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    const { error } = await supabase
      .from("chat_channels")
      .delete()
      .eq("id", channelId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Channel deleted successfully",
      });
      fetchChannels();
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Manage Channels</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showCreateForm ? (
          <Button onClick={() => setShowCreateForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create New Channel
          </Button>
        ) : (
          <form onSubmit={handleCreateChannel} className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                placeholder="e.g., Board Discussions"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="channel-description">Description (Optional)</Label>
              <Textarea
                id="channel-description"
                value={newChannel.description}
                onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                placeholder="What is this channel for?"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="channel-private">Private Channel</Label>
              <Switch
                id="channel-private"
                checked={newChannel.is_private}
                onCheckedChange={(checked) => setNewChannel({ ...newChannel, is_private: checked })}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Create Channel</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">Existing Channels</h3>
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">
                  {channel.name}
                  {channel.is_private && " 🔒"}
                </p>
                {channel.description && (
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteChannel(channel.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
