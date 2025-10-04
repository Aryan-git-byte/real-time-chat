"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Comment = {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  parent_id: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
};

export default function CommentSection({
  postId,
  user,
}: {
  postId: string;
  user: any;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(
        `
        *,
        profiles (username, avatar_url)
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) {
      const commentTree = buildCommentTree(data);
      setComments(commentTree);
    }
  };

  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach((comment) => {
      const commentNode = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(commentNode);
        }
      } else {
        rootComments.push(commentNode);
      }
    });

    return rootComments;
  };

  const postComment = async () => {
    if (!user) {
      alert("Please log in to comment");
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      content: newComment,
      author_id: user.id,
      post_id: postId,
      parent_id: null,
    });

    if (error) {
      alert("Error posting comment: " + error.message);
      return;
    }

    setNewComment("");
    fetchComments();
  };

  const postReply = async (parentId: string) => {
    if (!user) {
      alert("Please log in to reply");
      return;
    }

    if (!replyContent.trim()) return;

    const { error } = await supabase.from("comments").insert({
      content: replyContent,
      author_id: user.id,
      post_id: postId,
      parent_id: parentId,
    });

    if (error) {
      alert("Error posting reply: " + error.message);
      return;
    }

    setReplyContent("");
    setReplyTo(null);
    fetchComments();
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

  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Comment;
    depth?: number;
  }) => (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-gray-200 pl-4" : ""}`}>
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm mb-2">
          {comment.profiles.avatar_url ? (
            <img
              src={comment.profiles.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
              {comment.profiles.username[0].toUpperCase()}
            </div>
          )}
          <span className="font-medium">{comment.profiles.username}</span>
          <span className="text-gray-500">{timeAgo(comment.created_at)}</span>
        </div>

        <p className="text-gray-800 mb-2">{comment.content}</p>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <button className="hover:text-orange-500">▲</button>
            <span className="font-medium">
              {comment.upvotes - comment.downvotes}
            </span>
            <button className="hover:text-blue-500">▼</button>
          </div>
          <button
            onClick={() => setReplyTo(comment.id)}
            className="hover:text-blue-600"
          >
            Reply
          </button>
        </div>

        {replyTo === comment.id && (
          <div className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="What are your thoughts?"
              className="w-full px-3 py-2 border rounded mb-2"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => postReply(comment.id)}
                className="px-4 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-sm"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent("");
                }}
                className="px-4 py-1 border rounded-full hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-semibold mb-4">Comments</h3>

      {/* Add Comment */}
      {user ? (
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            className="w-full px-3 py-2 border rounded mb-2"
            rows={4}
          />
          <button
            onClick={postComment}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            Comment
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded text-center">
          <p className="text-gray-600">Log in to comment</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}