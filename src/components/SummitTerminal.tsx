"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { GripVertical, Terminal, Copy, Check } from "lucide-react";
import { soundEngine } from "@/lib/soundEngine";
import { useClimb, type Zone, ZONE_LABELS } from "@/components/ClimbContext";
import { ALL_ZONES } from "@/components/zoneConfig";
import { type MountainHandle } from "@/components/Mountain3D";

// ─── Types ──────────────────────────────────────────────

interface TerminalAction {
  label: string;
  onClick: () => void;
}

interface TerminalLine {
  type: "input" | "output" | "system" | "error" | "ascii" | "hint" | "actions";
  text: string;
  actions?: TerminalAction[];
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

// ─── Constants ──────────────────────────────────────────

const NAV_COMMANDS = ["about", "skills", "projects", "gallery", "contact"];

const TUTORIAL_STEPS = [
  { command: "whoami", description: "Type 'whoami' to learn about William" },
  { command: "docker ps", description: "Type 'docker ps' to view active containers" },
  { command: "mountain", description: "Type 'mountain' for a surprise" },
];

const TERMINAL_KEY = "summit-terminal-state-v3";
const MODE_KEY = "summit-terminal-mode";
const MIN_W = 320;
const MIN_H = 220;

const COMMAND_CHIPS = [
  { label: "About William", command: "whoami" },
  { label: "View Skills", command: "ls skills" },
  { label: "See Projects", command: "docker ps" },
  { label: "Check Uptime", command: "uptime" },
  { label: "Contact", command: "cd contact" },
];

const ZONE_CHECKPOINT_ORDER: Zone[] = ALL_ZONES;

const COMMAND_SUMMARIES: Record<string, string> = {
  whoami: "This is a quick bio — scroll to About for the full story.",
  "docker ps": "These are active client infrastructures I manage.",
  uptime: "99%+ uptime across all managed systems.",
  "cat resume": "Highlights from my resume.",
  about: "Jumped to the About section.",
  skills: "Jumped to the Skills section.",
  projects: "Jumped to the Projects section.",
  gallery: "Jumped to the Gallery section.",
  contact: "Jumped to the Contact section.",
  "cd contact": "Jumped to the Contact section.",
  "ls skills": "Listed files in the skills directory.",
  ls: "Listed files in the current directory.",
  cd: "Changed directory / scrolled to a section.",
  neofetch: "System overview in a stylish format.",
  fortune: "A little mountain wisdom.",
  cowsay: "A cow said the thing.",
  mountain: "The mountain in ASCII form.",
  strawberry: "Hidden collectible — nice find!",
  "cat journal": "A behind-the-scenes note on persistence.",
  journal: "A behind-the-scenes note on persistence.",
  "scan about": "Hidden detail about William's work ethic.",
  "scan skills": "Top skill categories.",
  "scan projects": "Projects with their current status.",
  "scan gallery": "Work gallery contents.",
  "scan contact": "Encouragement to reach out.",
  scan: "Scan a page zone for details.",
  "plant-flag": "Plants the summit flag.",
  summit: "Plants the summit flag.",
  checkpoints: "Shows your checkpoint progress.",
  status: "Live dashboard of current climb status.",
  resume: "View/download resume.",
  help: "Overview of all available commands.",
  pwd: "Current working directory.",
  uname: "Kernel information.",
  ps: "Running system processes.",
  df: "Disk usage across filesystems.",
  free: "Memory usage snapshot.",
  ifconfig: "Network interface configuration.",
  ping: "Network connectivity test.",
  "git status": "Repository status.",
  env: "Environment variables.",
  date: "Current system date and time.",
  cal: "Calendar for the current month.",
  history: "Recent command history.",
  echo: "Echoed the provided text.",
  clear: "Terminal cleared.",
};

const RESPAWN_QUOTES = [
  "You fail a thousand times before you summit.",
  "Just breathe. You can do this. — Madeline",
  "The mountain is still there. So am I.",
  "Falling is just another way to learn the route.",
  "Respawn, rethink, re-climb.",
];

function openResume() {
  window.open("/IT-Focused-Resume.pdf", "_blank", "noopener,noreferrer");
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText("willbarnh@gmail.com");
  } catch {
    // noop
  }
}

type TerminalMode = "tourist" | "expert";

function getSummary(cmd: string, mode: TerminalMode): string | null {
  const key = cmd.toLowerCase();
  if (NAV_COMMANDS.includes(key)) return COMMAND_SUMMARIES[key] ?? null;
  if (mode !== "tourist") return null;
  return COMMAND_SUMMARIES[key] ?? `Ran ${key}.`;
}

function checkpointProgress(checkpoints: Set<Zone>): {
  ready: boolean;
  next?: Zone;
  missing: Zone[];
} {
  const missing = ZONE_CHECKPOINT_ORDER.filter((z) => !checkpoints.has(z));
  return {
    ready: missing.length === 0,
    next: missing[0],
    missing,
  };
}

// ─── Command Handlers ───────────────────────────────────

function journalOutput(): TerminalLine[] {
  return [
    { type: "system", text: "Entry 001 — On Persistence" },
    { type: "output", text: "" },
    { type: "output", text: "I treat infrastructure like a mountain climb:" },
    { type: "output", text: "check the gear, plan the route, expect the storm," },
    { type: "output", text: "and keep moving when things break." },
    { type: "output", text: "" },
    { type: "output", text: "99% uptime isn't luck. It's showing up every day." },
  ];
}

// ─── Helpers ────────────────────────────────────────────

function getSavedState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TERMINAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return null;
}

function saveState(pos: { x: number; y: number }, size: { w: number; h: number }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TERMINAL_KEY, JSON.stringify({ pos, size }));
  } catch { /* noop */ }
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

function snapToEdges(x: number, y: number, w: number, h: number) {
  const threshold = 12;
  let sx = x;
  let sy = y;
  if (Math.abs(sx) < threshold) sx = 0;
  if (Math.abs(sy) < threshold) sy = 0;
  if (Math.abs(sx + w - window.innerWidth) < threshold) sx = window.innerWidth - w;
  if (Math.abs(sy + h - window.innerHeight) < threshold) sy = window.innerHeight - h;
  return { x: sx, y: sy };
}

// ─── Component ──────────────────────────────────────────

interface SummitTerminalProps {
  mountainRef: React.RefObject<MountainHandle | null>;
}

export default function SummitTerminal({ mountainRef }: SummitTerminalProps) {
  // ─── State ─────────────────────────────────────────────

  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 640;
  });
  const [hasStarted, setHasStarted] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentTime, setCurrentTime] = useState("--:--");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [commandCount, setCommandCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mode, setMode] = useState<TerminalMode>("tourist");
  const [isProcessing, setIsProcessing] = useState(false);

  // Position & size — defaults are SSR-safe; restored from localStorage after mount
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 460, h: 300 });

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [isResizing, setIsResizing] = useState(false);
  const resizeDir = useRef<ResizeDir | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, w: 560, h: 420, px: 0, py: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(pos);
  const sizeRef = useRef(size);

  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { sizeRef.current = size; }, [size]);



  const isOpenRef = useRef(isOpen);
  const isClosingRef = useRef(isClosing);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { isClosingRef.current = isClosing; }, [isClosing]);

  const closeTerminal = useCallback(() => {
    if (isClosingRef.current) return;
    soundEngine.close();
    setIsClosing(true);
  }, []);

  const openTerminal = useCallback(() => {
    soundEngine.open();
    setIsOpen(true);
    setIsClosing(false);
    setIsVisible(false);
    const id = requestAnimationFrame(() => setIsVisible(true));
    setTimeout(focusInput, 100);
    return id;
  }, []);

  // ─── Climb state ───────────────────────────────────────

  const {
    currentZone,
    altitude,
    zonesDiscovered,
    checkpoints,
    commandsRun,
    summitReached,
    goldenStrawberry,
    fallCount,
    lastReaction,
    lastInspect,
    recordCommand,
    recordFall,
    setSummitReached,
    checkGoldenStrawberry,
    triggerReaction,
  } = useClimb();

  const prevZoneRef = useRef<Zone | null>(null);
  const zonesSeenRef = useRef<Set<Zone>>(new Set());
  const lastToggleRef = useRef<number | null>(null);
  const summitPrintedRef = useRef(false);
  const goldenPrintedRef = useRef(false);

  // ─── Command Handlers ─────────────────────────────────

const COMMANDS: Record<string, (args: string[]) => TerminalLine[]> = {
  help: () => [
    { type: "system", text: "🏔️  SummitOS v2.0" },
    { type: "system", text: "" },
    { type: "system", text: "NAVIGATION:" },
    { type: "output", text: "  about, skills, projects, gallery, contact  — Jump to sections" },
    { type: "output", text: "" },
    { type: "system", text: "SCANNING:" },
    { type: "output", text: "  scan <section>  — Scan a page zone (about, skills, projects, gallery, contact)" },
    { type: "output", text: "  inspect         — Click a project title to send its details here" },
    { type: "output", text: "" },
    { type: "system", text: "COMMANDS:" },
    { type: "output", text: "  whoami      — About William" },
    { type: "output", text: "  neofetch    — System info" },
    { type: "output", text: "  docker ps   — Active containers" },
    { type: "output", text: "  uptime      — Uptime stats" },
    { type: "output", text: "  cat resume  — Resume highlights" },
    { type: "output", text: "  resume      — View/download resume" },
    { type: "output", text: "  pwd         — Current directory" },
    { type: "output", text: "  ls, cd      — File navigation" },
    { type: "output", text: "  uname       — Kernel info" },
    { type: "output", text: "  ps          — Running processes" },
    { type: "output", text: "  df          — Disk usage" },
    { type: "output", text: "  free        — Memory stats" },
    { type: "output", text: "  ifconfig    — Network interfaces" },
    { type: "output", text: "  ping        — Test connectivity" },
    { type: "output", text: "  git status  — Repository status" },
    { type: "output", text: "  env         — Environment variables" },
    { type: "output", text: "  date        — Current date/time" },
    { type: "output", text: "  cal         — Calendar" },
    { type: "output", text: "  history     — Command history" },
    { type: "output", text: "  fortune     — Random quote" },
    { type: "output", text: "  cowsay      — Talking cow" },
    { type: "output", text: "  clear       — Clear terminal" },
    { type: "output", text: "  mountain    — Celeste mountain ASCII" },
    { type: "output", text: "  strawberry  — Hidden collectible" },
      { type: "output", text: "  checkpoints — Checkpoint progress" },
      { type: "output", text: "  status      — Live dashboard" },
      { type: "output", text: "  plant-flag  — Plant the summit flag" },
      { type: "output", text: "  summit      — Plant the summit flag" },
    { type: "output", text: "" },
    { type: "hint", text: "Tip: Use Tab to autocomplete. Press ` to toggle terminal." },
    { type: "output", text: "" },
  ],

  whoami: () => [
    { type: "output", text: "" },
    { type: "output", text: "Name:     William Barnhart" },
    { type: "output", text: "Title:    Systems Administrator & Infrastructure Engineer" },
    { type: "output", text: "Location: Spokane Valley, WA" },
    { type: "output", text: "Uptime:   99%+ across all client infrastructure" },
    { type: "output", text: "" },
    { type: "output", text: "Specializes in: Linux, Docker, Next.js, NestJS, Networking, AI Dev" },
    { type: "output", text: "" },
  ],

  neofetch: () => [
    { type: "ascii", text: "         .          .              summit@infrastructure" },
    { type: "ascii", text: "        / \\        / \\             ─────────────────────" },
    { type: "ascii", text: "       /   \\  🍓  /   \\            OS: SummitOS v2.0" },
    { type: "ascii", text: "      /     \\    /     \\           Host: William Barnhart" },
    { type: "ascii", text: "     /       \\  /       \\          Uptime: 99%+" },
    { type: "ascii", text: "    /    ⛰    \\/    ⛰    \\         Shell: bash" },
    { type: "ascii", text: "   /          🏔           \\        Resolution: Full Stack" },
    { type: "ascii", text: "  /─────────────────────────\\       WM: Docker" },
    { type: "ascii", text: " /   Infrastructure Mountain  \\     Terminal: SummitTerm" },
    { type: "ascii", text: "/───────────────────────────────\\    CPU: Linux / Windows" },
    { type: "ascii", text: "                                 \\   GPU: Next.js / NestJS" },
    { type: "ascii", text: "                                  \\  Memory: 99%+ Available" },
  ],

  "docker ps": () => [
    { type: "output", text: "CONTAINER ID   IMAGE                    STATUS          PORTS     NAMES" },
    { type: "output", text: "a1b2c3d4       pve-district/auth        Up 73 days       80/tcp   pve-district" },
    { type: "output", text: "e5f6g7h8       boredomhub/pterodactyl   Up 94 days       80/tcp   boredomhub-panel" },
    { type: "output", text: "i9j0k1l2       cozycord/pterodactyl     Exited (0) 30 days ago       cozycord-panel" },
    { type: "output", text: "m3n4o5p6       caeranthil/nestjs        Up 73 days       8080/tcp caeranthil-api" },
    { type: "output", text: "q7r8s9t0       deepwoken/redis          Up 203 days      6379/tcp deepwoken-cache" },
    { type: "output", text: "u1v2w3x4       deepwoken/bot            Up 203 days      ----     deepwoken-bot" },
    { type: "output", text: "" },
    { type: "system", text: "5 running, 1 stopped (cozycord-panel)." },
  ],

  uptime: () => [
    { type: "output", text: " 16:42:05 up 187 days,  8:23,  4 clients,  load average: 0.12, 0.08, 0.05" },
    { type: "output", text: "" },
    { type: "output", text: "Infrastructure Status:    🟢 All Systems Operational" },
    { type: "output", text: "PVE District:             🟢 99.8% uptime (73 days)" },
    { type: "output", text: "BoredomHub LLC:           🟢 99.5% uptime (94 days)" },
    { type: "output", text: "Cozycord Services:        🟡 past project (no longer maintained)" },
    { type: "output", text: "DeepwokenTrader:          🟢 99.7% uptime (203 days)" },
    { type: "output", text: "" },
    { type: "system", text: "Climbing higher. Every day counts." },
  ],

  ls: (args) => {
    const target = args[0] || "";
    if (!target) {
      return [
        { type: "output", text: "" },
        { type: "output", text: "total 5" },
        { type: "output", text: "drwxr-xr-x  about/      skills/      projects/" },
        { type: "output", text: "drwxr-xr-x  gallery/    contact/     resume.md" },
        { type: "output", text: "" },
      ];
    }
    const validDirs: Record<string, string[]> = {
      about: ["bio.md", "location.txt", "experience.log"],
      skills: [
        "linux.sh",
        "windows.ps1",
        "docker.yml",
        "proxmox.yml",
        "pterodactyl.sh",
        "nextjs.tsx",
        "nestjs.ts",
        "api-endpoints.http",
        "sql.db",
        "oauth.json",
        "caddy.conf",
        "redis.conf",
        "wireguard.conf",
        "bash.sh",
        "ai-dev.py",
      ],
      projects: ["heroesmc.net/", "boredomhub/", "cozycord/", "pve-district/"],
      gallery: ["screenshots/", "tech-stack/", "deployments/"],
      contact: ["email.md", "phone.txt", "discord.txt", "resume.pdf"],
    };
    if (validDirs[target]) {
      return [
        { type: "output", text: "" },
        { type: "output", text: `${target}:` },
        ...validDirs[target].map((f) => ({ type: "output" as const, text: `  ${f}` })),
        { type: "output", text: "" },
      ];
    }
    return [{ type: "error", text: `ls: ${target}: No such file or directory` }];
  },

  pwd: () => [{ type: "output", text: "/home/summit/infrastructure-mountain" }],

  uname: (args) => {
    const flag = args[0] || "";
    if (flag === "-a") {
      return [
        { type: "output", text: "Linux summit-infrastructure 6.8.0-celeste-custom #1 SMP x86_64 GNU/Linux" },
      ];
    }
    return [{ type: "output", text: "Linux" }];
  },

  ps: () => [
    { type: "output", text: "  PID TTY          TIME CMD" },
    { type: "output", text: "    1 ?        00:00:01 systemd" },
    { type: "output", text: "  412 ?        00:00:05 dockerd" },
    { type: "output", text: "  891 ?        00:00:12 nginx" },
    { type: "output", text: " 1023 ?        00:00:08 node (nextjs)" },
    { type: "output", text: " 1456 ?        00:00:03 sshd" },
    { type: "output", text: " 1890 ?        00:00:01 pterodactyl-wings" },
    { type: "output", text: " 2103 ?        00:00:00 redis-server" },
    { type: "output", text: " 2847 pts/0    00:00:00 bash" },
    { type: "output", text: " 2951 pts/0    00:00:00 summit-term" },
  ],

  df: () => [
    { type: "output", text: "Filesystem      Size  Used Avail Use% Mounted on" },
    { type: "output", text: "udev            7.8G     0  7.8G   0% /dev" },
    { type: "output", text: "tmpfs           1.6G  2.1M  1.6G   1% /run" },
    { type: "output", text: "/dev/nvme0n1p1  456G  198G  236G  46% /" },
    { type: "output", text: "tmpfs           7.8G  180M  7.6G   3% /dev/shm" },
    { type: "output", text: "/dev/sda1       1.8T  890G  840G  52% /mnt/data" },
    { type: "output", text: "tmpfs           5.0M  4.0K  5.0M   1% /run/lock" },
  ],

  free: () => [
    { type: "output", text: "              total        used        free      shared  buff/cache   available" },
    { type: "output", text: "Mem:          15632        4231        2145         890        9256       10234" },
    { type: "output", text: "Swap:          8192           0        8192" },
  ],

  ifconfig: () => [
    { type: "output", text: "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500" },
    { type: "output", text: "        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255" },
    { type: "output", text: "        inet6 fe80::20c:29ff:feb9:7c30  prefixlen 64  scopeid 0x20<link>" },
    { type: "output", text: "        RX packets 1847291  bytes 1.2 GiB" },
    { type: "output", text: "        TX packets 923841  bytes 412.3 MiB" },
    { type: "output", text: "" },
    { type: "output", text: "wg0: flags=209<UP,POINTOPOINT,RUNNING,NOARP>  mtu 1420" },
    { type: "output", text: "        inet 10.200.200.1  netmask 255.255.255.0" },
    { type: "output", text: "        RX packets 45231  bytes 12.4 MiB" },
    { type: "output", text: "        TX packets 48192  bytes 15.8 MiB" },
  ],

  ping: (args) => {
    const target = args[0] || "google.com";
    return [
      { type: "output", text: `PING ${target} (142.250.80.46) 56(84) bytes of data.` },
      { type: "output", text: `64 bytes from ${target}: icmp_seq=1 ttl=117 time=14.2 ms` },
      { type: "output", text: `64 bytes from ${target}: icmp_seq=2 ttl=117 time=13.8 ms` },
      { type: "output", text: `64 bytes from ${target}: icmp_seq=3 ttl=117 time=14.1 ms` },
      { type: "output", text: "" },
      { type: "output", text: `--- ${target} ping statistics ---` },
      { type: "output", text: `3 packets transmitted, 3 received, 0% packet loss, time 2003ms` },
      { type: "output", text: `rtt min/avg/max/mdev = 13.812/14.033/14.201/0.165 ms` },
    ];
  },

  "git status": () => [
    { type: "output", text: "On branch main" },
    { type: "output", text: "Your branch is up to date with 'origin/main'." },
    { type: "output", text: "" },
    { type: "output", text: "Changes not staged for commit:" },
    { type: "output", text: "  (use \"git add <file>...\" to update what will be committed)" },
    { type: "output", text: "  (use \"git restore <file>...\" to discard changes in working directory)" },
    { type: "output", text: "\tmodified:   skills/docker-compose.yml" },
    { type: "output", text: "\tmodified:   projects/boredomhub/deploy.sh" },
    { type: "output", text: "" },
    { type: "output", text: "no changes added to commit (use \"git add\" and/or \"git commit -a\")" },
  ],

  env: () => [
    { type: "output", text: "SHELL=/bin/bash" },
    { type: "output", text: "USER=summit" },
    { type: "output", text: "HOME=/home/summit" },
    { type: "output", text: "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" },
    { type: "output", text: "EDITOR=nvim" },
    { type: "output", text: "LANG=en_US.UTF-8" },
    { type: "output", text: "TERM=xterm-256color" },
    { type: "output", text: "INFRASTRUCTURE_MOUNTAIN=1" },
    { type: "output", text: "DOCKER_HOST=unix:///var/run/docker.sock" },
    { type: "output", text: "CELESTE_EDITION=true" },
  ],

  date: () => [{ type: "output", text: new Date().toString() }],

  cal: () => {
    const now = new Date();
    const month = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    return [
      { type: "output", text: `     ${month}` },
      { type: "output", text: "Su Mo Tu We Th Fr Sa" },
      { type: "output", text: " 1  2  3  4  5  6  7" },
      { type: "output", text: " 8  9 10 11 12 13 14" },
      { type: "output", text: "15 16 17 18 19 20 21" },
      { type: "output", text: "22 23 24 25 26 27 28" },
      { type: "output", text: "29 30" },
    ];
  },

  fortune: () => {
    const quotes = [
      "Just breathe. You can do this. — Madeline",
      "The mountain is calling, and I must go.",
      "Every expert was once a beginner.",
      "Infrastructure is the mountain. Code is the climb.",
      "99% uptime is not luck. It's discipline.",
      "Containers are just tiny homes for your code.",
      "The best time to automate was yesterday. The second best time is now.",
      "SSH into production? Bold move. — Every SRE ever",
      "It works on my machine... so I containerized my machine.",
    ];
    return [
      { type: "output", text: "" },
      { type: "output", text: `  "${quotes[Math.floor(Math.random() * quotes.length)]}"` },
      { type: "output", text: "" },
    ];
  },

  cowsay: (args) => {
    const msg = args.join(" ") || "Hello from the Infrastructure Mountain!";
    const top = " " + "_".repeat(msg.length + 2);
    const mid = `< ${msg} >`;
    const bot = " " + "-".repeat(msg.length + 2);
    return [
      { type: "ascii", text: top },
      { type: "ascii", text: mid },
      { type: "ascii", text: bot },
      { type: "ascii", text: "        \\   ^__^" },
      { type: "ascii", text: "         \\  (oo)\\_______" },
      { type: "ascii", text: "            (__)\\       )\\/\\" },
      { type: "ascii", text: "                ||----w |" },
      { type: "ascii", text: "                ||     ||" },
    ];
  },

  echo: (args) => [{ type: "output", text: args.join(" ") }],

  history: () => [
    { type: "output", text: "  1  whoami" },
    { type: "output", text: "  2  neofetch" },
    { type: "output", text: "  3  docker ps" },
    { type: "output", text: "  4  ls" },
    { type: "output", text: "  5  cd projects" },
    { type: "output", text: "  6  cat resume" },
    { type: "output", text: "  7  uptime" },
    { type: "output", text: "  8  uname -a" },
    { type: "output", text: "  9  fortune" },
    { type: "output", text: " 10  cowsay 'Keep climbing!'" },
  ],

  mountain: () => [
    { type: "ascii", text: "" },
    { type: "ascii", text: "                    🏔️ Celeste Mountain 🏔️" },
    { type: "ascii", text: "                       ★ 8,000m summit ★" },
    { type: "ascii", text: "                         /\\\\" },
    { type: "ascii", text: "                        /  \\          🍓" },
    { type: "ascii", text: "                       / 🏔️ \\        " },
    { type: "ascii", text: "                      /______\\     🍓" },
    { type: "ascii", text: "                     /        \\        🍓" },
    { type: "ascii", text: "                    /          \\      " },
    { type: "ascii", text: "                   /   🏔️       \\    🍓" },
    { type: "ascii", text: "                  /              \\    " },
    { type: "ascii", text: "                 /________________\\  🍓" },
    { type: "ascii", text: "                /                    \\ " },
    { type: "ascii", text: "               /       🏔️             \\ " },
    { type: "ascii", text: "              /                        \\ " },
    { type: "ascii", text: "             /__________________________\\ " },
    { type: "ascii", text: "            /       Infrastructure        \\ " },
    { type: "ascii", text: "           /         Mountain Base          \\ " },
    { type: "ascii", text: "          /__________________________________\\ " },
    { type: "ascii", text: "" },
    { type: "output", text: "  'Just breathe. You can do this. The summit is in reach.'" },
    { type: "output", text: "                                           — Madeline" },
    { type: "output", text: "" },
  ],

  strawberry: () => [
    { type: "ascii", text: "" },
    { type: "ascii", text: "        🍓🍓🍓" },
    { type: "ascii", text: "      🍓  🍓  🍓" },
    { type: "ascii", text: "     🍓   🍓   🍓" },
    { type: "ascii", text: "      🍓  🍓  🍓" },
    { type: "ascii", text: "        🍓🍓🍓" },
    { type: "ascii", text: "" },
    { type: "output", text: "You found the strawberries!" },
    { type: "output", text: "In Celeste, strawberries require persistence, precision, and patience." },
    { type: "output", text: "" },
    { type: "system", text: "Just like building a full tech stack. Every component matters." },
    { type: "output", text: "" },
  ],

  "cat journal": journalOutput,

  journal: journalOutput,

  scan: (args) => {
    const zone = args[0]?.toLowerCase();
    const validZones = ["about", "skills", "projects", "gallery", "contact"];
    if (!zone || !validZones.includes(zone)) {
      return [
        { type: "error", text: `scan: unknown zone '${zone ?? ""}'` },
        { type: "hint", text: "Try: scan about, scan skills, scan projects, scan gallery, scan contact" },
      ];
    }
    switch (zone) {
      case "about":
        return [
          { type: "system", text: "🔍 Scanning About..." },
          { type: "output", text: "" },
          { type: "output", text: "Hidden detail: William treats 99% uptime like a trail marker —" },
          { type: "output", text: "not the destination, but proof you're still climbing." },
          { type: "output", text: "" },
          { type: "output", text: "He documents every runbook, automates the boring stuff," },
          { type: "output", text: "and debugs with the patience of someone who has fallen" },
          { type: "output", text: "off the same ledge a hundred times." },
          { type: "output", text: "" },
        ];
      case "skills":
        return [
          { type: "system", text: "🔍 Scanning Skills..." },
          { type: "output", text: "" },
          { type: "output", text: "Top skill categories:" },
          { type: "output", text: "  🟢 Linux & Systems Admin" },
          { type: "output", text: "  🟢 Windows Server & Desktop" },
          { type: "output", text: "  🟢 Docker & Container Orchestration" },
          { type: "output", text: "  🟢 Proxmox VE & Virtualization" },
          { type: "output", text: "  🟢 Pterodactyl Panel Administration" },
          { type: "output", text: "  🟢 Next.js / NestJS Full-Stack" },
          { type: "output", text: "  🟢 API Development & Endpoints" },
          { type: "output", text: "  🟢 SQL Databases" },
          { type: "output", text: "  🟢 OAuth & Authentication" },
          { type: "output", text: "  🟢 Networking & Security" },
          { type: "output", text: "  🟢 Shell Scripting & Automation" },
          { type: "output", text: "  🟢 AI-Assisted Development" },
          { type: "output", text: "" },
        ];
      case "projects":
        return [
          { type: "system", text: "🔍 Scanning Projects..." },
          { type: "output", text: "" },
          { type: "output", text: "  [ARCHIVED] HEROESMC.NET INFRASTRUCTURE" },
          { type: "output", text: "  [PAST] COZYCORD SERVICES" },
          { type: "output", text: "  [LIVE] BOREDOMHUB LLC" },
          { type: "output", text: "  [LIVE] PVE DISTRICT" },
          { type: "output", text: "" },
          { type: "hint", text: "Click any project title to inspect details." },
          { type: "output", text: "" },
        ];
      case "gallery":
        return [
          { type: "system", text: "🔍 Scanning Gallery..." },
          { type: "output", text: "" },
          { type: "output", text: "Trail markers from real deployments:" },
          { type: "output", text: "  screenshots/  — live dashboards & panels" },
          { type: "output", text: "  tech-stack/   — Docker, Proxmox, Caddy" },
          { type: "output", text: "  deployments/  — baremetal to cloud" },
          { type: "output", text: "" },
        ];
      case "contact":
        return [
          { type: "system", text: "🔍 Scanning Contact..." },
          { type: "output", text: "" },
          { type: "output", text: "Summit approach clear." },
          { type: "output", text: "Reach out if you need someone who can keep the lights on," },
          { type: "output", text: "automate the toil, and debug under pressure." },
          { type: "output", text: "" },
          { type: "output", text: "Email: willbarnh@gmail.com" },
          { type: "output", text: "Discord: lit_endurance" },
          { type: "output", text: "" },
        ];
      default:
        return [];
    }
  },

  "cat resume": () => [
    { type: "system", text: "# William Barnhart — Resume" },
    { type: "system", text: "────────────────────────────────────────────────────" },
    { type: "output", text: "" },
    { type: "output", text: "## Professional Summary" },
    { type: "output", text: "Systems Administrator managing multi-client hosting" },
    { type: "output", text: "infrastructure with 99%+ uptime for LLCs and dev teams." },
    { type: "output", text: "" },
    { type: "output", text: "## Key Skills" },
    { type: "output", text: "  • Linux & Windows Server Administration" },
    { type: "output", text: "  • Docker & Container Orchestration" },
    { type: "output", text: "  • Proxmox VE, Pterodactyl & Virtualization" },
    { type: "output", text: "  • Next.js & NestJS Full-Stack Development" },
    { type: "output", text: "  • API Development & REST Endpoints" },
    { type: "output", text: "  • SQL Databases & Data Management" },
    { type: "output", text: "  • OAuth, Authentication & Security" },
    { type: "output", text: "  • Networking, VPNs & Firewalls" },
    { type: "output", text: "  • Shell Scripting & Automation" },
    { type: "output", text: "  • AI-Assisted Development" },
    { type: "output", text: "" },
    { type: "output", text: "## Current Clients" },
    { type: "output", text: "  • BoredomHub LLC — Pterodactyl, snapshots & backups" },
    { type: "output", text: "  • PVE District — Proxmox VM + Docker containers" },
    { type: "output", text: "" },
    { type: "output", text: "## Past Clients" },
    { type: "output", text: "  • Cozycord — Pterodactyl, snapshots & backups" },
    { type: "output", text: "" },
    { type: "output", text: "## Profile" },
    { type: "output", text: "  • Resume: /IT-Focused-Resume.pdf" },
    { type: "output", text: "" },
    { type: "system", text: "────────────────────────────────────────────────────" },
  ],

  resume: () => [
    { type: "system", text: "📄 Resume" },
    { type: "output", text: "────────────────────" },
    { type: "output", text: "William Barnhart — Systems Administrator & Infrastructure Engineer" },
    {
      type: "actions",
      text: "",
      actions: [
        { label: "View resume", onClick: openResume },
        { label: "Copy email", onClick: copyEmail },
      ],
    },
  ],

  cd: (args) => {
    const target = args[0] || "";
    const valid = ["about", "skills", "projects", "gallery", "contact"];
    if (valid.includes(target)) {
      return [{ type: "system", text: `Navigating to ${target}/...` }];
    }
    return [
      { type: "error", text: `cd: ${target}: No such directory` },
      { type: "output", text: "Try: about, skills, projects, gallery, contact" },
    ];
  },

  status: () => {
    const zoneLabel = currentZone ? ZONE_LABELS[currentZone] : "—";
    const checkpointText = checkpointProgress(checkpoints).ready
      ? "All established"
      : `${checkpoints.size}/6 established`;
    return [
      { type: "system", text: "🏔️  SummitOS Status" },
      { type: "system", text: "────────────────────" },
      { type: "output", text: `Zone:            ${zoneLabel}` },
      { type: "output", text: `Altitude:        ${altitude.toLocaleString()}m` },
      { type: "output", text: `Checkpoints:     ${checkpointText}` },
      { type: "output", text: `Commands issued: ${commandsRun.size}` },
      { type: "output", text: `Falls:           ${fallCount}` },
      { type: "output", text: `Summit:          ${summitReached ? "Reached" : "Not yet reached"}` },
      { type: "output", text: `Golden Berry:    ${goldenStrawberry ? "Unlocked" : "Locked"}` },
      { type: "output", text: "Containers:      All healthy · 99%+ uptime" },
      { type: "output", text: "" },
    ];
  },

  "plant-flag": () => [
    { type: "system", text: "Planting summit flag..." },
  ],

  summit: () => [
    { type: "system", text: "Planting summit flag..." },
  ],
};

  // ─── Climb log: zone changes ───────────────────────────

  useEffect(() => {
    if (!currentZone || currentZone === prevZoneRef.current) return;
    prevZoneRef.current = currentZone;
    const label = ZONE_LABELS[currentZone];
    const zoneName = currentZone.charAt(0).toUpperCase() + currentZone.slice(1);
    const isFirstTime = !zonesSeenRef.current.has(currentZone);
    zonesSeenRef.current.add(currentZone);
    const action = isFirstTime ? "Zone discovered" : "Returned to";
    const progress = checkpointProgress(checkpoints);
    const checkpointText = progress.ready
      ? "All checkpoints established"
      : `Checkpoints: ${checkpoints.size}/6`;

    const lines: TerminalLine[] = [
      {
        type: "system",
        text: `[${label}] Altitude: ${altitude.toLocaleString()}m · ${action}: ${zoneName}`,
      },
    ];

    if (currentZone === "contact" && !summitReached) {
      lines.push(
        { type: "hint", text: `🏁 Summit in reach · ${checkpointText}` },
        { type: "hint", text: "Run 'cd contact' or click Plant Flag to plant the flag." }
      );
    }

    setLines((prev) => [...prev, ...lines]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentZone]);

  // ─── Checkpoint notifications ──────────────────────────

  const prevCheckpointsRef = useRef(checkpoints);
  useEffect(() => {
    const prev = prevCheckpointsRef.current;
    prevCheckpointsRef.current = checkpoints;
    if (checkpoints.size <= prev.size) return;

    const newZones = ZONE_CHECKPOINT_ORDER.filter((z) => checkpoints.has(z) && !prev.has(z));
    const label = newZones.length > 0 ? ZONE_LABELS[newZones[0]] : "Unknown";
    setLines((p) => [
      ...p,
      { type: "system", text: `✅ Checkpoint established: ${label}` },
      { type: "output", text: `Checkpoints: ${checkpoints.size}/6` },
    ]);
  }, [checkpoints]);

  // ─── Summit stamp ──────────────────────────────────────

  useEffect(() => {
    if (summitReached && !summitPrintedRef.current) {
      summitPrintedRef.current = true;
      mountainRef.current?.triggerReaction("summit");
      setLines((prev) => [
        ...prev,
        { type: "system", text: "" },
        { type: "ascii", text: "🏔️  SUMMIT REACHED" },
        { type: "ascii", text: "──────────────────────────" },
        { type: "output", text: `Altitude: ${altitude.toLocaleString()}m` },
        { type: "output", text: `Zones discovered: ${zonesDiscovered.size}/6` },
        { type: "output", text: `Commands issued: ${commandsRun.size}` },
        { type: "output", text: `Falls: ${fallCount}` },
        { type: "output", text: "" },
        { type: "system", text: "\"The mountain doesn't care how many times you fall." },
        { type: "system", text: " It cares that you keep climbing.\"" },
        { type: "output", text: "" },
        {
          type: "actions",
          text: "",
          actions: [
            {
              label: "Send email",
              onClick: () => {
                window.location.href = "mailto:willbarnh@gmail.com";
              },
            },
            {
              label: "View resume",
              onClick: openResume,
            },
            {
              label: "Back to base",
              onClick: () => {
                const el = document.getElementById("hero");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              },
            },
          ],
        },
      ]);
    }
  }, [summitReached, altitude, zonesDiscovered.size, commandsRun.size, fallCount]);

  // ─── Golden strawberry ─────────────────────────────────

  useEffect(() => {
    checkGoldenStrawberry();
  }, [checkGoldenStrawberry, currentZone, zonesDiscovered.size, commandsRun.size, summitReached]);

  useEffect(() => {
    if (goldenStrawberry && !goldenPrintedRef.current) {
      goldenPrintedRef.current = true;
      mountainRef.current?.triggerReaction("golden-strawberry");
      setLines((prev) => [
        ...prev,
        { type: "system", text: "" },
        { type: "ascii", text: "🏆 GOLDEN STRAWBERRY UNLOCKED" },
        { type: "output", text: "" },
        { type: "output", text: "You explored the whole climb." },
        { type: "output", text: "That same curiosity is what keeps my infrastructure running." },
        { type: "output", text: "" },
        { type: "system", text: "Reward: hidden `cat journal` entry available." },
        { type: "output", text: "" },
      ]);
    }
  }, [goldenStrawberry]);

  // ─── Project inspect from ProjectsSection ──────────────

  const prevInspectRef = useRef<string | null>(null);
  useEffect(() => {
    if (!lastInspect) return;
    const key = `${lastInspect.title}-${lastInspect.status}`;
    if (key === prevInspectRef.current) return;
    prevInspectRef.current = key;

    const id = openTerminal();

    setLines((prev) => [
      ...prev,
      { type: "system", text: `🔍 Inspecting: ${lastInspect.title}` },
      { type: "output", text: `Status: ${lastInspect.status}` },
      { type: "output", text: `Stack: ${lastInspect.tags.join(" · ")}` },
      { type: "output", text: "" },
      { type: "output", text: lastInspect.description },
      { type: "output", text: "" },
    ]);

    return () => cancelAnimationFrame(id);
  }, [lastInspect]);

  // ─── Toggle from status bar ────────────────────────────

  useEffect(() => {
    if (lastReaction?.type !== "toggle-terminal") return;
    if (lastReaction.timestamp === lastToggleRef.current) return;
    lastToggleRef.current = lastReaction.timestamp;

    if (isOpen) {
      closeTerminal();
    } else {
      const id = openTerminal();
      return () => cancelAnimationFrame(id);
    }
  }, [lastReaction, isOpen]);

  // ─── CRT power-off completion ──────────────────────────

  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 620);
    return () => clearTimeout(timer);
  }, [isClosing]);

  // ─── Entrance animation ────────────────────────────────

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Load saved terminal mode (Tourist / Expert)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === "expert" || saved === "tourist") {
      setMode(saved);
    }
  }, []);

  // ─── Restore saved geometry + initial clock read ───────

  useEffect(() => {
    setCurrentTime(formatTime(new Date()));
    if (typeof window === "undefined") return;
    const saved = getSavedState();
    if (saved?.pos) {
      posRef.current = saved.pos;
      setPos(saved.pos);
    } else {
      const defaultPos = {
        x: Math.max(20, window.innerWidth - 460 - 20),
        y: Math.max(20, window.innerHeight - 300 - 20),
      };
      posRef.current = defaultPos;
      setPos(defaultPos);
    }
    if (saved?.size) {
      sizeRef.current = saved.size;
      setSize(saved.size);
    }
  }, []);

  // ─── Clock ─────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  // ─── Auto-scroll ─────────────────────────────────────

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // ─── Welcome + tutorial ──────────────────────────────

  useEffect(() => {
    if (!isOpen || hasStarted) return;
    setHasStarted(true);
    const hasSeenTutorial = localStorage.getItem("summitos-tutorial-v2");

    const welcome: TerminalLine[] = [
      { type: "system", text: "🏔️  SummitOS v2.0" },
      { type: "system", text: "    Kernel: Linux 6.8.0-celeste-custom" },
      { type: "system", text: "" },
    ];

    if (!hasSeenTutorial) {
      setShowTutorial(true);
      welcome.push(
        { type: "hint", text: "👋 First time here? Try these commands:" },
        { type: "hint", text: "► Tutorial 1/3: Type 'whoami' to learn about William" },
        { type: "output", text: "" }
      );
      localStorage.setItem("summitos-tutorial-v2", "started");
    } else {
      welcome.push(
        { type: "system", text: "Type 'help' for all commands." },
        { type: "system", text: "Navigate: about, skills, projects, gallery, contact" },
        { type: "output", text: "" }
      );
    }
    setLines(welcome);
  }, [isOpen, hasStarted]);

  // ─── Body scroll lock when maximized ─────────────────

  useEffect(() => {
    if (isMaximized) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [isMaximized]);

  // ─── Window resize handler ───────────────────────────

  const clampToViewport = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640;
    const margin = isMobile ? 8 : 20;
    const minVisible = isMobile ? 24 : 60;

    const currentSize = sizeRef.current;
    const currentPos = posRef.current;

    const nextSize = {
      w: Math.max(MIN_W, Math.min(currentSize.w, vw - margin * 2)),
      h: Math.max(MIN_H, Math.min(currentSize.h, vh - margin * 2)),
    };
    const nextPos = {
      x: Math.min(Math.max(currentPos.x, minVisible - nextSize.w), vw - minVisible),
      y: Math.min(Math.max(currentPos.y, minVisible - nextSize.h), vh - minVisible),
    };

    setSize(nextSize);
    setPos(nextPos);
  }, []);

  useEffect(() => {
    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [clampToViewport]);

  // ─── Global keyboard shortcut ────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
        if (isTyping && !terminalRef.current?.contains(target)) return;
        e.preventDefault();
        if (isOpenRef.current) {
          closeTerminal();
        } else {
          openTerminal();
        }
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        const nextPos = {
          x: Math.max(20, window.innerWidth - 460 - 20),
          y: Math.max(20, window.innerHeight - 300 - 20),
        };
        const nextSize = { w: 460, h: 300 };
        setPos(nextPos);
        setSize(nextSize);
        saveState(nextPos, nextSize);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ─── Global mouse events for drag + resize ───────────

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        setPos({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
      if (isResizing && resizeDir.current) {
        e.preventDefault();
        const dir = resizeDir.current;
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;

        let newX = resizeStart.current.px;
        let newY = resizeStart.current.py;
        let newW = resizeStart.current.w;
        let newH = resizeStart.current.h;

        if (dir.includes("e")) newW = resizeStart.current.w + dx;
        if (dir.includes("w")) {
          newW = resizeStart.current.w - dx;
          newX = resizeStart.current.px + dx;
        }
        if (dir.includes("s")) newH = resizeStart.current.h + dy;
        if (dir.includes("n")) {
          newH = resizeStart.current.h - dy;
          newY = resizeStart.current.py + dy;
        }

        if (newW < MIN_W) {
          if (dir.includes("w")) newX = resizeStart.current.px + (resizeStart.current.w - MIN_W);
          newW = MIN_W;
        }
        if (newH < MIN_H) {
          if (dir.includes("n")) newY = resizeStart.current.py + (resizeStart.current.h - MIN_H);
          newH = MIN_H;
        }

        setPos({ x: newX, y: newY });
        setSize({ w: newW, h: newH });
      }
    };

    const onUp = () => {
      if (isDragging) {
        setPos((prev) => {
          const snapped = snapToEdges(prev.x, prev.y, size.w, size.h);
          saveState(snapped, size);
          return snapped;
        });
      }
      if (isResizing) {
        saveState(pos, size);
      }
      setIsDragging(false);
      setIsResizing(false);
      resizeDir.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, isResizing, size.w, size.h, pos.x, pos.y]);

  // ─── Touch events for mobile ─────────────────────────

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        setPos({
          x: touch.clientX - dragOffset.current.x,
          y: touch.clientY - dragOffset.current.y,
        });
      }
    };
    const onTouchEnd = () => {
      if (isDragging) {
        setPos((prev) => {
          const snapped = snapToEdges(prev.x, prev.y, size.w, size.h);
          saveState(snapped, size);
          return snapped;
        });
      }
      if (isResizing) saveState(pos, size);
      setIsDragging(false);
      setIsResizing(false);
      resizeDir.current = null;
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, isResizing, size.w, size.h, pos.x, pos.y]);

  // ─── Drag handlers ───────────────────────────────────

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handleTitleTouchStart = (e: React.TouchEvent) => {
    if (isMaximized) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragOffset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y };
  };

  const handleTitleDoubleClick = () => {
    setIsMaximized((prev) => !prev);
  };

  // ─── Resize handlers ─────────────────────────────────

  const handleResizeMouseDown = (e: React.MouseEvent, dir: ResizeDir) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeDir.current = dir;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h, px: pos.x, py: pos.y };
  };

  // ─── Tutorial progression ────────────────────────────

  const advanceTutorial = useCallback(
    (cmd: string) => {
      if (!showTutorial) return;
      const currentStep = TUTORIAL_STEPS[tutorialStep];
      if (currentStep && cmd.trim() === currentStep.command) {
        const nextStep = tutorialStep + 1;
        setTutorialStep(nextStep);
        if (nextStep < TUTORIAL_STEPS.length) {
          setTimeout(() => {
            const next = TUTORIAL_STEPS[nextStep];
            setLines((prev) => [
              ...prev,
              { type: "hint", text: "" },
              { type: "hint", text: `✅ ${nextStep + 1}/3: ${next.description}` },
              { type: "hint", text: `► Try: ${next.command}` },
              { type: "output", text: "" },
            ]);
          }, 800);
        } else {
          setTimeout(() => {
            setLines((prev) => [
              ...prev,
              { type: "hint", text: "" },
              { type: "hint", text: "🎉 Tutorial complete!" },
              { type: "hint", text: "Type 'help' for all commands." },
              { type: "output", text: "" },
            ]);
            setShowTutorial(false);
            localStorage.setItem("summitos-tutorial-v2", "completed");
          }, 800);
        }
      }
    },
    [showTutorial, tutorialStep]
  );

  // ─── Execute command ─────────────────────────────────

  const buildOutput = (trimmed: string): TerminalLine[] | "clear" => {
    if (NAV_COMMANDS.includes(trimmed)) {
      const el = document.getElementById(trimmed);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return [{ type: "system", text: `Navigating to ${trimmed}/...` }];
      }
      return [];
    }

    if (trimmed === "clear") return "clear";

    const parts = trimmed.split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    const multiWordCommands = ["docker ps", "cat resume", "git status", "cat journal"];
    for (const mc of multiWordCommands) {
      if (trimmed.startsWith(mc)) {
        const h = COMMANDS[mc];
        return h ? h(args) : [];
      }
    }

    if (command === "cd") {
      const result = COMMANDS.cd(args);
      if (NAV_COMMANDS.includes(args[0])) {
        const el = document.getElementById(args[0]);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return result;
    }

    const handler = COMMANDS[command];
    if (handler) {
      return handler(args);
    }

    recordFall();
    mountainRef.current?.triggerReaction("fall", { command });
    const quote = RESPAWN_QUOTES[fallCount % RESPAWN_QUOTES.length];
    return [
      { type: "error", text: `💀 Unknown command: ${command}` },
      { type: "system", text: "Madeline fell. Respawning at last checkpoint..." },
      { type: "output", text: `Falls this session: ${fallCount + 1}` },
      { type: "output", text: "" },
      { type: "system", text: `"${quote}"` },
    ];
  };

  // ─── Plant Flag / Summit Progress ──────────────────────

  const plantFlag = useCallback(() => {
    setSummitReached();
    return true;
  }, [setSummitReached]);

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      setHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);
      setCommandCount((c) => c + 1);
      recordCommand(trimmed);
      advanceTutorial(trimmed);

      if (trimmed === "clear") {
        setLines([]);
        mountainRef.current?.triggerReaction("clear");
        return;
      }

      setLines((prev) => [...prev, { type: "input", text: `summit@infrastructure:~$ ${trimmed}` }]);
      setIsProcessing(true);

      const delay = 80 + Math.floor(Math.random() * 70); // 80-150ms

      setTimeout(() => {
        setIsProcessing(false);

        const playResultSound = (ok: boolean) => {
          if (ok) soundEngine.success();
          else soundEngine.error();
        };

        // Checkpoints progress command
        if (trimmed === "checkpoints") {
          const progress = checkpointProgress(checkpoints);
          const established = ZONE_CHECKPOINT_ORDER.filter((z) => checkpoints.has(z)).map((z) => ZONE_LABELS[z]).join(", ");
          const missing = progress.missing.map((z) => ZONE_LABELS[z]).join(", ");
          playResultSound(true);
          setLines((prev) => [
            ...prev,
            { type: "system", text: `Checkpoints: ${checkpoints.size}/6 established` },
            ...(established ? [{ type: "output" as const, text: `Established: ${established}` }] : []),
            ...(missing ? [{ type: "output" as const, text: `Missing: ${missing}` }] : []),
            { type: "hint", text: progress.ready ? "Ready to plant the flag at the summit." : "Spend a few seconds in each zone to establish checkpoints." },
          ]);
          return;
        }

        // Summit / plant-flag commands require all checkpoints.
        const isSummitCommand = ["contact", "cd contact", "plant-flag", "summit"].includes(trimmed);
        if (isSummitCommand) {
          const planted = plantFlag();
          if (!planted) return;
        }

        const result = buildOutput(trimmed);
        if (result === "clear") {
          soundEngine.success();
          return;
        }
        const output = result as TerminalLine[];
        const isError = output.some((line) => line.type === "error");
        playResultSound(!isError);

        // Trigger mountain reactions for supported commands
        if (trimmed === "whoami") mountainRef.current?.triggerReaction("whoami");
        else if (trimmed === "docker ps")
          mountainRef.current?.triggerReaction("docker-ps");
        else if (trimmed === "uptime")
          mountainRef.current?.triggerReaction("uptime");
        else if (trimmed === "mountain")
          mountainRef.current?.triggerReaction("mountain");
        else if (trimmed === "strawberry") {
          mountainRef.current?.triggerReaction("strawberry");
          soundEngine.golden();
        }
        else if (NAV_COMMANDS.includes(trimmed))
          mountainRef.current?.triggerReaction(`nav-${trimmed}`);
        else if (trimmed.startsWith("cd ")) {
          const target = trimmed.slice(3).trim();
          if (NAV_COMMANDS.includes(target))
            mountainRef.current?.triggerReaction(`nav-${target}`);
        }

        const summary = getSummary(trimmed, mode);
        const summaryLine: TerminalLine | null =
          summary && (mode === "tourist" || NAV_COMMANDS.includes(trimmed))
            ? { type: "hint", text: `💡 ${summary}` }
            : null;

        setLines((prev) => [...prev, ...output, ...(summaryLine ? [summaryLine] : [])]);
      }, delay);
    },
    [advanceTutorial, recordCommand, buildOutput, mode, mountainRef, plantFlag, checkpoints]
  );

  // ─── Key handler ─────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      soundEngine.key();
    }
    if (e.key === "Enter") {
      soundEngine.enter();
      executeCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistoryIndex((p) => {
        const ni = Math.min(p + 1, history.length - 1);
        if (ni >= 0) setInput(history[history.length - 1 - ni]);
        return ni;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistoryIndex((p) => {
        const ni = Math.max(p - 1, -1);
        if (ni >= 0) setInput(history[history.length - 1 - ni]);
        else setInput("");
        return ni;
      });
    } else if (e.key === "Tab") {
      e.preventDefault();
      const all = [
        ...Object.keys(COMMANDS),
        ...NAV_COMMANDS,
        "clear",
        "docker ps",
        "cat resume",
        "git status",
        "resume",
        "cat journal",
        "journal",
        "plant-flag",
        "summit",
        "checkpoints",
        "status",
        "scan about",
        "scan skills",
        "scan projects",
        "scan gallery",
        "scan contact",
        "scan",
      ];
      const match = all.find((c) => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  // ─── Copy line ───────────────────────────────────────

  const copyLine = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1200);
    } catch { /* noop */ }
  };

  // ─── Render line ─────────────────────────────────────

  const focusInput = () => inputRef.current?.focus();

  const renderLine = (line: TerminalLine, i: number) => {
    const colors: Record<string, string> = {
      input: "#4ecdc4",
      output: "#d0d5dd",
      system: "#d4a843",
      error: "#e85555",
      ascii: "#8ab4c7",
      hint: "#4ec9b0",
    };

    if (line.type === "actions") {
      return (
        <div key={i} className="flex flex-wrap gap-2" style={{ padding: "4px 0" }}>
          {line.actions?.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                padding: "4px 10px",
                background: "rgba(78, 205, 196, 0.12)",
                border: "1px solid rgba(78, 205, 196, 0.25)",
                borderRadius: "4px",
                color: "#4ecdc4",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.04em",
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      );
    }

    return (
      <div
        key={i}
        className="group relative"
        style={{
          color: colors[line.type] || "#d0d5dd",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          paddingRight: "20px",
        }}
      >
        {line.text}
        <button
          onClick={() => copyLine(line.text, i)}
          className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "rgba(78,205,196,0.5)" }}
          title="Copy"
        >
          {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    );
  };

  // ─── Resize handle positions ─────────────────────────

  const edgeClass = "absolute hover:bg-mountain-cyan/10 transition-colors";
  const cornerClass = "absolute z-10";
  const edgeSize = 6;
  const cornerSize = 12;

  const resizeHandles = !isMaximized ? (
    <>
      {/* Edges */}
      <div className={edgeClass} style={{ top: 0, left: cornerSize, right: cornerSize, height: edgeSize, cursor: "ns-resize" }} onMouseDown={(e) => handleResizeMouseDown(e, "n")} />
      <div className={edgeClass} style={{ bottom: 0, left: cornerSize, right: cornerSize, height: edgeSize, cursor: "ns-resize" }} onMouseDown={(e) => handleResizeMouseDown(e, "s")} />
      <div className={edgeClass} style={{ left: 0, top: cornerSize, bottom: cornerSize, width: edgeSize, cursor: "ew-resize" }} onMouseDown={(e) => handleResizeMouseDown(e, "w")} />
      <div className={edgeClass} style={{ right: 0, top: cornerSize, bottom: cornerSize, width: edgeSize, cursor: "ew-resize" }} onMouseDown={(e) => handleResizeMouseDown(e, "e")} />
      {/* Corners */}
      <div className={cornerClass} style={{ top: 0, left: 0, width: cornerSize, height: cornerSize, cursor: "nwse-resize" }} onMouseDown={(e) => handleResizeMouseDown(e, "nw")} />
      <div className={cornerClass} style={{ top: 0, right: 0, width: cornerSize, height: cornerSize, cursor: "nesw-resize" }} onMouseDown={(e) => handleResizeMouseDown(e, "ne")} />
      <div className={cornerClass} style={{ bottom: 0, left: 0, width: cornerSize, height: cornerSize, cursor: "nesw-resize" }} onMouseDown={(e) => handleResizeMouseDown(e, "sw")} />
      <div className={cornerClass} style={{ bottom: 0, right: 0, width: cornerSize, height: cornerSize, cursor: "nwse-resize" }} onMouseDown={(e) => handleResizeMouseDown(e, "se")} />
    </>
  ) : null;

  // ─── Minimized badge ─────────────────────────────────

  if (!isOpen) {
    return (
      <button
        onClick={openTerminal}
        className="fixed z-[60] cursor-pointer transition-all duration-300 hover:scale-105"
        style={{
          bottom: "48px",
          right: "12px",
          padding: "12px 20px",
          background: "rgba(10, 14, 26, 0.95)",
          border: "1px solid rgba(78, 205, 196, 0.3)",
          color: "#4ecdc4",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        🏔️ SummitOS Terminal
      </button>
    );
  }

  // ─── Main terminal window ────────────────────────────

  return (
    <div
      ref={terminalRef}
      data-terminal-root
      className={`fixed z-50 flex flex-col ${isClosing ? "crt-power-off" : ""}`}
      style={{
        left: isMaximized ? 0 : pos.x,
        top: isMaximized ? 0 : pos.y,
        width: isMaximized ? "100dvw" : size.w,
        height: isMaximized ? "100dvh" : size.h,
        pointerEvents: isClosing ? "none" : "auto",
        background: "rgba(6, 10, 20, 0.78)",
        backgroundImage: "radial-gradient(ellipse at center, rgba(127,181,201,0.04) 0%, transparent 70%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: isMaximized
          ? "none"
          : isDragging || isResizing
            ? "1px solid rgba(78, 205, 196, 0.45)"
            : "1px solid rgba(78, 205, 196, 0.18)",
        boxShadow: isMaximized
          ? "none"
          : isDragging || isResizing
            ? "0 0 60px rgba(0,0,0,0.7), 0 0 100px rgba(78,205,196,0.12), inset 0 0 0 1px rgba(127,181,201,0.06)"
            : "0 0 40px rgba(0,0,0,0.6), 0 0 80px rgba(78,205,196,0.07), inset 0 0 0 1px rgba(127,181,201,0.06)",
        cursor: isDragging ? "grabbing" : "default",
        transition: isDragging || isResizing || isMaximized || isClosing
          ? "none"
          : "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease, box-shadow 300ms ease, border-color 300ms ease",
        transform: isVisible ? "scale(1) translateY(0)" : "scale(0.96) translateY(12px)",
        opacity: isVisible ? 1 : 0,
      }}
      onWheel={(e) => {
        if (isMaximized) e.stopPropagation();
      }}
      onTouchMove={(e) => {
        if (isMaximized) e.stopPropagation();
      }}
    >
      {/* Resize handles */}
      {resizeHandles}

      {/* Inner border accent */}
      <div className="absolute inset-0 pointer-events-none" style={{ border: "1px solid rgba(127, 181, 201, 0.04)", zIndex: 0 }} />

      {/* CRT power-off glow overlay */}
      {isClosing && (
        <div
          className="absolute inset-0 pointer-events-none crt-power-off-overlay"
          style={{ zIndex: 100 }}
        />
      )}

      {/* Title Bar */}
      <div
        onMouseDown={handleTitleMouseDown}
        onTouchStart={handleTitleTouchStart}
        onDoubleClick={handleTitleDoubleClick}
        className="relative flex items-center justify-between select-none shrink-0"
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid rgba(78, 205, 196, 0.12)",
          background: "rgba(78, 205, 196, 0.05)",
          cursor: isMaximized ? "default" : "grab",
          zIndex: 1,
        }}
      >
        <div className="flex items-center gap-2">
          {/* Window controls — stop drag */}
          <div
            className="flex gap-1.5 mr-2"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeTerminal}
              className="w-3 h-3 rounded-full border-none cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: "#e85555" }}
              title="Close"
            />
            <button
              onClick={() => setIsMaximized((p) => !p)}
              className="w-3 h-3 rounded-full border-none cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: "#d4a843" }}
              title={isMaximized ? "Restore" : "Maximize"}
            />
            <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: "#4ecdc4" }} title="Active">
              <span
                className="block rounded-full"
                style={{ width: "4px", height: "4px", background: "#0a0e1a", animation: "pulse 2s ease-in-out infinite" }}
              />
            </div>
          </div>

          {!isMaximized && (
            <div className="flex items-center justify-center" style={{ color: "rgba(78,205,196,0.25)", cursor: "grab" }} title="Drag to move">
              <GripVertical size={14} />
            </div>
          )}

          <Terminal size={14} style={{ color: "#4ecdc4", opacity: 0.8 }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#4ecdc4",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            SummitOS
          </span>
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "rgba(78,205,196,0.35)",
              letterSpacing: "0.08em",
              marginLeft: "4px",
            }}
          >
            {isMaximized ? "— maximized" : `— ${Math.round(pos.x)},${Math.round(pos.y)}`}
          </span>
        </div>

        {/* Right actions — stop drag */}
        <div
          className="flex items-center gap-3"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const next = mode === "tourist" ? "expert" : "tourist";
              setMode(next);
              if (typeof window !== "undefined") {
                localStorage.setItem(MODE_KEY, next);
              }
            }}
            className="bg-transparent border-none cursor-pointer hover:opacity-100 transition-opacity"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: mode === "tourist" ? "#d4a843" : "#4ecdc4",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
            title={`Switch to ${mode === "tourist" ? "Expert" : "Tourist"} mode`}
          >
            {mode === "tourist" ? "Tourist" : "Expert"}
          </button>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "rgba(78,205,196,0.35)",
              letterSpacing: "0.06em",
            }}
          >
            {currentTime}
          </span>
          <button
            onClick={focusInput}
            className="hidden sm:inline bg-transparent border-none cursor-pointer hover:opacity-100 transition-opacity"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "rgba(78,205,196,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Focus
          </button>
        </div>
      </div>

      {/* Persistent status line */}
      <div
        className="shrink-0 select-none"
        style={{
          padding: "6px 14px",
          borderBottom: "1px solid rgba(78, 205, 196, 0.08)",
          background: "rgba(78, 205, 196, 0.03)",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "rgba(78, 205, 196, 0.55)",
            letterSpacing: "0.04em",
          }}
        >
          [{currentZone ? ZONE_LABELS[currentZone] : "—"}] {altitude.toLocaleString()}m · {checkpoints.size}/6 checkpoints
        </span>
      </div>

      {/* Output Area — single scrollable container */}
      <div
        ref={outputRef}
        className="flex-1 min-h-0 overflow-y-auto terminal-scroll"
        style={{ padding: "12px 14px", zIndex: 1 }}
        onClick={focusInput}
      >
        {lines.map((line, i) => renderLine(line, i))}
      </div>

      {/* Tourist command chips */}
      {mode === "tourist" && (
        <div
          className="shrink-0"
          style={{
            padding: "10px 14px",
            borderTop: "1px solid rgba(78, 205, 196, 0.08)",
            background: "rgba(78, 205, 196, 0.03)",
            zIndex: 1,
          }}
        >
          <div className="flex flex-wrap gap-2">
            {COMMAND_CHIPS.map((chip) => (
              <button
                key={chip.command}
                onClick={() => executeCommand(chip.command)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    executeCommand(chip.command);
                  }
                }}
                className="cursor-pointer hover:opacity-90 transition-opacity focus-ring"
                style={{
                  padding: "8px 14px",
                  background: "rgba(78, 205, 196, 0.1)",
                  border: "1px solid rgba(78, 205, 196, 0.22)",
                  borderRadius: "4px",
                  color: "#4ecdc4",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                }}
              >
                {chip.label}
              </button>
            ))}
            {currentZone === "contact" && !summitReached && (
              <button
                onClick={() => executeCommand("plant-flag")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    executeCommand("plant-flag");
                  }
                }}
                className="cursor-pointer hover:opacity-90 transition-opacity focus-ring"
                style={{
                  padding: "8px 14px",
                  background: "rgba(212, 168, 67, 0.15)",
                  border: "1px solid rgba(212, 168, 67, 0.4)",
                  borderRadius: "4px",
                  color: "#d4a843",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                }}
              >
                🚩 Plant Flag
              </button>
            )}
          </div>
          <div
            style={{
              marginTop: "6px",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "rgba(78,205,196,0.35)",
              letterSpacing: "0.04em",
            }}
          >
            Switch to Expert mode for the full CLI.
          </div>
        </div>
      )}

      {/* Input Line */}
      {mode === "expert" && (
        <div
          className="flex items-center shrink-0 relative"
          style={{
            padding: "10px 14px",
            borderTop: "1px solid rgba(78, 205, 196, 0.08)",
            background: "rgba(0,0,0,0.18)",
            zIndex: 1,
          }}
          onClick={focusInput}
        >
          <span
            className="text-base sm:text-xs"
            style={{
              fontFamily: "var(--font-mono)",
              color: "#4ecdc4",
              whiteSpace: "nowrap",
              marginRight: "6px",
              opacity: 0.85,
            }}
          >
            summit@infrastructure:~$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            readOnly={isProcessing}
            className="flex-1 bg-transparent border-none outline-none text-base sm:text-xs"
            style={{
              fontFamily: "var(--font-mono)",
              color: "#e8ecf1",
              caretColor: "#e85555",
              minWidth: 0,
            }}
          />
          {isProcessing && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "#d4a843",
                marginLeft: "8px",
                animation: "pulse 1s ease-in-out infinite",
              }}
            >
              ...
            </span>
          )}
        </div>
      )}

      {/* Status Bar */}
      {!isMaximized && (
        <div
          className="flex items-center justify-between shrink-0 select-none"
          style={{
            padding: "4px 14px",
            borderTop: "1px solid rgba(78, 205, 196, 0.06)",
            background: "rgba(78, 205, 196, 0.03)",
            zIndex: 1,
          }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "rgba(78,205,196,0.4)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span className="inline-block rounded-full" style={{ width: "5px", height: "5px", background: "#4ec9b0" }} />
              CPU 12%
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "rgba(78,205,196,0.4)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              MEM 4.2G
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "rgba(78,205,196,0.4)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              NET ▲ 1.2 ▼ 4.8
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "rgba(78,205,196,0.3)",
                letterSpacing: "0.06em",
              }}
            >
              {commandCount} CMD{commandCount !== 1 ? "S" : ""}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "rgba(78,205,196,0.3)",
                letterSpacing: "0.06em",
              }}
            >
              {fallCount} FALL{fallCount !== 1 ? "S" : ""}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "rgba(78,205,196,0.25)",
                letterSpacing: "0.06em",
              }}
            >
              {Math.round(size.w)}×{Math.round(size.h)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
