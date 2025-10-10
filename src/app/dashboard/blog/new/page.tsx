import { PostForm } from "@/features/blog/PostForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dashboard page per creare nuovo blog post.
 */
export default function NewPostPage() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Write a new blog post. Save as draft or publish immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
