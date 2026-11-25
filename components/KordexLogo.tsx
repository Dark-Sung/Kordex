import Image from "next/image";

export default function KordexLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/kordex-logo.png"
      alt="Kordex"
      width={2172}
      height={724}
      sizes="190px"
      className={className}
      priority={priority}
    />
  );
}
