"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import PostCard from "../../components/PostCard";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
};

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

type Comment = {
  id: string;
  content: string;
  created_at: string;
  posts: {
    title: string;
    id: string;
  };
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    if (params.username) {
      fetchProfile();
      fetchUserPosts();
      fetchUserComments();
    }
  }, [params.username]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", params.username)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const fetchUserPosts = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", params.username)
      .single();

    if (profileData) {
      const { data } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles (username, avatar_url),
          communities (name, display_name, icon_url)
        `
        )
        .eq("author_id", profileData.id)
        .order("created_at", { ascending: false });

      setPosts(data || []);
    }
  };

  const fetchUserComments = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", params.username)
      .single();

    if (profileData) {
      const { data } = await supabase
        .from("comments")
        .select(
          `
          *,
          posts (title, id)
        `
        )
        .eq("author_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setComments(data || []);
    }
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">User not found</div>
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

      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {profile.username[0].toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">u/{profile.username}</h1>
              {profile.bio && (
                <p className="text-gray-600 mb-3">{profile.bio}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div>
                  <span className="font-bold">{posts.length}</span> Posts
                </div>
                <div>
                  <span className="font-bold">{comments.length}</span> Comments
                </div>
                <div>
                  Joined{" "}
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            {/* Tabs */}
            <div className="bg-white border rounded-lg mb-4">
              <div className="flex gap-4 p-3">
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`px-4 py-2 rounded-full font-medium ${
                    activeTab === "posts"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Posts ({posts.length})
                </button>
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`px-4 py-2 rounded-full font-medium ${
                    activeTab === "comments"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Comments ({comments.length})
                </button>
              </div>
            </div>

            {/* Posts Tab */}
            {activeTab === "posts" && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center border">
                    <p className="text-gray-600">No posts yet</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} user={currentUser} />
                  ))
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === "comments" && (
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="bg-white rounded-lg p-8 text-center border">
                    <p className="text-gray-600">No comments yet</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-white border rounded-lg p-4"
                    >
                      <div className="text-xs text-gray-600 mb-2">
                        <span className="font-medium">{profile.username}</span>{" "}
                        commented on{" "}
                        <button
                          onClick={() => router.push(`/post/${comment.posts.id}`)}
                          className="text-blue-600 hover:underline"
                        >
                          {comment.posts.title}
                        </button>{" "}
                        · {timeAgo(comment.created_at)}
                      </div>
                      <p className="text-gray-800">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80">
            <div className="bg-white rounded-lg border p-4 sticky top-20">
              <h3 className="font-semibold mb-3">About</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎂</span>
                  <div>
                    <div className="text-gray-600">Cake day</div>
                    <div className="font-medium">
                      {new Date(profile.created_at).toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" }
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  <div>
                    <div className="text-gray-600">Post Count</div>
                    <div className="font-medium">{posts.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  <div>
                    <div className="text-gray-600">Comment Count</div>
                    <div className="font-medium">{comments.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}