// src/pages/index.tsx
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// GANTI type Ormas lama dengan ini:
type Ormas = {
    id: number;
    nama: string;
    alamat: string;
    status: string; // "Aktif" | "-"
    lat: number | null;
    lng: number | null;
    surat?: Uint8Array | null;
    surat_filename?: string | null;
    surat_path?: string | null;
    surat_mime?: string | null;
    sk_filename?: string | null;
    sk_path?: string | null;
    sk_mime?: string | null;
    struktur_pengurus_filename?: string | null;
    struktur_pengurus_path?: string | null;
    struktur_pengurus_mime?: string | null;
    lokasi_filename?: string | null;
    lokasi_path?: string | null;
    lokasi_mime?: string | null;
    created_at?: string;
};

// Komponen peta Leaflet sederhana (tanpa react-leaflet)
// GANTI seluruh fungsi LeafletMap lama dengan ini:
// ganti seluruh fungsi LeafletMap
function LeafletMap({
    points,
    selectedId,
}: {
    points: Array<{
        id: number;
        lat: number;
        lng: number;
        label: string;
        status: string;
        alamat?: string;
        created_at?: string;
        surat_filename?: string | null;
        surat_path?: string | null;
        surat_mime?: string | null;
        sk_filename?: string | null;
        sk_path?: string | null;
        sk_mime?: string | null;
        struktur_pengurus_filename?: string | null;
        struktur_pengurus_path?: string | null;
        struktur_pengurus_mime?: string | null;
        lokasi_filename?: string | null;
        lokasi_path?: string | null;
        lokasi_mime?: string | null;
    }>;
    selectedId: number | null;
}) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<any>(null);
    const layerRef = useRef<any>(null);
    const markersRef = useRef<Map<number, any>>(new Map());
    const popupRef = useRef<any>(null);

    // helper: escape html
    const esc = (s: any = "") =>
        String(s).replace(
            /[&<>"']/g,
            (m) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[m] as string)
        );

    const buildPopupHtml = (p: {
        id: number;
        label: string;
        status: string;
        alamat?: string;
        lat: number;
        lng: number;
        created_at?: string;
        surat_filename?: string | null;
        surat_path?: string | null;
        sk_filename?: string | null;
        sk_path?: string | null;
        struktur_pengurus_filename?: string | null;
        struktur_pengurus_path?: string | null;
        lokasi_filename?: string | null;
        lokasi_path?: string | null;
    }) => `
    <div style="min-width:240px">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
        <strong>${esc(p.label)}</strong>
        <span style="border:1px solid #ddd;padding:2px 8px;border-radius:999px;font-size:11px;">
        ${esc(p.status)}
        </span>
    </div>

    ${p.alamat
            ? `<div style="margin-top:4px;font-size:12px;opacity:.85">${esc(p.alamat)}</div>`
            : ""
        }

    <div style="margin-top:6px;font-size:12px;line-height:1.5;">
        Koordinat: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}<br/>
        ${p.created_at ? `Dibuat: ${new Date(p.created_at).toLocaleDateString()}` : ""}
        ${p.surat_filename ? `<br/>Surat: ${esc(p.surat_filename)}` : ""}

        ${p.surat_path
            ? `
            <div style="margin-top:8px;">
                <a
                href="https://rpblbedyqmnzpowbumzd.supabase.co/storage/v1/object/public/ormas_surat/${String(p.surat_path).replace(/^\/+/, '')}"
                target="_blank"
                rel="noopener"
                style="display:inline-block;padding:6px 10px;border-radius:8px;border:1px solid #0a7;background:#16a34a;color:#fff;font-size:12px;text-decoration:none;"
                >
                Surat Keberadaan
                </a>
            </div>
            `
            : ""
        }
        
        ${p.sk_path
            ? `
            <div style="margin-top:8px;">
                <a
                href="https://rpblbedyqmnzpowbumzd.supabase.co/storage/v1/object/public/ormas_surat/${String(p.sk_path).replace(/^\/+/, '')}"
                target="_blank"
                rel="noopener"
                style="display:inline-block;padding:6px 10px;border-radius:8px;border:1px solid #0a7;background:#2563eb;color:#fff;font-size:12px;text-decoration:none;"
                >
                Surat Keterangan (SK)
                </a>
            </div>
            `
            : ""
        }

        ${p.struktur_pengurus_path
            ? `
            <div style="margin-top:8px;">
                <a
                href="https://rpblbedyqmnzpowbumzd.supabase.co/storage/v1/object/public/ormas_surat/${String(p.struktur_pengurus_path).replace(/^\/+/, '')}"
                target="_blank"
                rel="noopener"
                style="display:inline-block;padding:6px 10px;border-radius:8px;border:1px solid #0a7;background:#7c3aed;color:#fff;font-size:12px;text-decoration:none;"
                >
                Struktur Pengurus
                </a>
            </div>
            `
            : ""
        }

        ${p.lokasi_path
            ? `
            <div style="margin-top:8px;">
                <a
                href="https://rpblbedyqmnzpowbumzd.supabase.co/storage/v1/object/public/ormas_surat/${String(p.lokasi_path).replace(/^\/+/, '')}"
                target="_blank"
                rel="noopener"
                style="display:inline-block;padding:6px 10px;border-radius:8px;border:1px solid #0a7;background:#d97706;color:#fff;font-size:12px;text-decoration:none;"
                >
                Lokasi Ormas
                </a>
            </div>
            `
            : ""
        }

        ${(Number.isFinite(p.lat) && Number.isFinite(p.lng))
            ? `
            <div style="margin-top:8px;">
                <a
                href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}"
                target="_blank"
                rel="noopener"
                style="display:inline-block;padding:6px 10px;border-radius:8px;border:1px solid #c00;background:#e53935;color:#fff;font-size:12px;text-decoration:none;"
                >
                Buka di Google Maps
                </a>
            </div>
            `
            : ""
        }
    </div>
    </div>

  `;

    // 1) Init map sekali
    useEffect(() => {
        let L: any;
        (async () => {
            const leaflet = await import("leaflet");
            L = leaflet.default ?? leaflet;

            if (!mapRef.current || mapInstance.current) return;

            const center: [number, number] = [-2.3, 119.35];
            const map = L.map(mapRef.current, { center, zoom: 9, zoomControl: true });
            mapInstance.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors",
                maxZoom: 19,
            }).addTo(map);

            layerRef.current = L.layerGroup().addTo(map);
            popupRef.current = L.popup({
                autoPan: true,
                maxWidth: 320,
                closeButton: true,
            });
        })();

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
            layerRef.current = null;
            markersRef.current.clear();
            popupRef.current = null;
        };
    }, []);

    // 2) Render/refresh markers saat points berubah
    useEffect(() => {
        (async () => {
            if (!mapInstance.current || !layerRef.current) return;
            const L = (await import("leaflet")).default;

            layerRef.current.clearLayers();
            markersRef.current.clear();

            const bounds: any[] = [];

            points.forEach((p) => {
                const html = buildPopupHtml(p);

                const marker = (L as any)
                    .circleMarker([p.lat, p.lng], {
                        radius: 7,
                        weight: 2,
                        color: p.status === "Aktif" ? "#10b981" : "#9ca3af",
                        fillOpacity: 0.6,
                    })
                    .bindPopup(html);

                marker.addTo(layerRef.current);
                markersRef.current.set(p.id, marker);
                bounds.push([p.lat, p.lng]);
            });

            if (bounds.length > 0) {
                mapInstance.current.fitBounds(bounds, { padding: [24, 24] });
            }
        })();
    }, [points]);

    // 3) Saat selectedId berubah: fly + buka popup PASTI
    useEffect(() => {
        if (!mapInstance.current || selectedId == null) return;

        const map = mapInstance.current;
        const marker = markersRef.current.get(selectedId);
        if (!marker) return;

        const latlng = marker.getLatLng();
        const html =
            marker.getPopup()?.getContent?.() ??
            buildPopupHtml(
                // fallback kalau getContent tidak ada
                points.find((x) => x.id === selectedId) as any
            );
        const targetZoom = Math.max(map.getZoom(), 13);

        const openPopup = () => {
            if (popupRef.current) {
                popupRef.current.setLatLng(latlng).setContent(html).openOn(map);
            } else {
                // fallback tetap coba buka popup bawaan marker
                marker.openPopup();
            }
            if (marker.bringToFront) marker.bringToFront();
        };

        const alreadyInView =
            map.getBounds().contains(latlng) &&
            Math.abs(map.getZoom() - targetZoom) < 0.01;

        if (alreadyInView) {
            openPopup();
        } else {
            map.flyTo(latlng, targetZoom, { duration: 0.6 });
            map.once("moveend", openPopup);
        }

        return () => {
            map.off("moveend", openPopup);
        };
    }, [selectedId, points]);

    return (
        <div
            ref={mapRef}
            id="map"
            className="h-[60vh] md:h-[calc(100vh-140px)] w-full rounded-2xl border border-black/10 bg-gray-50"
        />
    );
}

export default function Home() {
    const [query, setQuery] = useState("");
    const [allData, setAllData] = useState<Ormas[]>([]);
    const [results, setResults] = useState<Ormas[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            const res = await fetch(
                "https://rpblbedyqmnzpowbumzd.supabase.co/rest/v1/ormas?select=*",
                {
                    headers: {
                        apikey:
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwYmxiZWR5cW1uenBvd2J1bXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjcxMjYsImV4cCI6MjA3MzcwMzEyNn0.QaMJlyqhZcPorbFUpImZAynz3o2l0xDfq_exf2wUrTs",
                        Authorization:
                            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwYmxiZWR5cW1uenBvd2J1bXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjcxMjYsImV4cCI6MjA3MzcwMzEyNn0.QaMJlyqhZcPorbFUpImZAynz3o2l0xDfq_exf2wUrTs",
                    },
                }
            );
            const data: Ormas[] = await res.json();
            setAllData(data);
            setResults(data);
        })();
    }, []);

    const onSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const q = query.trim().toLowerCase();
        if (!q) {
            setResults(allData);
            return;
        }
        setResults(
            allData.filter(
                (o) =>
                    o.nama.toLowerCase().includes(q) || o.alamat.toLowerCase().includes(q)
            )
        );
    };

    return (
        <div
            className={`${geistSans.className} ${geistMono.className} font-sans min-h-screen grid grid-rows-[auto_1fr] bg-white text-black`}
        >
            {/* Leaflet CSS (boleh pindah ke globals.css kalau mau) */}
            <Head>
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                    crossOrigin=""
                />
            </Head>
            {/* Header */}
            <header className="sticky top-0 z-[1000] w-full border-b border-black/10 bg-red-600/95 backdrop-blur">
                <div className="w-full px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-white">
                            Selamat Datang, MANORI MATENG Mateng [Guest]
                        </h1>
                    </div>
                </div>
            </header>
            {/* Grid utama: 12 kolom, Map 10 kolom full, Sidebar 2 kolom */}
            <main className="w-full px-6 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Map 10 kolom */}
                <section className="md:col-span-9 col-span-1">
                    <LeafletMap
                        selectedId={selectedId}
                        points={results
                            .filter(
                                (o) => typeof o.lat === "number" && typeof o.lng === "number"
                            )
                            .map((o) => ({
                                id: o.id,
                                lat: o.lat as number,
                                lng: o.lng as number,
                                label: o.nama,
                                status: o.status,
                                alamat: o.alamat,
                                created_at: o.created_at,
                                surat_filename: (o as any).surat_filename ?? null,
                                surat_path: (o as any).surat_path ?? null,
                                surat_mime: (o as any).surat_mime ?? null,
                                sk_filename: (o as any).sk_filename ?? null,
                                sk_path: (o as any).sk_path ?? null,
                                sk_mime: (o as any).sk_mime ?? null,
                                struktur_pengurus_filename: (o as any).struktur_pengurus_filename ?? null,
                                struktur_pengurus_path: (o as any).struktur_pengurus_path ?? null,
                                struktur_pengurus_mime: (o as any).struktur_pengurus_mime ?? null,
                                lokasi_filename: (o as any).lokasi_filename ?? null,
                                lokasi_path: (o as any).lokasi_path ?? null,
                                lokasi_mime: (o as any).lokasi_mime ?? null,
                            }))}
                    />
                </section>
                {/* Sidebar 2 kolom */}
                <aside className="md:col-span-3 col-span-1 flex flex-col h-[calc(100vh-140px)]">
                    {/* Aksi atas */}
                    <div className="flex flex-col gap-4">
                        <Link
                            href="/admin/login"
                            className="inline-flex items-center justify-center rounded-full bg-black text-white h-10 px-5 font-medium hover:opacity-90 transition"
                        >
                            Login as Admin
                        </Link>

                        <div className="flex justify-center mb-6">
                            <Image
                                src="/assets/images/struktur.jpeg"
                                alt="Logo MANORI MATENG"
                                width={650}
                                height={650}
                                priority
                                className="shadow-xl rounded-lg"
                            />
                        </div>

                        <form onSubmit={onSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari nama/alamat ormas..."
                                className="flex-1 h-10 rounded-full border border-black/10 bg-white px-4 outline-none focus:ring-2 focus:ring-black/20"
                            />
                            <button
                                type="submit"
                                onClick={() => onSearch()}
                                className="h-10 whitespace-nowrap rounded-full border border-black/10 px-4 hover:bg-gray-100 transition"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Hasil pencarian */}
                    <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1">
                        <div className="space-y-3">
                            {results.length === 0 && (
                                <div className="text-sm opacity-70">Tidak ada hasil.</div>
                            )}
                            {results.map((o) => (
                                // kartu hasil (ganti <article ...> yang lama)
                                <article
                                    key={o.id}
                                    onClick={() => setSelectedId(o.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) =>
                                        (e.key === "Enter" || e.key === " ") && setSelectedId(o.id)
                                    }
                                    className={`rounded-2xl border p-4 hover:shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/20 ${selectedId === o.id
                                        ? "border-black/30 bg-gray-50"
                                        : "border-black/10"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold leading-tight">{o.nama}</h3>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border ${o.status === "Aktif"
                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                                : "border-gray-400/30 bg-gray-400/10 text-gray-600"
                                                }`}
                                        >
                                            {o.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm opacity-80">{o.alamat}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        {o.surat_filename ? (
                                            <span className="text-sm underline underline-offset-4">
                                                Surat keberadaan: {o.surat_filename}
                                            </span>
                                        ) : (
                                            <span className="text-sm opacity-60">
                                                Surat keberadaan tidak tersedia
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        {o.sk_filename ? (
                                            <span className="text-sm underline underline-offset-4">
                                                Surat Keterangan (SK): {o.sk_filename}
                                            </span>
                                        ) : (
                                            <span className="text-sm opacity-60">
                                                Surat Keterangan (SK) tidak tersedia
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        {o.struktur_pengurus_filename ? (
                                            <span className="text-sm underline underline-offset-4">
                                                Struktur Pengurus: {o.struktur_pengurus_filename}
                                            </span>
                                        ) : (
                                            <span className="text-sm opacity-60">
                                                Struktur Pengurus tidak tersedia
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        {o.lokasi_filename ? (
                                            <span className="text-sm underline underline-offset-4">
                                                Lokasi Ormas: {o.lokasi_filename}
                                            </span>
                                        ) : (
                                            <span className="text-sm opacity-60">
                                                Lokasi Ormas tidak tersedia
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </aside>
            </main>
            {/* Footer kanan-bawah */}
            <footer className="fixed bottom-4 right-4 z-40 text-xs opacity-70 bg-white/90 border border-black/10 rounded-full px-3 py-1 backdrop-blur">
                © {new Date().getFullYear()} YIS
            </footer>
        </div>
    );
}