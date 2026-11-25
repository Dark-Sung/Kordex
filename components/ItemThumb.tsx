import { photoUrl } from "@/lib/photos";

// Miniatura del item: muestra la foto si existe, o la inicial del nombre si no
export default function ItemThumb({
  companyId,
  photo,
  name,
  size = 40,
}: {
  companyId: string;
  photo?: string;
  name: string;
  size?: number;
}) {
  const url = photoUrl(companyId, photo);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className="thumb" style={{ width: size, height: size }} loading="lazy" />
  ) : (
    <span className="thumb empty-thumb" style={{ width: size, height: size }} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
