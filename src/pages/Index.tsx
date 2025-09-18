import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Hero from '@/components/Hero';
import CategorySection from '@/components/CategorySection';
import VideoPlayer from '@/components/VideoPlayer';
import { parseM3U, loadPlaylists, M3UChannel, M3UPlaylist } from '@/utils/m3u-parser';
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playlists, setPlaylists] = useState<M3UPlaylist[]>([]);
  const [allChannels, setAllChannels] = useState<M3UChannel[]>([]);
  const [searchResults, setSearchResults] = useState<M3UChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadM3UPlaylists();
  }, []);

  const loadM3UPlaylists = async () => {
    setLoading(true);
    try {
      const loadedPlaylists = await loadPlaylists();
      setPlaylists(loadedPlaylists);
      
      // Combine all channels for search
      const combined = loadedPlaylists.flatMap(playlist => playlist.channels);
      setAllChannels(combined);
      
      toast({
        title: "Playlists Loaded",
        description: `${combined.length} channels from ${loadedPlaylists.length} playlists`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load playlists",
        variant: "destructive",
        duration: 3000,
      });
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const filtered = allChannels.filter(channel => 
      channel.name.toLowerCase().includes(query.toLowerCase()) ||
      channel.category.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered.slice(0, 10)); // Limit to 10 results
  };

  // Group channels by category for display
  const channelsByCategory = playlists.length > 0 ? 
    playlists.reduce((acc, playlist) => {
      const groupedByCategory = playlist.channels.reduce((catAcc, channel) => {
        const category = channel.category || 'General';
        if (!catAcc[category]) {
          catAcc[category] = [];
        }
        catAcc[category].push(channel);
        return catAcc;
      }, {} as Record<string, M3UChannel[]>);
      
      Object.keys(groupedByCategory).forEach(category => {
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category] = [...acc[category], ...groupedByCategory[category]];
      });
      
      return acc;
    }, {} as Record<string, M3UChannel[]>) : {};

  const handleChannelClick = (channel: any) => {
    setSelectedChannel(channel);
    setIsPlayerOpen(true);
    toast({
      title: "Now Streaming",
      description: `Loading ${channel.name}`,
      duration: 2000,
    });
  };

  const getRelatedChannels = (currentChannel: any) => {
    const categoryChannels = channelsByCategory[currentChannel?.category] || [];
    return categoryChannels.filter(ch => ch.id !== currentChannel?.id).slice(0, 8);
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedChannel(null);
  };

  return (
    <Layout
      onSearch={handleSearch}
      searchResults={searchResults}
      onChannelSelect={handleChannelClick}
    >
      <div className="pb-20 lg:pb-4">
        {/* Hero Section */}
        <Hero />

        {loading ? (
          <div className="container mx-auto px-4 py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading M3U playlists...</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(channelsByCategory).map(([category, channels]) => (
              <CategorySection
                key={category}
                title={category}
                channels={channels}
                onChannelClick={handleChannelClick}
              />
            ))}
            
            {Object.keys(channelsByCategory).length === 0 && (
              <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-lg text-muted-foreground">No channels available</p>
                <button 
                  onClick={loadM3UPlaylists}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Retry Loading
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Section */}
        <footer className="glass border-t border-border/50 mt-16">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                StreamVibe
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your ultimate destination for free streaming content. Watch anywhere, anytime.
              </p>
              <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">About</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
                <a href="#" className="hover:text-primary transition-colors">Support</a>
                <a href="/auth" className="hover:text-primary transition-colors">Login</a>
                <a href="/admin" className="hover:text-primary transition-colors">Admin</a>
              </div>
              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  © 2024 StreamVibe. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Video Player Modal */}
      <VideoPlayer
        isOpen={isPlayerOpen}
        onClose={closePlayer}
        channel={selectedChannel}
        relatedChannels={getRelatedChannels(selectedChannel)}
        onChannelSelect={handleChannelClick}
      />
    </Layout>
  );
};

export default Index;