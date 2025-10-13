# Real-time Chat Implementation

Complete guide to implementing a real-time chat system using Supabase with Templator's existing architecture.

## Prerequisites

- Supabase project created and connected
- Basic migration completed (see [SUPABASE_INTEGRATION.md](../../SUPABASE_INTEGRATION.md#path-1-minimal-real-time-only-))

## Overview

**What you'll build:**

- Real-time chat rooms
- Live message updates (<1s latency)
- User presence (online/offline)
- Message history
- Type-safe with Drizzle

**Time estimate:** 2-3 hours

**Architecture:**

```
Workers (Server Actions)  →  Database (Supabase PostgreSQL)
         ↓                            ↓
    Client (HTTP)         ←      Client (WebSocket)
                                 Real-time updates
```

---

## Step 1: Database Schema

Add chat tables to your Drizzle schema:

```typescript
// src/db/schema.ts
export const chatRooms = pgTable("chat_rooms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  roomId: text("room_id")
    .notNull()
    .references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roomMembers = pgTable("room_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  roomId: text("room_id")
    .notNull()
    .references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});
```

**Push schema:**

```bash
pnpm db:push
```

---

## Step 2: Row Level Security (RLS)

Secure your tables with Supabase RLS policies:

```sql
-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Users can view rooms they're members of
CREATE POLICY "Users can view their rooms"
ON chat_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = chat_rooms.id
    AND room_members.user_id = auth.uid()
  )
);

-- Users can view messages in their rooms
CREATE POLICY "Users can view room messages"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = chat_messages.room_id
    AND room_members.user_id = auth.uid()
  )
);

-- Users can send messages to their rooms
CREATE POLICY "Users can send messages"
ON chat_messages FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = chat_messages.room_id
    AND room_members.user_id = auth.uid()
  )
);

-- Users can view room memberships
CREATE POLICY "Users can view room members"
ON room_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members rm
    WHERE rm.room_id = room_members.room_id
    AND rm.user_id = auth.uid()
  )
);
```

**Note:** Run these in Supabase SQL Editor (Dashboard → SQL Editor).

---

## Step 3: Server Actions

Create chat feature with Server Actions:

```typescript
// src/features/chat/actions.ts
"use server";

import { db } from "@/db";
import { chatRooms, chatMessages, roomMembers, user } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Create a new chat room
 */
export async function createRoom(name: string, description?: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [room] = await db
    .insert(chatRooms)
    .values({
      name,
      description,
      createdBy: session.user.id,
    })
    .returning();

  // Add creator as member
  await db.insert(roomMembers).values({
    roomId: room.id,
    userId: session.user.id,
  });

  revalidatePath("/chat");
  return room;
}

/**
 * Get user's chat rooms
 */
export async function getUserRooms() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await db
    .select({
      id: chatRooms.id,
      name: chatRooms.name,
      description: chatRooms.description,
      createdAt: chatRooms.createdAt,
    })
    .from(chatRooms)
    .innerJoin(roomMembers, eq(roomMembers.roomId, chatRooms.id))
    .where(eq(roomMembers.userId, session.user.id))
    .orderBy(desc(chatRooms.createdAt));
}

/**
 * Send a message to a room
 */
export async function sendMessage(roomId: string, content: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify user is member
  const [membership] = await db
    .select()
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id)));

  if (!membership) throw new Error("Not a member of this room");

  const [message] = await db
    .insert(chatMessages)
    .values({
      roomId,
      userId: session.user.id,
      content,
    })
    .returning();

  revalidatePath(`/chat/${roomId}`);
  return message;
}

/**
 * Get messages for a room (with user details)
 */
export async function getRoomMessages(roomId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify membership
  const [membership] = await db
    .select()
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id)));

  if (!membership) throw new Error("Not a member of this room");

  return await db
    .select({
      id: chatMessages.id,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(chatMessages)
    .leftJoin(user, eq(chatMessages.userId, user.id))
    .where(eq(chatMessages.roomId, roomId))
    .orderBy(asc(chatMessages.createdAt));
}

/**
 * Get room members
 */
export async function getRoomMembers(roomId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      joinedAt: roomMembers.joinedAt,
    })
    .from(roomMembers)
    .leftJoin(user, eq(roomMembers.userId, user.id))
    .where(eq(roomMembers.roomId, roomId));
}
```

---

## Step 4: Real-time Component

Create the chat room component with real-time updates:

```typescript
// src/features/chat/ChatRoom.tsx
"use client";

import { useEffect, useState, useRef, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { sendMessage, getRoomMessages } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  user: { id: string; name: string; image: string | null };
}

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Load initial messages
    getRoomMessages(roomId)
      .then(setMessages)
      .catch(err => toast.error('Failed to load messages'));

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Fetch full message with user details
          const newMessages = await getRoomMessages(roomId);
          const latestMessage = newMessages[newMessages.length - 1];

          setMessages(prev => {
            // Check if message already exists (from our own send)
            if (prev.some(m => m.id === latestMessage.id)) {
              return prev;
            }
            return [...prev, latestMessage];
          });

          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(roomId, input);
      setInput('');
      // Don't update UI here - real-time subscription will handle it
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className="flex items-start space-x-3">
            {msg.user.image && (
              <img
                src={msg.user.image}
                alt={msg.user.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="font-semibold">{msg.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm mt-1">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            autoFocus
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

## Step 5: Chat Room List

Create a component to list available rooms:

```typescript
// src/features/chat/RoomList.tsx
"use client";

import { useEffect, useState } from 'react';
import { getUserRooms } from './actions';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Room {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserRooms()
      .then(setRooms)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  if (rooms.length === 0) {
    return <div>No chat rooms yet. Create one to get started!</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map(room => (
        <Link key={room.id} href={`/chat/${room.id}`}>
          <Card className="hover:bg-accent cursor-pointer transition">
            <CardHeader>
              <CardTitle>{room.name}</CardTitle>
              {room.description && (
                <CardDescription>{room.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

---

## Step 6: Pages

Create the chat pages:

```typescript
// app/chat/page.tsx
import { requireAuth } from '@/lib/rbac';
import { RoomList } from '@/features/chat/RoomList';
import { PageHeader } from '@/components/common/PageHeader';

export default async function ChatPage() {
  await requireAuth();

  return (
    <div className="container py-8">
      <PageHeader
        title="Chat Rooms"
        description="Select a room to start chatting"
      />
      <RoomList />
    </div>
  );
}
```

```typescript
// app/chat/[roomId]/page.tsx
import { requireAuth } from '@/lib/rbac';
import { ChatRoom } from '@/features/chat/ChatRoom';
import { db } from '@/db';
import { chatRooms, roomMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export default async function ChatRoomPage({
  params
}: {
  params: { roomId: string }
}) {
  const session = await requireAuth();

  // Verify room exists and user is member
  const [room] = await db
    .select({ name: chatRooms.name })
    .from(chatRooms)
    .innerJoin(roomMembers, eq(roomMembers.roomId, chatRooms.id))
    .where(
      and(
        eq(chatRooms.id, params.roomId),
        eq(roomMembers.userId, session.user.id)
      )
    );

  if (!room) notFound();

  return (
    <div className="container h-[calc(100vh-4rem)] py-4">
      <div className="h-full border rounded-lg">
        <div className="border-b p-4">
          <h1 className="text-xl font-semibold">{room.name}</h1>
        </div>
        <div className="h-[calc(100%-5rem)]">
          <ChatRoom roomId={params.roomId} />
        </div>
      </div>
    </div>
  );
}
```

---

## Step 7: Navigation

Add chat to your navbar:

```typescript
// src/components/layout/Navbar.tsx
// Add to navigation items:

{session && (
  <Link href="/chat">
    <Button variant="ghost">Chat</Button>
  </Link>
)}
```

---

## Testing

1. **Start dev server:**

   ```bash
   pnpm dev
   ```

2. **Create a room:**
   - Navigate to `/chat`
   - (You'll need to add a create room form, or create manually in DB)

3. **Test real-time:**
   - Open room in two browser windows (different users)
   - Send message from one → should appear instantly in other

4. **Verify RLS:**
   - Try accessing a room you're not a member of → should get error
   - Messages from other rooms should not appear

---

## Enhancements

### Add Typing Indicators

```typescript
// In ChatRoom.tsx
const [typingUsers, setTypingUsers] = useState<string[]>([]);

useEffect(() => {
  const channel = supabase.channel(`room-${roomId}`);

  // Broadcast typing
  const handleInputChange = (e) => {
    setInput(e.target.value);
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: { user: session.user.name },
    });
  };

  // Listen to typing
  channel.on("broadcast", { event: "typing" }, (payload) => {
    // Add user to typing list, remove after 3s
  });

  // ... subscribe
}, [roomId]);
```

### Add Message Reactions

```typescript
// Add reactions table
export const messageReactions = pgTable("message_reactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  messageId: text("message_id").references(() => chatMessages.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Server Action
export async function addReaction(messageId: string, emoji: string) {
  // ...
}

// Subscribe to reaction changes
channel.on("postgres_changes", { event: "*", table: "message_reactions" }, (payload) => {
  // Update UI
});
```

### Add Read Receipts

```typescript
export const messageReads = pgTable("message_reads", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  messageId: text("message_id").references(() => chatMessages.id),
  userId: text("user_id").references(() => user.id),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

// Mark as read when user scrolls into view
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      markAsRead(entry.target.dataset.messageId);
    }
  });
});
```

---

## Troubleshooting

### Messages not appearing in real-time

**Check:**

1. RLS policies are correct (run SQL in Supabase dashboard)
2. Supabase client has correct anon key
3. Channel subscription is successful (check console logs)
4. WebSocket connection is open (Network tab → WS)

**Debug:**

```typescript
channel.subscribe((status) => {
  console.log("Subscription status:", status);
  if (status === "SUBSCRIBED") {
    console.log("✅ Successfully subscribed");
  }
});
```

### "Not a member of this room" error

**Cause:** User not in `room_members` table.

**Fix:**

```sql
-- Add user to room manually
INSERT INTO room_members (room_id, user_id)
VALUES ('room-id', 'user-id');
```

### Duplicate messages appearing

**Cause:** Message appears from both Server Action return and real-time subscription.

**Fix:** Check for duplicates before adding:

```typescript
setMessages((prev) => {
  if (prev.some((m) => m.id === newMessage.id)) {
    return prev;
  }
  return [...prev, newMessage];
});
```

---

## Next Steps

- Add [presence detection](./presence-detection.md) to show online users
- Implement file sharing with [Supabase Storage](./file-storage.md)
- Add push notifications for offline users
- Implement message search with full-text search

---

## Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Back to Supabase Integration Guide](../../SUPABASE_INTEGRATION.md)
