export function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(amount)}\u00a0сум`;
}

export function formatDuration(minutes: number): string {
  return `${minutes}\u00a0мин`;
}

export function mapEmbedUrl(lat: number, lng: number): string {
  const pad = 0.012;
  const bbox = [lng - pad, lat - pad, lng + pad, lat + pad].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function mapLinkUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}
