"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

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

export default function PostCard({ post, user }: { post: Post; user: any }) {
  const [votes, setVotes] = useState({
    upvotes: post.upvotes,
    downvotes: post.downvotes,
  });
  const [userVote, setUserVote] = useState<number | null>(null);

  const score = votes.upvotes - votes.downvotes;

  const handleVote = async (voteType: number) => {
    if (!user) {
      alert("Please log in to vote");
      return;
    }

    // If clicking same vote, remove it
    if (userVote === voteType) {
      await supabase.from("post_votes").delete().match({
        post_id: post.id,
        user_id: user.id,
      });
      setUserVote(null);
      setVotes((prev) => ({
        upvotes: prev.upvotes - (voteType === 1 ? 1 : 0),
        downvotes: prev.downvotes - (voteType === -1 ? 1 : 0),
      }));
    } else {
      // Upsert new vote
      await supabase.from("post_votes").upsert({
        post_id: post.id,
        user_id: user.id,
        vote_type: voteType,
      });

      setVotes((prev) => ({
        upvotes:
          prev.upvotes +
          (voteType === 1 ? 1 : 0) -
          (userVote === 1 ? 1 : 0),
        downvotes:
          prev.downvotes +
          (voteType === -1 ? 1 : 0) -
          (userVote === -1 ? 1 : 0),
      }));
      setUserVote(voteType);
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

  return (
    <div className="bg-white border rounded-lg hover:border-gray-400 transition">
      <div className="flex">
        {/* Vote Section */}
        <div className="w-12 bg-gray-50 flex flex-col items-center py-2 rounded-l-lg">
          <button
            onClick={() => handleVote(1)}
            className={`p-1 hover:bg-gray-200 rounded ${
              userVote === 1 ? "text-orange-500" : "text-gray-400"
            }`}
          >
            ▲
          </button>
          <span
            className={`text-sm font-bold ${
              score > 0
                ? "text-orange-500"
                : score < 0
                ? "text-blue-500"
                : "text-gray-600"
            }`}
          >
            {score}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className={`p-1 hover:bg-gray-200 rounded ${
              userVote === -1 ? "text-blue-500" : "text-gray-400"
            }`}
          >
            ▼
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <Link
              href={`/r/${post.communities.name}`}
              className="flex items-center gap-1 hover:underline font-medium"
            >
              {post.communities.icon_url && (
                <img
                  src={post.communities.icon_url}
                  alt=""
                  className="w-5 h-5 rounded-full"
                />
              )}
              r/{post.communities.name}
            </Link>
            <span>•</span>
            <span>Posted by u/{post.profiles.username}</span>
            <span>•</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>

          <Link href={`/post/${post.id}`}>
            <h2 className="text-lg font-semibold mb-2 hover:text-blue-600">
              {post.title}
            </h2>
          </Link>

          {post.post_type === "text" && post.content && (
            <p className="text-gray-700 mb-3 line-clamp-3">{post.content}</p>
          )}

          {post.post_type === "image" && post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="max-h-96 rounded mb-3"
            />
          )}

          {post.post_type === "link" && post.link_url && (
            <a
              href={post.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mb-3 block"
            >
              {post.link_url}
            </a>
          )}

          <div className="flex items-center gap-4 text-gray-600 text-sm">
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded"
            >
              <span>💬</span>
              <span>{post.comment_count} Comments</span>
            </Link>
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
    </div>
  );
}