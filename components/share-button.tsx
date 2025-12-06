"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";

export function ShareButton() {
  const existingToken = useQuery(api.sharedLinks.getMySharedLink);
  const createOrGetSharedLink = useMutation(api.sharedLinks.createOrGetSharedLink);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      setLoading(true);
      const token = await createOrGetSharedLink();
      const shareUrl = `${window.location.origin}/share/${token}`;

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to create share link:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={loading}
      className="w-full gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : loading ? (
        <>
          <Share2 className="h-4 w-4 animate-pulse" />
          Creating...
        </>
      ) : existingToken ? (
        <>
          <Copy className="h-4 w-4" />
          Copy Share Link
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share All Scenarios
        </>
      )}
    </Button>
  );
}
