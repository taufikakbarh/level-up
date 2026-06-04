import { Sword, User, BookOpen, BookMarked } from "lucide-react";

const TABS = [
  { id: "quest",     icon: Sword,      label: "Quest"     },
  { id: "character", icon: User,       label: "Character" },
  { id: "journal",   icon: BookOpen,   label: "Journal"   },
  { id: "codex",     icon: BookMarked, label: "Codex"     },
];

export default function Navigation({ active, onChange, notifCount = 0 }) {
  return (
    <nav
      className="bottom-nav"
      style={{
        background: "rgba(18,21,31,0.95)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-stretch">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          const showBadge = tab.id === "quest" && notifCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-all"
              style={{ color: isActive ? "#f5c842" : "#4b5563" }}
            >
              {/* Active glow bar at top */}
              {isActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full"
                  style={{ background: "#f5c842", boxShadow: "0 0 8px #f5c842" }}
                />
              )}

              {/* Notification dot */}
              {showBadge && (
                <div
                  className="absolute top-2 right-1/4 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#ef4444", boxShadow: "0 0 4px #ef4444" }}
                />
              )}

              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  filter: isActive ? "drop-shadow(0 0 6px #f5c84299)" : "none",
                  transition: "filter 0.2s ease",
                }}
              />
              <span className="text-xs font-bold uppercase tracking-widest">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
