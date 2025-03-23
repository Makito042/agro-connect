import React, { useState } from 'react';
import { 
  MessageCircle, 
  Image as ImageIcon, 
  Video, 
  Send, 
  ThumbsUp, 
  MessageSquare,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
}

const SAMPLE_POSTS: Post[] = [
  {
    id: '1',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
    content: "Just implemented a new drip irrigation system that has reduced our water usage by 40%! Here is a look at the setup. #SustainableAgriculture",
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=800',
    },
    likes: 45,
    comments: 12,
    shares: 8,
    timestamp: new Date('2024-03-15T09:24:00'),
  },
  {
    id: '2',
    author: {
      name: 'Michael Chen',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    },
    content: 'Check out our latest video on organic pest control methods that have worked wonders for our tomato crops!',
    media: {
      type: 'video',
      url: 'https://player.vimeo.com/video/876668456',
    },
    likes: 89,
    comments: 23,
    shares: 15,
    timestamp: new Date('2024-03-14T16:30:00'),
  },
  {
    id: '3',
    author: {
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    content: 'Looking for advice on companion planting with marigolds. Has anyone tried this with their vegetable gardens? What results did you see?',
    likes: 32,
    comments: 28,
    shares: 5,
    timestamp: new Date('2024-03-14T11:15:00'),
  },
];

export default function Forum() {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none');

  const handlePost = () => {
    if (!newPost.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      author: {
        name: 'Current User',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      },
      content: newPost,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: new Date(),
    };

    setPosts([post, ...posts]);
    setNewPost('');
    setMediaType('none');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Create Post */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start space-x-4">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
              alt="Current user"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your farming experience..."
                className="w-full border border-gray-200 rounded-lg p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setMediaType('image')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      mediaType === 'image' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ImageIcon size={20} />
                    <span>Photo</span>
                  </button>
                  <button
                    onClick={() => setMediaType('video')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      mediaType === 'video' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Video size={20} />
                    <span>Video</span>
                  </button>
                </div>
                <button
                  onClick={handlePost}
                  disabled={!newPost.trim()}
                  className="bg-[#3498db] text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                  <span>Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{post.author.name}</h3>
                  <p className="text-sm text-gray-500">
                    {format(post.timestamp, 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
              </div>
              <p className="mb-4">{post.content}</p>
              {post.media && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  {post.media.type === 'image' ? (
                    <img
                      src={post.media.url}
                      alt="Post media"
                      className="w-full h-auto"
                    />
                  ) : (
                    <iframe
                      src={post.media.url}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              )}
              <div className="flex items-center space-x-6 text-gray-500">
                <button className="flex items-center space-x-2 hover:text-blue-600">
                  <ThumbsUp size={20} />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-blue-600">
                  <MessageSquare size={20} />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-blue-600">
                  <Share2 size={20} />
                  <span>{post.shares}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}