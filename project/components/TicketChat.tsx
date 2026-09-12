'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertCircle, Bot, User, Info } from 'lucide-react';
import type { TicketMessage } from '@/app/lib/types';
import { relativeTime, formatDate } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';

interface TicketChatProps {
  ticketId: string;
  initialMessages: TicketMessage[];
  currentUserId: string;
  currentUserName: string;
  isTicketClosed: boolean;
  onSendMessage?: (content: string) => Promise<TicketMessage>;
  onSubscribe?: (
    ticketId: string,
    onNewMessage: (msg: TicketMessage) => void
  ) => (() => void) | undefined;
}

// ─── Individual Message Bubble ────────────────────────────────────────────────

function MessageBubble({ message, isOwn }: { message: TicketMessage; isOwn: boolean }) {
  const [showTime, setShowTime] = useState(false);

  if (message.is_system) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 justify-center py-1"
      >
        <span className="flex-1 h-px bg-zinc-100" />
        <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 rounded-full">
          <Info className="h-3 w-3 text-zinc-400" />
          <p className="text-2xs text-parmore-slate">{message.content}</p>
        </div>
        <span className="flex-1 h-px bg-zinc-100" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-2.5 max-w-[85%]', isOwn ? 'ml-auto flex-row-reverse' : '')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-1 text-xs font-semibold',
          message.is_agent
            ? 'bg-parmore-navy text-white'
            : isOwn
            ? 'bg-parmore-gold text-parmore-black'
            : 'bg-zinc-200 text-zinc-600'
        )}
      >
        {message.is_agent ? (
          <Bot className="h-3.5 w-3.5" />
        ) : (
          message.sender_name.charAt(0).toUpperCase()
        )}
      </div>

      <div className={cn('flex flex-col gap-0.5', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name */}
        <p className="text-2xs text-parmore-slate px-1">
          {message.is_agent ? message.sender_name : isOwn ? 'You' : message.sender_name}
        </p>

        {/* Bubble */}
        <button
          onClick={() => setShowTime((t) => !t)}
          className={cn(
            'text-left px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed transition-colors',
            message.is_agent
              ? 'bg-parmore-navy text-white rounded-tl-sm'
              : isOwn
              ? 'bg-parmore-black text-white rounded-tr-sm'
              : 'bg-zinc-100 text-parmore-black rounded-tl-sm'
          )}
        >
          {message.content}
        </button>

        {/* Timestamp — shows on click */}
        <AnimatePresence>
          {showTime && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-2xs text-zinc-400 px-1 overflow-hidden"
            >
              {formatDate(message.created_at)} · {relativeTime(message.created_at)}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 max-w-[85%]">
      <div className="h-7 w-7 rounded-full bg-parmore-navy flex items-center justify-center shrink-0 mt-1">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="px-4 py-3 bg-parmore-navy rounded-2xl rounded-tl-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 bg-white/60 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Chat Component ──────────────────────────────────────────────────────

export function TicketChat({
  ticketId,
  initialMessages,
  currentUserId,
  currentUserName,
  isTicketClosed,
  onSendMessage,
  onSubscribe,
}: TicketChatProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingIds = useRef<Set<string>>(new Set());

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = onSubscribe?.(ticketId, (msg) => {
      // Skip messages we sent optimistically (already in state)
      if (pendingIds.current.has(msg.id)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Briefly show agent typing indicator before their reply appears
      if (msg.is_agent) setIsAgentTyping(false);
    });
    return () => unsubscribe?.();
  }, [ticketId, onSubscribe]);

  // Auto-resize textarea
  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending || isTicketClosed) return;

    setSendError(null);
    setSending(true);

    // Optimistic message
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: TicketMessage = {
      id: optimisticId,
      ticket_id: ticketId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      content,
      is_agent: false,
      is_system: false,
      attachments: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const confirmed = await onSendMessage?.(content);
      if (confirmed) {
        pendingIds.current.add(confirmed.id);
        // Replace optimistic with confirmed
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? confirmed : m))
        );
      }
    } catch {
      // Roll back optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setSendError('Failed to send. Please try again.');
      setDraft(content);
    } finally {
      setSending(false);
    }
  }, [draft, sending, isTicketClosed, ticketId, currentUserId, currentUserName, onSendMessage]);

  // Group messages by date
  const groupedMessages = messages.reduce<Array<{ date: string; msgs: TicketMessage[] }>>(
    (groups, msg) => {
      const date = new Date(msg.created_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      });
      const last = groups[groups.length - 1];
      if (last?.date === date) {
        last.msgs.push(msg);
      } else {
        groups.push({ date, msgs: [msg] });
      }
      return groups;
    },
    []
  );

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-white rounded-sm border border-zinc-100 shadow-luxury overflow-hidden">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2 shrink-0">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-parmore-black">Parmore Support</span>
        <span className="text-2xs text-parmore-slate ml-auto">Typically replies within a few hours</span>
      </div>

      {/* Message feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {groupedMessages.map(({ date, msgs }) => (
          <div key={date} className="space-y-3">
            {/* Date separator */}
            <div className="flex items-center gap-2">
              <span className="flex-1 h-px bg-zinc-100" />
              <span className="text-2xs text-zinc-400 px-2">{date}</span>
              <span className="flex-1 h-px bg-zinc-100" />
            </div>
            {msgs.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId}
              />
            ))}
          </div>
        ))}

        {/* Agent typing indicator */}
        <AnimatePresence>
          {isAgentTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-zinc-100">
        {isTicketClosed ? (
          <div className="px-4 py-3 text-center text-xs text-parmore-slate bg-zinc-50">
            This ticket is closed. <button className="text-parmore-gold hover:underline">Open a new ticket</button> if you need further help.
          </div>
        ) : (
          <div className="px-4 py-3">
            {sendError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-xs text-red-500 mb-2"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {sendError}
              </motion.p>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1 border border-zinc-200 rounded-xl overflow-hidden focus-within:border-parmore-black transition-colors bg-zinc-50">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={handleDraftChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  maxLength={4000}
                  disabled={sending}
                  className="w-full px-3.5 py-2.5 text-sm bg-transparent outline-none resize-none placeholder-zinc-400 disabled:opacity-50"
                  style={{ minHeight: 40, maxHeight: 120 }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                aria-label="Send message"
                className={cn(
                  'h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all',
                  draft.trim() && !sending
                    ? 'bg-parmore-black text-white hover:bg-zinc-800 scale-100'
                    : 'bg-zinc-200 text-zinc-400 cursor-not-allowed scale-95'
                )}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-2xs text-zinc-400 mt-1.5 text-right">{draft.length}/4000</p>
          </div>
        )}
      </div>
    </div>
  );
}
