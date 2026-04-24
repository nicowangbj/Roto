import Image from "next/image";

type RotoAvatarProps = {
  size?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl";
  scene?: "default" | "hero" | "signin" | "welcome";
  className?: string;
};

const sizeMap = {
  xxs: { width: 32, height: 32 },
  xs: { width: 92, height: 108 },
  sm: { width: 112, height: 132 },
  md: { width: 168, height: 196 },
  lg: { width: 244, height: 288 },
  xl: { width: 336, height: 392 },
};

const glowMap = {
  default: "bg-[radial-gradient(circle,rgba(255,216,77,0.28)_0%,transparent_68%)]",
  hero:    "bg-[radial-gradient(circle,rgba(255,216,77,0.35)_0%,transparent_70%)]",
  signin:  "bg-[radial-gradient(circle,rgba(71,168,255,0.22)_0%,transparent_68%)]",
  welcome: "bg-[radial-gradient(circle,rgba(255,216,77,0.30)_0%,transparent_70%)]",
};

export default function RotoAvatar({
  size = "md",
  scene = "default",
  className = "",
}: RotoAvatarProps) {
  const dims = sizeMap[size];
  const glow = glowMap[scene];

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: dims.width, height: dims.height }}
      aria-label="Roto mascot avatar"
    >
      <div
        className={`absolute inset-[10%_12%_0] blur-2xl ${glow}`}
        style={{ pointerEvents: "none" }}
      />
      <Image
        src="/roto-ip.png"
        alt="Roto"
        width={dims.width}
        height={dims.height}
        unoptimized
        className="object-contain drop-shadow-[0_16px_32px_rgba(242,186,25,0.18)]"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
