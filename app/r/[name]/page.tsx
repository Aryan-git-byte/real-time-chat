"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import PostCard from "../../components/PostCard";

type Community = {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon_url: string | null;
  banner_url: string | null;
  member_count: number;
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

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    if (params.name) {
      fetchCommunity();
      fetchPosts();
    }
  }, [params.name]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    if (user && params.name) {
      checkMembership(user.id);
    }
  };

  const checkMembership = async (userId: string) => {
    const { data } = await supabase
      .from("community_members")
      .select("*")
      .eq("user_id", userId)
      .eq("community_id", community?.id)
      .single();

    setIsMember(!!data);
  };

  const fetchCommunity = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("communities")
      .select("*")
      .eq("name", params.name)
      .single();

    setCommunity(data);
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data: communityData } = await supabase
      .from("communities")
      .select("id")
      .eq("name", params.name)
      .single();

    if (communityData) {
      const { data } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles (username, avatar_url),
          communities (name, display_name, icon_url)
        `
        )
        .eq("community_id", communityData.id)
        .order("created_at", { ascending: false });

      setPosts(data || []);
    }
  };

  const toggleMembership = async () => {
    if (!user) {
      alert("Please log in to join communities");
      return;
    }

    if (isMember) {
      await supabase
        .from("community_members")
        .delete()
        .eq("user_id", user.id)
        .eq("community_id", community?.id);

      await supabase.rpc("decrement", {
        table_name: "communities",
        row_id: community?.id,
        column_name: "member_count",
      });

      setIsMember(false);
    } else {
      await supabase.from("community_members").insert({
        user_id: user.id,
        community_id: community?.id,
      });

      await supabase
        .from("communities")
        .update({ member_count: (community?.member_count || 0) + 1 })
        .eq("id", community?.id);

      setIsMember(true);
    }

    fetchCommunity();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Community not found</div>
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

      {/* Community Banner */}
      <div
        className={`h-32 ${community.banner_url ? "community-banner" : "bg-gradient-to-r from-blue-400 to-purple-500"}`}
        data-banner-url={community.banner_url || undefined}
      ></div>

      {/* Community Info */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white border-x border-b -mt-4 rounded-b-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {community.icon_url ? (
                <img
                  src={community.icon_url}
                  alt={community.name}
                  className="w-20 h-20 rounded-full border-4 border-white -mt-8"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-500 rounded-full border-4 border-white -mt-8 flex items-center justify-center text-white text-2xl font-bold">
                  {community.name[0].toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {community.display_name}
                </h1>
                <p className="text-gray-600">r/{community.name}</p>
              </div>
            </div>

            <button
              onClick={toggleMembership}
              className={`px-6 py-2 rounded-full font-medium ${
                isMember
                  ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isMember ? "Joined" : "Join"}
            </button>
          </div>

          {community.description && (
            <p className="text-gray-700 mt-4">{community.description}</p>
          )}

          <div className="flex items-center gap-6 mt-4 text-sm">
            <div>
              <span className="font-bold text-lg">
                {community.member_count}
              </span>
              <span className="text-gray-600 ml-1">Members</span>
            </div>
            <div>
              <span className="text-gray-600">
                Created{" "}
                {new Date(community.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Posts</h2>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center border">
                <p className="text-gray-600">
                  No posts yet in this community. Be the first to post!
                </p>
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
          <div className="w-80">
            <div className="bg-white rounded-lg border p-4 sticky top-20">
              <h3 className="font-semibold mb-3">About Community</h3>
              {community.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {community.description}
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Members</span>
                  <span className="font-medium">{community.member_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">
                    {new Date(community.created_at).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </span>
                </div>
              </div>
              {user && (
                <button
                  onClick={toggleMembership}
                  className={`w-full mt-4 px-4 py-2 rounded-full font-medium ${
                    isMember
                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {isMember ? "Leave Community" : "Join Community"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}