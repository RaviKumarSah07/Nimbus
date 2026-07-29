"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import clsx from "clsx";
import { useAppSelector } from "../../store/hooks";
import { useCreateReviewMutation } from "../../store/api/reviewsApi";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function ReviewForm({ productId }: { productId: string }) {
  const isAuthed = useAppSelector((state) => state.auth.status === "authenticated");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [createReview, { isLoading, error, isSuccess }] = useCreateReviewMutation();

  if (!isAuthed) {
    return (
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Write a review</h2>
        <p className="text-sm text-slate-500">
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>{" "}
          to write a review.
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Write a review</h2>
        <p className="text-sm text-emerald-600">Thanks for your review!</p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    await createReview({ productId, input: { rating, title, body } });
  }

  const errorMessage =
    error && "data" in error ? String((error.data as { error?: { message?: string } })?.error?.message ?? "Could not submit review") : undefined;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-slate-900">Write a review</h2>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={clsx("h-6 w-6", (hoverRating || rating) >= star ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      <div className="flex flex-col gap-1">
        <label htmlFor="review-body" className="text-sm font-medium text-slate-700">
          Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={5}
          rows={3}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
      <Button type="submit" isLoading={isLoading} disabled={rating === 0} className="w-fit">
        Submit review
      </Button>
    </form>
  );
}
