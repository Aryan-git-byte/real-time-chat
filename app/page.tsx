"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import PostCard from "./components/PostCard";
import Sidebar from "./components/Sidebar";
import CreatePostModal from "./components/CreatePostModal";
import AuthModal from "./components/AuthModal";

type Post = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  post_type: string;
  author_id: string;
  community_id: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  communities: {
    name: string;
    display_name: string;
    icon_url: string | null;
  };
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    fetchPosts();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        profiles (username, avatar_url),
        communities (name, display_name, icon_url)
      `
      );

    if (sortBy === "new") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "top") {
      query = query.order("upvotes", { ascending: false });
    } else {
      // Hot algorithm: upvotes - downvotes, weighted by time
      query = query.order("created_at", { ascending: false }).limit(50);
    }

    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              R
            </div>
            <h1 className="text-xl font-bold">Reddit Clone</h1>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 border rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 font-medium"
                >
                  Create Post
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{user.email}</span>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 font-medium"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Main Feed */}
        <div className="flex-1">
          {/* Sort Tabs */}
          <div className="bg-white rounded-lg p-3 mb-4 flex gap-4 border">
            {["hot", "new", "top"].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort as any)}
                className={`px-4 py-2 rounded-full font-medium capitalize ${
                  sortBy === sort
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {sort}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border">
              <p className="text-gray-600">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} user={user} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar user={user} onCreatePost={() => setShowCreatePost(true)} />
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      {showCreatePost && user && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSuccess={fetchPosts}
          userId={user.id}
        />
      )}
    </div>
  );
}