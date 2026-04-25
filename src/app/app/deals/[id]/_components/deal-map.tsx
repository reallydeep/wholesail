"use client";

import * as React from "react";

interface Geo {
  lat: number;
  lon: number;
}

const W = 560;
const H = 360;
const ZOOM = 15;

function tileUrl(lat: number, lon: number): string {
  // Free static OSM service; one marker, fixed zoom.
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${ZOOM}&size=${W}x${H}&maptype=mapnik&markers=${lat},${lon},red-pushpin`;
}

export function DealMap({
  dealId,
  initial,
}: {
  dealId: string;
  initial?: Geo;
}) {
  const [geo, setGeo] = React.useState<Geo | null>(initial ?? null);
  const [tried, setTried] = React.useState(!!initial);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (geo || tried) return;
    setTried(true);
    let cancelled = false;
    fetch(`/api/deals/${dealId}/geocode`, { method: "POST" })
      .then(async (r) => {
        if (!r.ok) {
          if (!cancelled) setFailed(true);
          return;
        }
        const j = (await r.json()) as Geo;
        if (!cancelled) setGeo(j);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [dealId, geo, tried]);

  if (failed || (!geo && tried)) return null;
  if (!geo) {
    return (
      <div className="w-[280px] h-[180px] rounded-[10px] border border-rule bg-parchment animate-pulse" />
    );
  }
  const gmapsHref = `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lon}`;
  return (
    <figure className="w-[280px] space-y-1.5">
      <a
        href={gmapsHref}
        target="_blank"
        rel="noreferrer"
        className="block rounded-[10px] border border-rule overflow-hidden bg-parchment grayscale hover:grayscale-0 transition-[filter] duration-300"
      >
        <img
          src={tileUrl(geo.lat, geo.lon)}
          alt="Map"
          width={W}
          height={H}
          className="block w-[280px] h-[180px] object-cover"
          loading="lazy"
        />
      </a>
      <a
        href={gmapsHref}
        target="_blank"
        rel="noreferrer"
        className="text-[11px] uppercase tracking-[0.14em] text-ink-faint hover:text-ink transition-colors"
      >
        Open in Google Maps →
      </a>
    </figure>
  );
}
