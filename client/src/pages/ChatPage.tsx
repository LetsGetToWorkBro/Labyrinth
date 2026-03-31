import { useState, useRef, useEffect, useCallback } from "react";
import { getBeltColor } from "@/lib/constants";
import { BeltIcon } from "@/components/BeltIcon";
import { useAuth } from "@/lib/auth-context";
import { useGuestProfile } from "@/lib/guest-profile";
import GuestProfileSetup from "@/components/GuestProfileSetup";
import {
  CHANNELS,
  getAccessibleChannels,
  generateSampleMessages,
  getRankProfile,
  type Channel,
  type Message,
} from "@/lib/chat-data";
import logoMaze from "@assets/logo-maze.webp";
import {
  Send,
  ArrowLeft,
  Lock,
  Users,
  Hash,
  ChevronRight,
  Shield,
  Crown,
  MessageCircle,
  Megaphone,
} from "lucide-react";

const GOLD = "#C8A24C";

export default function ChatPage() {
  const { member } = useAuth();
  const { guest, setGuest, hasProfile } = useGuestProfile();
  const [showSetup, setShowSetup] = useState(false);

  // Use CRM member if logged in, otherwise guest profile
  const userName = member?.name || guest?.name || "";
  const userBelt = (member?.belt || guest?.belt || "white").toLowerCase();
  const userType = member?.type || guest?.type || "Adult";
  const isCoach = false;
  const isOwner = !member; // demo mode = see all
  const isModerator = false;

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => generateSampleMessages());
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const channels = getAccessibleChannels(userBelt, userType, isCoach, isOwner, isModerator);
  const activeChannel = activeChannelId ? CHANNELS.find(c => c.id === activeChannelId) : null;
  const activeChannelAccess = activeChannelId ? channels.find(c => c.channel.id === activeChannelId) : null;
  const activeMessages = activeChannelId ? (messages[activeChannelId] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  useEffect(() => {
    if (activeChannelId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeChannelId]);

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || !activeChannelId || !activeChannelAccess?.canPost) return;
    // Require a name to send
    if (!userName) {
      setShowSetup(true);
      return;
    }
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      channelId: activeChannelId,
      senderName: userName,
      senderBelt: userBelt,
      senderRole: isCoach ? "Coach" : undefined,
      text: inputText.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMsg],
    }));
    setInputText("");
  }, [inputText, activeChannelId, activeChannelAccess, member, userBelt, isCoach]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  function formatTime(d: Date) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  // ─── Chat Room View ───
  if (activeChannel) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#0A0A0A" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #1A1A1A", backgroundColor: "#0A0A0A", flexShrink: 0 }}>
          <button onClick={() => setActiveChannelId(null)} style={{ color: "#999", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "#F0F0F0", fontSize: 16, fontWeight: 700, margin: 0 }}>{activeChannel.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={10} style={{ color: "#666" }} />
              <span style={{ color: "#666", fontSize: 11 }}>{activeChannel.memberCount} members</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          {activeMessages.map((msg) => {
            const isMe = msg.senderName === (member?.name || "You");
            const rank = getRankProfile(msg.senderBelt);
            const isHighRank = rank.tier >= 3;
            const isCoachMsg = msg.senderName.startsWith("Coach");

            if (msg.isSystem) {
              return (
                <div key={msg.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", marginBottom: 4 }}>
                  <img src={logoMaze} alt="" style={{ width: 28, height: 28, borderRadius: "50%", filter: "invert(0.75) sepia(1) hue-rotate(5deg) saturate(3)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>Labyrinth BJJ</span>
                      <span style={{ fontSize: 9, color: "#666" }}>{formatTime(msg.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#CCC", margin: "3px 0 0", lineHeight: 1.4 }}>{msg.text}</p>
                  </div>
                </div>
              );
            }

            if (isMe) {
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2, marginTop: 8 }}>
                  <div style={{ maxWidth: "80%" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: "#666" }}>{formatTime(msg.timestamp)}</span>
                    </div>
                    <div style={{ backgroundColor: GOLD, color: "#0A0A0A", padding: "8px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} style={{ marginBottom: 2, marginTop: 8 }}>
                {/* Sender line with rank flair */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, marginLeft: 2 }}>
                  {/* Belt icon */}
                  <BeltIcon belt={msg.senderBelt} width={isHighRank ? 28 : 22} style={{ flexShrink: 0, filter: isHighRank ? `drop-shadow(${rank.glow})` : "none" }} />
                  {/* Name */}
                  <span style={{
                    fontSize: 12,
                    fontWeight: isHighRank ? 800 : 600,
                    color: isHighRank ? rank.color : "#BBB",
                    letterSpacing: isHighRank ? "0.02em" : "0",
                    textShadow: isHighRank ? rank.glow : "none",
                  }}>
                    {msg.senderName}
                  </span>
                  {/* Rank badge */}
                  {rank.badge && (
                    <span style={{ fontSize: 10 }}>{rank.badge}</span>
                  )}
                  {/* Title tag */}
                  {rank.tier >= 2 && (
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "1px 5px",
                      borderRadius: 4,
                      backgroundColor: `${rank.color}18`,
                      color: rank.color,
                      border: `1px solid ${rank.color}30`,
                    }}>
                      {rank.title}
                    </span>
                  )}
                  {/* Coach crown */}
                  {isCoachMsg && (
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "1px 5px",
                      borderRadius: 4,
                      backgroundColor: `${GOLD}18`,
                      color: GOLD,
                      border: `1px solid ${GOLD}30`,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}>
                      <Crown size={8} /> Coach
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "#555" }}>{formatTime(msg.timestamp)}</span>
                </div>
                {/* Message bubble */}
                <div style={{
                  maxWidth: "85%",
                  backgroundColor: "#1A1A1A",
                  padding: "8px 14px",
                  borderRadius: "4px 16px 16px 16px",
                  fontSize: 13,
                  color: "#E0E0E0",
                  lineHeight: 1.4,
                  borderLeft: isHighRank ? `2px solid ${rank.color}40` : "none",
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        {activeChannelAccess?.canPost ? (
          <div style={{ padding: "8px 12px", borderTop: "1px solid #1A1A1A", backgroundColor: "#0A0A0A", flexShrink: 0, paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={userName ? "Type a message..." : "Set up your profile to chat..."}
                style={{
                  flex: 1,
                  backgroundColor: "#111",
                  border: "1px solid #222",
                  borderRadius: 20,
                  padding: "10px 16px",
                  fontSize: 14,
                  color: "#F0F0F0",
                  outline: "none",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: inputText.trim() ? GOLD : "#1A1A1A",
                  color: inputText.trim() ? "#0A0A0A" : "#444",
                  border: "none",
                  cursor: inputText.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1A1A1A", backgroundColor: "#0A0A0A", textAlign: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#666", fontSize: 12 }}>
              <Shield size={14} />
              Only coaches can post here
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Profile Setup Modal ───
  if (showSetup) {
    return (
      <div className="app-content">
        <GuestProfileSetup
          onComplete={(profile) => {
            setGuest(profile);
            setShowSetup(false);
          }}
          onSkip={() => setShowSetup(false)}
        />
      </div>
    );
  }

  // ─── Channel List View ───
  const mainChannels = channels.filter(c => c.channel.group === "main");
  const rankChannels = channels.filter(c => c.channel.group === "rank");
  const kidsRankChannels = channels.filter(c => c.channel.group === "kids-rank");

  const userRank = getRankProfile(userBelt);

  return (
    <div className="app-content">
      {/* Header with rank badge */}
      <div style={{ padding: "16px 20px 12px", paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>Chat</h1>
            <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>Gym channels</p>
          </div>
          {/* User rank card */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px 5px 8px",
            borderRadius: 20,
            backgroundColor: `${userRank.color}10`,
            border: `1px solid ${userRank.color}25`,
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: getBeltColor(userBelt),
              boxShadow: userRank.glow,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: userRank.color }}>
              {userRank.badge} {userRank.title}
            </span>
          </div>
        </div>
      </div>

      {/* Main Channels */}
      <div style={{ padding: "0 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", margin: "16px 0 10px" }}>Main</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {mainChannels.map(({ channel, accessible, canPost }) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              accessible={accessible}
              lastMessage={messages[channel.id]?.slice(-1)[0]}
              onClick={() => accessible && setActiveChannelId(channel.id)}
            />
          ))}
        </div>

        {/* Adult Rank Channels */}
        {rankChannels.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", margin: "20px 0 10px" }}>Adult Ranks</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rankChannels.map(({ channel, accessible }) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  accessible={accessible}
                  lastMessage={messages[channel.id]?.slice(-1)[0]}
                  onClick={() => accessible && setActiveChannelId(channel.id)}
                  isRank
                />
              ))}
            </div>
          </>
        )}

        {/* Kids Rank Channels */}
        {kidsRankChannels.some(c => c.accessible) && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", margin: "20px 0 10px" }}>Kids Ranks</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {kidsRankChannels.map(({ channel, accessible }) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  accessible={accessible}
                  lastMessage={messages[channel.id]?.slice(-1)[0]}
                  onClick={() => accessible && setActiveChannelId(channel.id)}
                  isRank
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function ChannelRow({ channel, accessible, lastMessage, onClick, isRank }: {
  channel: Channel;
  accessible: boolean;
  lastMessage?: Message;
  onClick: () => void;
  isRank?: boolean;
}) {
  // Get rank profile from either adult requiredBelt or kids belt family
  const rankKey = channel.requiredBelt || channel.kidsBeltFamily || "";
  const rank = isRank && rankKey ? getRankProfile(rankKey) : null;
  const beltColor = rankKey ? (rank?.color || getBeltColor(rankKey)) : GOLD;

  function relativeTime(d: Date): string {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  const iconMap: Record<string, React.ReactNode> = {
    general: <Hash size={16} style={{ color: GOLD }} />,
    kids: <Users size={16} style={{ color: "#999" }} />,
    coaches: <Shield size={16} style={{ color: "#999" }} />,
    announcements: <Megaphone size={16} style={{ color: GOLD }} />,
  };

  return (
    <button
      onClick={onClick}
      disabled={!accessible}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: accessible ? "12px 14px" : "10px 14px",
        borderRadius: 14,
        backgroundColor: accessible ? "#111" : "transparent",
        border: accessible ? "1px solid #1A1A1A" : "none",
        cursor: accessible ? "pointer" : "default",
        opacity: accessible ? 1 : 0.4,
        width: "100%",
        textAlign: "left",
        transition: "all 0.15s",
      }}
    >
      {/* Channel icon */}
      {isRank ? (
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: `${beltColor}15`,
          border: `1.5px solid ${beltColor}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: rank && rank.tier >= 3 ? rank.glow : "none",
        }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: beltColor,
            boxShadow: rank ? rank.glow : "none",
          }} />
        </div>
      ) : (
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: accessible ? "#1A1A1A" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {iconMap[channel.type] || <MessageCircle size={16} style={{ color: "#666" }} />}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: accessible ? "#F0F0F0" : "#666",
          }}>
            {channel.name}
          </span>
          {!accessible && <Lock size={12} style={{ color: "#555" }} />}
          {rank && rank.badge && accessible && (
            <span style={{ fontSize: 10 }}>{rank.badge}</span>
          )}
        </div>
        {accessible && lastMessage && (
          <p style={{
            fontSize: 12,
            color: "#666",
            margin: "2px 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {lastMessage.isSystem ? "Labyrinth BJJ" : lastMessage.senderName}: {lastMessage.text}
          </p>
        )}
      </div>

      {/* Right side */}
      {accessible && lastMessage && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "#555" }}>{relativeTime(lastMessage.timestamp)}</span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: GOLD }} />
        </div>
      )}
      {accessible && !lastMessage && (
        <ChevronRight size={16} style={{ color: "#333", flexShrink: 0 }} />
      )}
    </button>
  );
}
