"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPostSchema, type CreatePostInput } from "./schema";
import { createPost, updatePost } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface PostFormProps {
  mode: "create" | "edit";
  postId?: string;
  defaultValues?: Partial<CreatePostInput>;
}

/**
 * Form per creare/modificare blog post.
 * Supporta sia create che edit mode.
 */
export function PostForm({ mode, postId, defaultValues }: PostFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: defaultValues || {
      published: false,
    },
  });

  const published = watch("published");

  const onSubmit = async (data: CreatePostInput) => {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await createPost(data);
        toast.success("Post created successfully");
        router.push("/admin/blog");
      } else if (mode === "edit" && postId) {
        await updatePost(postId, data);
        toast.success("Post updated successfully");
        router.push("/admin/blog");
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save post");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register("title")} placeholder="Post title" />
        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
      </div>

      {/* Slug */}
      <div>
        <Label htmlFor="slug">Slug *</Label>
        <Input id="slug" {...register("slug")} placeholder="post-url-slug" />
        {errors.slug && <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          URL-friendly version (lowercase, hyphens only)
        </p>
      </div>

      {/* Excerpt */}
      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          {...register("excerpt")}
          placeholder="Short description..."
          rows={2}
        />
        {errors.excerpt && <p className="text-sm text-red-600 mt-1">{errors.excerpt.message}</p>}
      </div>

      {/* Cover Image */}
      <div>
        <Label htmlFor="coverImage">Cover Image URL</Label>
        <Input id="coverImage" {...register("coverImage")} placeholder="https://..." />
        {errors.coverImage && (
          <p className="text-sm text-red-600 mt-1">{errors.coverImage.message}</p>
        )}
      </div>

      {/* Content */}
      <div>
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          {...register("content")}
          placeholder="Write your post content here..."
          rows={15}
          className="font-mono text-sm"
        />
        {errors.content && <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Supports HTML. For markdown, consider adding a markdown parser.
        </p>
      </div>

      {/* Published checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="published"
          checked={published}
          onCheckedChange={(checked) => {
            register("published").onChange({
              target: { name: "published", value: checked },
            });
          }}
        />
        <Label htmlFor="published" className="cursor-pointer">
          Publish immediately
        </Label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? published
                ? "Create & Publish"
                : "Create Draft"
              : published
                ? "Update & Publish"
                : "Save as Draft"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/blog")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
