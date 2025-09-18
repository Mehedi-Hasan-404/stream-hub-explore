import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Upload, Link as LinkIcon, Home, Settings as SettingsIcon, Tv, FileText, Play, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AdminPanel = () => {
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  
  const [sections, setSections] = useState([]);
  const [channels, setChannels] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [settings, setSettings] = useState({ id: '', title: '', description: '', logo_url: '' });
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newChannel, setNewChannel] = useState({
    name: '',
    section_id: '',
    stream_url: '',
    logo_url: '',
    description: ''
  });
  
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    url: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load sections
      const { data: sectionsData } = await supabase
        .from('sections')
        .select('*')
        .order('name');
      setSections(sectionsData || []);

      // Load channels
      const { data: channelsData } = await supabase
        .from('channels')
        .select(`
          *,
          sections (name)
        `)
        .order('name');
      setChannels(channelsData || []);

      // Load playlists
      const { data: playlistsData } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });
      setPlaylists(playlistsData || []);

      // Load settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .single();
      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async () => {
    if (!newChannel.name || !newChannel.section_id || !newChannel.stream_url) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('channels')
        .insert([newChannel])
        .select();

      if (error) throw error;

      toast({
        title: "Channel added",
        description: `${newChannel.name} has been added successfully`,
      });
      
      setNewChannel({
        name: '',
        section_id: '',
        stream_url: '',
        logo_url: '',
        description: ''
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add channel",
        variant: "destructive",
      });
    }
  };

  const handleAddPlaylist = async () => {
    if (!newPlaylist.name || !newPlaylist.url) {
      toast({
        title: "Missing fields", 
        description: "Please provide playlist name and URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert([newPlaylist])
        .select();

      if (error) throw error;

      toast({
        title: "Playlist added",
        description: `${newPlaylist.name} has been added successfully`,
      });
      
      setNewPlaylist({
        name: '',
        url: '',
        description: ''
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add playlist",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          title: settings.title,
          description: settings.description,
          logo_url: settings.logo_url
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Site settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;

      toast({
        title: "Channel deleted",
        description: "Channel has been removed successfully",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete channel",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Play className="h-8 w-8 text-primary animate-pulse" fill="currentColor" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-glow"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  StreamVibe Admin
                </h1>
                <p className="text-sm text-muted-foreground">Welcome, {user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="sections" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Sections Management */}
          <TabsContent value="sections" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Content Sections</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Slug: {section.slug}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Channels: {channels.filter(ch => ch.section_id === section.id).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Channel Management */}
          <TabsContent value="channels" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Channel Management</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Add New Channel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="channel-name">Channel Name</Label>
                    <Input 
                      id="channel-name" 
                      placeholder="Channel name"
                      value={newChannel.name}
                      onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="channel-section">Section</Label>
                    <Select 
                      value={newChannel.section_id}
                      onValueChange={(value) => setNewChannel({...newChannel, section_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="stream-url">Stream URL (M3U8)</Label>
                  <Input 
                    id="stream-url" 
                    placeholder="https://example.com/stream.m3u8"
                    value={newChannel.stream_url}
                    onChange={(e) => setNewChannel({...newChannel, stream_url: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="channel-logo">Channel Logo URL</Label>
                  <Input 
                    id="channel-logo" 
                    placeholder="https://example.com/logo.png"
                    value={newChannel.logo_url}
                    onChange={(e) => setNewChannel({...newChannel, logo_url: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="channel-description">Description</Label>
                  <Textarea 
                    id="channel-description" 
                    placeholder="Channel description"
                    value={newChannel.description}
                    onChange={(e) => setNewChannel({...newChannel, description: e.target.value})}
                  />
                </div>

                <Button className="w-full" onClick={handleAddChannel}>
                  <Plus className="h-4 w-4 mr-2" />
                  Save Channel
                </Button>
              </CardContent>
            </Card>

            {/* Existing Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((channel) => (
                <Card key={channel.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">{channel.name}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteChannel(channel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Section: {channel.sections?.name}
                      </p>
                      <Badge variant={channel.is_active ? "default" : "secondary"}>
                        {channel.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Playlist Management */}
          <TabsContent value="playlists" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">M3U Playlist Management</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Add Playlist by URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="playlist-url">M3U Playlist URL</Label>
                  <Input 
                    id="playlist-url" 
                    placeholder="https://example.com/playlist.m3u"
                    value={newPlaylist.url}
                    onChange={(e) => setNewPlaylist({...newPlaylist, url: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="playlist-name">Playlist Name</Label>
                  <Input 
                    id="playlist-name" 
                    placeholder="My Playlist"
                    value={newPlaylist.name}
                    onChange={(e) => setNewPlaylist({...newPlaylist, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="playlist-description">Description</Label>
                  <Textarea 
                    id="playlist-description" 
                    placeholder="Playlist description"
                    value={newPlaylist.description}
                    onChange={(e) => setNewPlaylist({...newPlaylist, description: e.target.value})}
                  />
                </div>
                <Button className="w-full" onClick={handleAddPlaylist}>
                  <Plus className="h-4 w-4 mr-2" />
                  Import Playlist
                </Button>
              </CardContent>
            </Card>

            {/* Existing Playlists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playlists.map((playlist) => (
                <Card key={playlist.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{playlist.name}</CardTitle>
                    {playlist.description && (
                      <CardDescription>{playlist.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Added: {new Date(playlist.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-semibold">Site Settings</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="site-title">Site Title</Label>
                  <Input 
                    id="site-title" 
                    value={settings.title}
                    onChange={(e) => setSettings({...settings, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="site-description">Site Description</Label>
                  <Textarea 
                    id="site-description" 
                    value={settings.description}
                    onChange={(e) => setSettings({...settings, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input 
                    id="logo-url" 
                    placeholder="https://example.com/logo.png"
                    value={settings.logo_url || ''}
                    onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                  />
                </div>

                <Button className="w-full" onClick={handleSaveSettings}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
