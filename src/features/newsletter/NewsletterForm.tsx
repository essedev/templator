"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscribeToNewsletter } from "./actions";
import { newsletterSchema, type NewsletterFormData } from "./schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function NewsletterForm() {
  const [loading, setLoading] = useState(false);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: NewsletterFormData) {
    setLoading(true);

    try {
      const result = await subscribeToNewsletter(data);

      if (result.success) {
        toast.success(result.message || "Iscrizione completata!");
        form.reset();
      } else {
        toast.error(result.error || "Errore durante l'iscrizione");
      }
    } catch (error) {
      toast.error("Errore imprevisto. Riprova più tardi.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col sm:flex-row gap-2 max-w-md"
    >
      <Input
        type="email"
        placeholder="Enter your email"
        {...form.register("email")}
        className="flex-1"
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Subscribing..." : "Subscribe"}
      </Button>
    </form>
  );
}
