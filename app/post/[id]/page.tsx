"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import CommentSection from "../../components/CommentSection";

type Post = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  post_type: string;
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

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPost = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select(
        `
        *,
        profiles (username, avatar_url),
        communities (name, display_name, icon_url)
      `
      )
      .eq("id", params.id)
      .single();

    setPost(data);
    setLoading(false);
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                R
              </div>
              <h1 className="text-xl font-bold">Reddit Clone</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Post Content */}
        <div className="bg-white rounded-lg border mb-4">
          <div className="p-4">
            {/* Post Header */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                {post.communities.icon_url && (
                  <img
                    src={post.communities.icon_url}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="font-medium">
                  r/{post.communities.display_name}
                </span>
              </div>
              <span>•</span>
              <span>Posted by u/{post.profiles.username}</span>
              <span>•</span>
              <span>{timeAgo(post.created_at)}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

            {/* Content based on type */}
            {post.post_type === "text" && post.content && (
              <div className="prose max-w-none mb-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            )}

            {post.post_type === "image" && post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="max-w-full rounded mb-4"
              />
            )}

            {post.post_type === "link" && post.link_url && (
              <a
                href={post.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mb-4 block"
              >
                {post.link_url}
              </a>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 text-gray-600 text-sm pt-4 border-t">
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-gray-100 rounded text-lg">
                  ▲
                </button>
                <span className="font-bold">
                  {post.upvotes - post.downvotes}
                </span>
                <button className="p-1 hover:bg-gray-100 rounded text-lg">
                  ▼
                </button>
              </div>
              <span className="flex items-center gap-1">
                <span>💬</span>
                <span>{post.comment_count} Comments</span>
              </span>
              <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded">
                <span>🔗</span>
                <span>Share</span>
              </button>
              <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded">
                <span>🔖</span>
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <CommentSection postId={post.id} user={user} />
      </div>
    </div>
  );
}