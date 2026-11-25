import type { SafeUser } from "@/lib/types";

export type AvatarUser = Pick<SafeUser, "id" | "name" | "photo">;

export function avatarUrl(user: AvatarUser): string | undefined {
  return user.photo ? `/api/perfiles/${user.id}/${user.photo}` : undefined;
}

export default function UserAvatar({ user }: { user: AvatarUser }) {
  const url = avatarUrl(user);
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join("").toLocaleUpperCase("es");
  return (
    <span className="user-avatar" aria-hidden="true">
      {url ? <img src={url} alt="" width={32} height={32} /> : initials}
    </span>
  );
}
