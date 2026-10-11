"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Activity } from "@/lib/types";
import { categoryOf } from "@/lib/categories";
import { activityEmoji, escapeHtml } from "@/lib/format";
import { CAMPUS_CENTER, CAMPUS_LOCATIONS } from "@/lib/locations";

function pinIcon(a: Activity, selected: boolean) {
  const c = categoryOf(a.category);
  const live = a.live_status === "live";
  const full = a.spots_remaining <= 0;
  const html = `
    <div style="position:relative;width:max-content;transform:translate(-50%,-100%);filter:${full ? "grayscale(0.7)" : "none"}">
      <div style="display:flex;align-items:center;gap:4px;background:${c.color};border:2.5px solid #2b2118;border-radius:999px;padding:3px 9px 3px 6px;box-shadow:2px 2px 0 #2b2118;font-weight:800;font-size:12px;color:#2b2118;white-space:nowrap;${selected ? "transform:scale(1.18);" : ""}">
        <span style="font-size:16px">${escapeHtml(activityEmoji(a))}</span>
        <span>${a.participant_count}/${a.max_participants}</span>
        ${live ? '<span style="width:9px;height:9px;border-radius:50%;background:#ef4444;border:1.5px solid #2b2118"></span>' : ""}
      </div>
      <div style="width:0;height:0;margin:0 auto;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #2b2118"></div>
    </div>`;
  return L.divIcon({ html, className: "pin-wrap", iconSize: [0, 0], iconAnchor: [0, 0] });
}

function landmarkIcon(name: string) {
  return L.divIcon({
    html: `<div style="width:max-content;transform:translate(-50%,-50%);font:800 11px var(--font-nunito),sans-serif;color:#2b2118;background:rgba(255,255,255,.85);border:1.5px solid #2b2118;border-radius:8px;padding:1px 6px;white-space:nowrap">${name.replace(/\s*\(.*\)/, "")}</div>`,
    className: "pin-wrap",
    iconSize: [0, 0],
  });
}

function Resize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

/**
 * Place pins in SCREEN pixels so none overlap, however many activities share a spot or sit close
 * together. Each pin starts at its real location and takes the nearest free slot (preferring
 * upward), so the map stays readable and every pin stays tappable at any zoom.
 */
const PIN_W = 88;
const PIN_H = 36;
const SLOTS = (() => {
  const out: [number, number][] = [];
  for (let dx = -3; dx <= 3; dx++) for (let dy = -4; dy <= 3; dy++) out.push([dx * PIN_W, dy * PIN_H - 6]);
  // nearest first; on ties prefer going up (negative y)
  return out.sort((a, b) => Math.hypot(a[0], a[1] + 6) - Math.hypot(b[0], b[1] + 6) || a[1] - b[1]);
})();

function spread(map: L.Map, activities: Activity[]) {
  type Rect = { x: number; y: number };
  const placed: Rect[] = [];
  const free = (x: number, y: number) => placed.every((r) => Math.abs(r.x - x) >= PIN_W - 6 || Math.abs(r.y - y) >= PIN_H - 4);
  const anchors = activities
    .map((a) => ({ a, pt: map.latLngToLayerPoint([a.lat, a.lng]) }))
    .sort((p, q) => p.pt.y - q.pt.y || p.pt.x - q.pt.x || p.a.id.localeCompare(q.a.id)); // stable order
  return anchors.map(({ a, pt }) => {
    const slot = SLOTS.find(([dx, dy]) => free(pt.x + dx, pt.y + dy)) ?? [0, 0];
    const x = pt.x + slot[0];
    const y = pt.y + slot[1];
    placed.push({ x, y });
    const ll = map.layerPointToLatLng(L.point(x, y));
    return { a, pos: [ll.lat, ll.lng] as [number, number] };
  });
}

function Pins({ activities, selectedId, onSelect }: { activities: Activity[]; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const map = useMap();
  const [, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  return (
    <>
      {spread(map, activities).map(({ a, pos }) => (
        <Marker
          key={a.id}
          position={pos}
          icon={pinIcon(a, a.id === selectedId)}
          zIndexOffset={a.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(a.id) }}
          title={`${a.title} — ${a.participant_count}/${a.max_participants}`}
        />
      ))}
    </>
  );
}

export default function CampusMapInner({
  activities,
  selectedId,
  onSelect,
  interactive = true,
}: {
  activities: Activity[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  interactive?: boolean;
}) {
  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={15}
      minZoom={13}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <Resize />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {CAMPUS_LOCATIONS.map((l) => (
        <Marker key={l.key} position={[l.lat, l.lng]} icon={landmarkIcon(l.name)} interactive={false} keyboard={false} />
      ))}
      <Pins activities={activities} selectedId={selectedId} onSelect={onSelect} />
    </MapContainer>
  );
}
