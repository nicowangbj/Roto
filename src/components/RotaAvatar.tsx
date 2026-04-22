import Image from "next/image";

type RotaAvatarProps = {
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

const sceneMap = {
  default: {
    frame:
      "rounded-[28px] bg-gradient-to-b from-white/92 via-white/68 to-brand-sky-soft/55 border border-white/75 shadow-[0_24px_48px_rgba(31,41,55,0.08)]",
    glow: "bg-[radial-gradient(circle,rgba(255,216,77,0.22)_0%,transparent_70%)]",
    ring: "bg-brand-sky-soft/65",
    image: "object-contain p-2",
  },
  hero: {
    frame:
      "rounded-[36px] bg-gradient-to-b from-white/95 via-white/70 to-brand-sky-soft/60 border border-white/80 shadow-[0_36px_64px_rgba(31,41,55,0.1)]",
    glow: "bg-[radial-gradient(circle,rgba(255,216,77,0.28)_0%,transparent_72%)]",
    ring: "bg-white/72",
    image: "object-contain p-3",
  },
  signin: {
    frame:
      "rounded-[30px] bg-gradient-to-br from-white/94 via-brand-cloud/38 to-brand-sky-soft/58 border border-white/70 shadow-[0_24px_52px_rgba(31,41,55,0.08)]",
    glow: "bg-[radial-gradient(circle,rgba(71,168,255,0.16)_0%,transparent_72%)]",
    ring: "bg-brand-cloud/55",
    image: "object-contain p-2",
  },
  welcome: {
    frame:
      "rounded-[34px] bg-gradient-to-b from-white/94 via-brand-cloud/42 to-brand-sky-soft/62 border border-white/78 shadow-[0_30px_56px_rgba(31,41,55,0.1)]",
    glow: "bg-[radial-gradient(circle,rgba(255,216,77,0.24)_0%,transparent_72%)]",
    ring: "bg-white/68",
    image: "object-contain p-2",
  },
};

export default function RotaAvatar({
  size = "md",
  scene = "default",
  className = "",
}: RotaAvatarProps) {
  const dims = sizeMap[size];
  const palette = sceneMap[scene];

  return (
    <div
      className={`relative ${className}`}
      style={{ width: dims.width, height: dims.height }}
      aria-label="Rota mascot avatar"
    >
      <div className={`absolute inset-[12%_14%_0] blur-2xl ${palette.glow}`} />
      <div className={`absolute inset-0 overflow-hidden ${palette.frame}`}>
        <div
          className={`absolute inset-[14%_16%_10%] rounded-[999px] blur-md ${palette.ring}`}
        />
      </div>
      <Image
        src="/rota-ip.png"
        alt="Rota IP"
        fill
        unoptimized
        className={`relative h-full w-full ${palette.image} drop-shadow-[0_22px_44px_rgba(242,186,25,0.2)]`}
      />
    </div>
  );
}
