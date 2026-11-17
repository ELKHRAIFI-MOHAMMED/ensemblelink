"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { plage, TYPES_ANNONCE } from "@/lib/format";
import type { Annonce } from "@/lib/types";

function icone(emoji: string, couleur: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${couleur};width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;border:3px solid #fff;box-shadow:0 6px 14px -4px rgba(0,0,0,.35)"><span style="transform:rotate(45deg);font-size:17px">${emoji}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -34],
  });
}

function Cadrage({ points }: { points: [number, number][] }) {
  const map = useMap();
  const cle = JSON.stringify(points);
  useEffect(() => {
    const pts = JSON.parse(cle) as [number, number][];
    if (pts.length === 1) map.setView(pts[0], 12);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
  }, [map, cle]);
  return null;
}

/** Carte des missions géolocalisées (chargée uniquement côté navigateur). */
export default function CarteMissions({ annonces, hauteur = 520 }: { annonces: Annonce[]; hauteur?: number }) {
  const geo = annonces.filter((a) => a.latitude && a.longitude);
  const points = geo.map((a) => [Number(a.latitude), Number(a.longitude)] as [number, number]);

  return (
    <div className="carte overflow-hidden p-1.5">
      <MapContainer center={[46.6, 2.4]} zoom={6} scrollWheelZoom style={{ height: hauteur, width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Cadrage points={points} />
        {geo.map((a) => (
          <Marker
            key={a.id}
            position={[Number(a.latitude), Number(a.longitude)]}
            icon={icone(a.categorie_detail?.icone ?? TYPES_ANNONCE[a.type].emoji, a.categorie_detail?.couleur ?? "#F26B3A")}
          >
            <Popup>
              <div className="min-w-48">
                <p className="text-xs text-gray-500">{a.association.nom}</p>
                <p className="font-bold">{a.titre}</p>
                <p className="my-1 text-xs">{plage(a.date_debut, a.date_fin)}</p>
                <Link href={`/missions/${a.id}`} className="font-semibold text-[#d9531f]">
                  Voir la mission →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
