import { useState, useRef, useEffect } from "react";
import { useToast } from "../common/Toast";
import type { Artist } from "../../types/entities";
import styles from "./ShareMenu.module.css";

interface ShareMenuProps {
  heading: string;
  artists: Artist[];
  className?: string;
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function buildPlainText(heading: string, artists: Artist[]): string {
  const lines = [heading];
  artists.forEach(a => {
    if (a.instagram_handle) {
      lines.push(
        `- ${a.name} @${a.instagram_handle} (https://instagram.com/${a.instagram_handle})`
      );
    } else {
      lines.push(`- ${a.name}`);
    }
  });
  return lines.join("\n");
}

function buildMarkdown(heading: string, artists: Artist[]): string {
  const lines = [`**${heading}**`, ""];
  artists.forEach(a => {
    if (a.instagram_handle) {
      lines.push(
        `- ${a.name} [@${a.instagram_handle}](https://instagram.com/${a.instagram_handle})`
      );
    } else {
      lines.push(`- ${a.name}`);
    }
  });
  return lines.join("\n");
}

export default function ShareMenu({
  heading,
  artists,
  className,
}: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
    setOpen(false);
  };

  return (
    <div ref={ref} className={styles.wrapper}>
      <button
        className={className ?? styles.trigger}
        onClick={e => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
        title="Copy artist list"
      >
        <CopyIcon />
      </button>
      {open && (
        <div className={styles.dropdown}>
          <button
            className={styles.option}
            onClick={e => {
              e.stopPropagation();
              copy(buildPlainText(heading, artists));
            }}
          >
            <span className={styles.optionIcon}>Aa</span>
            Plain Text
          </button>
          <button
            className={styles.option}
            onClick={e => {
              e.stopPropagation();
              copy(buildMarkdown(heading, artists));
            }}
          >
            <span className={styles.optionIcon}>Md</span>
            Reddit Markdown
          </button>
        </div>
      )}
    </div>
  );
}
