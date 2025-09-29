"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = { lat: number; lng: number };

// Komponen kecil untuk menangani klik peta via hook (TIDAK di-dynamic import)
function ClickHandler({ onPick }: { onPick: (pos: LatLng) => void }) {
    useMapEvents({
        click(e) {
            onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function MapPickerModal({
    initial,
    onCancel,
    onSelect,
}: {
    initial?: LatLng | null;
    onCancel: () => void;
    onSelect: (pos: LatLng) => void;
}) {
    const [pos, setPos] = useState<LatLng>(
        initial ?? { lat: -6.200000, lng: 106.816000 } // Jakarta default
    );

    // Perbaiki ikon Leaflet di Next
    useEffect(() => {
        (async () => {
            const L = await import("leaflet");
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                // @ts-ignore
                iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
                // @ts-ignore
                iconUrl: require("leaflet/dist/images/marker-icon.png"),
                // @ts-ignore
                shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
            });
        })();
    }, []);

    const center = useMemo(() => pos, [pos]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative z-10 w-[min(96vw,880px)] rounded-2xl bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Pilih Lokasi di Peta</h3>
                    <button
                        onClick={onCancel}
                        className="rounded-lg border border-black/10 px-3 py-1 hover:bg-gray-50"
                    >
                        Tutup
                    </button>
                </div>

                <div className="h-[56vh] w-full overflow-hidden rounded-xl border border-black/10">
                    {/* File ini client-only; aman render langsung */}
                    <MapContainer center={center as any} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ClickHandler onPick={(p) => setPos(p)} />
                        <Marker position={pos as any} />
                    </MapContainer>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-gray-700">
                        Lat: <b>{pos.lat.toFixed(6)}</b> | Lng: <b>{pos.lng.toFixed(6)}</b>
                    </div>
                    <div className="flex gap-2">
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`}
                            target="_blank"
                            rel="noopener"
                            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm hover:bg-gray-50"
                        >
                            Lihat di Google Maps
                        </a>
                        <button
                            onClick={() => onSelect(pos)}
                            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                        >
                            Gunakan Titik Ini
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
