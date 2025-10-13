# Presence Detection with Supabase

Track online/offline status and show who's currently active in real-time.

## Prerequisites

- Real-time chat implemented (see [realtime-chat.md](./realtime-chat.md))

## Overview

**What you'll build:**

- Online/offline status tracking
- "User is typing..." indicators
- Active users list
- Last seen timestamps

**Time estimate:** 1 hour

---

## Implementation

### Basic Presence

```typescript
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/lib/auth-client';

interface PresenceState {
  [userId: string]: Array<{
    user_id: string;
    user_name: string;
    online_at: string;
  }>;
}

export function OnlineUsers({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase.channel(`presence-${roomId}`, {
      config: {
        presence: {
          key: session.user.id
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state: PresenceState = channel.presenceState();
        const users = Object.keys(state)
          .flatMap(key => state[key])
          .map(p => p.user_name);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: session.user.id,
            user_name: session.user.name || 'Anonymous',
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, session]);

  return (
    <div className="p-4 border-l">
      <h3 className="font-semibold mb-2">
        Online ({onlineUsers.length})
      </h3>
      <ul className="space-y-2">
        {onlineUsers.map(name => (
          <li key={name} className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Typing Indicator

```typescript
export function ChatRoomWithTyping({ roomId }: { roomId: string }) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const channel = supabase.channel(`room-${roomId}`);

    // Listen for typing events
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const { user_id, user_name } = payload;

      // Add user to typing list
      setTypingUsers(prev => new Set(prev).add(user_name));

      // Clear existing timeout
      const existingTimeout = typingTimeouts.current.get(user_id);
      if (existingTimeout) clearTimeout(existingTimeout);

      // Remove user after 3 seconds of inactivity
      const timeout = setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(user_name);
          return next;
        });
        typingTimeouts.current.delete(user_id);
      }, 3000);

      typingTimeouts.current.set(user_id, timeout);
    });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [roomId]);

  function handleInputChange(value: string) {
    // Broadcast typing event
    const channel = supabase.channel(`room-${roomId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: session.user.id,
        user_name: session.user.name
      }
    });
  }

  return (
    <div>
      {/* Messages */}

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="text-sm text-muted-foreground italic px-4 py-2">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input */}
      <Input
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Type a message..."
      />
    </div>
  );
}
```

### Last Seen

Store last seen in database:

```typescript
// Update on disconnect
useEffect(() => {
  const updateLastSeen = async () => {
    await db.update(user).set({ lastSeenAt: new Date() }).where(eq(user.id, session.user.id));
  };

  // Update on page unload
  window.addEventListener("beforeunload", updateLastSeen);

  return () => {
    window.removeEventListener("beforeunload", updateLastSeen);
    updateLastSeen();
  };
}, [session]);

// Display last seen
function formatLastSeen(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString();
}
```

---

## Resources

- [Supabase Presence Docs](https://supabase.com/docs/guides/realtime/presence)
- [Back to Real-time Chat](./realtime-chat.md)
