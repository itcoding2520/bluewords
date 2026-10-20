import { getUserAvatarUrl } from "@/lib/supabase/user-profile";

const avatarColors = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-indigo-600",
  "bg-teal-600",
];

function getInitial(value: string): string {
  return Array.from(value.trim())[0]?.toLocaleUpperCase() ?? "U";
}

function getColorIndex(value: string): number {
  return Array.from(value).reduce((total, character) => total + character.codePointAt(0)!, 0) % avatarColors.length;
}

interface UserAvatarProps {
  nickname?: string | null;
  email?: string | null;
  avatarPath?: string | null;
  fallbackName?: string | null;
  sizeClassName?: string;
}

export function UserAvatar({
  nickname,
  email,
  avatarPath,
  fallbackName,
  sizeClassName = "size-10",
}: UserAvatarProps) {
  const label = nickname?.trim() || email?.trim() || fallbackName?.trim() || "User";
  const imageUrl = getUserAvatarUrl(avatarPath);

  return (
    <span
      role="img"
      aria-label={`${label} avatar`}
      className={`grid ${sizeClassName} shrink-0 place-items-center overflow-hidden rounded-full ${avatarColors[getColorIndex(label)]} bg-cover bg-center text-sm font-semibold text-white`}
      style={imageUrl ? { backgroundImage: `url(${JSON.stringify(imageUrl)})` } : undefined}
    >
      {!imageUrl && getInitial(label)}
    </span>
  );
}
