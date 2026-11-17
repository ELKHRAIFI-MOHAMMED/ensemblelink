"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

const icone = L.divIcon({
  className: "",
  html: '<div style="background:#F26B3A;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 6px 14px -4px rgba(0,0,0,.4)"></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function Clic({ onChoix }: { onChoix: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onChoix(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** Cliquez sur la carte pour placer la mission. */
export default function ChoixPosition({ lat, lng, onChoix }: { lat: number | null; lng: number | null; onChoix: (lat: number, lng: number) => void }) {
  return (
    <MapContainer center={lat && lng ? [lat, lng] : [46.6, 2.4]} zoom={lat ? 13 : 5} style={{ height: 260, width: "100%" }}>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Clic onChoix={onChoix} />
      {lat && lng && <Marker position={[lat, lng]} icon={icone} />}
    </MapContainer>
  );
}
