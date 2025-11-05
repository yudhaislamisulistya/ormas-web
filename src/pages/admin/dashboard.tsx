// src/pages/admin/dashboard.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const MapPickerModal = dynamic(() => import("@/components/MapPickerModal"), {
    ssr: false,
});

type Ormas = {
    id?: number;
    nama: string;
    alamat: string;
    status: string; // "Aktif" | "-"
    lat: number | null;
    lng: number | null;
    surat?: null; // blob diabaikan di UI ini (opsional)
    surat_filename?: string | null;
    surat_mime?: string | null;
    surat_path?: string | null;
    sk_filename?: string | null;
    sk_mime?: string | null;
    sk_path?: string | null;
    struktur_pengurus_filename?: string | null;
    struktur_pengurus_mime?: string | null;
    struktur_pengurus_path?: string | null;
    lokasi_filename?: string | null;
    lokasi_mime?: string | null;
    lokasi_path?: string | null;
    created_at?: string | null;
};

const SUPABASE_URL = "https://rpblbedyqmnzpowbumzd.supabase.co/rest/v1/ormas";
const SUPABASE_URL_SURAT_ORMAS =
    "https://rpblbedyqmnzpowbumzd.supabase.co/rest/v1/ormas_surat_v";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwYmxiZWR5cW1uenBvd2J1bXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjcxMjYsImV4cCI6MjA3MzcwMzEyNn0.QaMJlyqhZcPorbFUpImZAynz3o2l0xDfq_exf2wUrTs";
const SUPABASE_STORAGE_URL =
    "https://rpblbedyqmnzpowbumzd.storage.supabase.co/storage/v1/s3";
const BUCKET = "ormas_surat";

export const supabase = createClient(
    "https://rpblbedyqmnzpowbumzd.supabase.co/",
    SUPABASE_ANON_KEY
);

export default function Dashboard() {
    const [items, setItems] = useState<Ormas[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [q, setQ] = useState("");
    const [formFile, setFormFile] = useState<File | null>(null);
    const [showMap, setShowMap] = useState(false);

    // onSelect dari modal
    const handlePick = (pos: { lat: number; lng: number }) => {
        onChange("lat", pos.lat);
        onChange("lng", pos.lng);
        setShowMap(false);
    };

    // form state (8 kolom)
    const [form, setForm] = useState<Ormas>({
        id: undefined,
        nama: "",
        alamat: "",
        status: "-",
        lat: null,
        lng: null,
        surat: undefined,
        surat_filename: null,
        surat_mime: null,
        surat_path: null,
        sk_filename: null,
        sk_mime: null,
        sk_path: null,
        struktur_pengurus_filename: null,
        struktur_pengurus_mime: null,
        struktur_pengurus_path: null,
        lokasi_filename: null,
        lokasi_mime: null,
        lokasi_path: null,
    });

    // fetch list
    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${SUPABASE_URL}?select=*`, {
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                },
            });
            const data: Ormas[] = await res.json();
            setItems(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter(
            (x) =>
                x.nama.toLowerCase().includes(s) ||
                x.alamat.toLowerCase().includes(s) ||
                String(x.id ?? "").includes(s)
        );
    }, [q, items]);

    const onChange = (
        key: keyof Ormas,
        val: string | number | null | undefined
    ) => {
        setForm((f) => ({ ...f, [key]: val as any }));
    };

    const onDelete = async (id: number) => {
        if (!confirm("Hapus data ini?")) return;
        setLoading(true);
        try {
            const res = await fetch(`${SUPABASE_URL}?id=eq.${id}`, {
                method: "DELETE",
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                },
            });
            if (!res.ok) {
                alert("Gagal menghapus data.");
                return;
            }
            await fetchList();
            alert("Data terhapus.");
        } catch (err) {
            alert("Gagal menghapus data.");
        } finally {
            setLoading(false);
        }
    };

    const onReset = () => {
        setForm({
            id: undefined,
            nama: "",
            alamat: "",
            status: "-",
            lat: null,
            lng: null,
            surat: undefined,
            surat_filename: null,
            surat_mime: null,
        });
        setFormFile(null);
    };

    const onEdit = (row: Ormas) => {
        setForm({
            id: row.id,
            nama: row.nama ?? "",
            alamat: row.alamat ?? "",
            status: row.status ?? "-",
            lat: row.lat ?? null,
            lng: row.lng ?? null,
            surat: undefined, // blob diabaikan di UI ini
            surat_filename: row.surat_filename ?? null,
            surat_mime: row.surat_mime ?? null,
        });

        setFormFile(null);
        // optional: scroll to form on mobile
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const BUCKET = "ormas_surat";

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (!supabase) throw new Error("Supabase client belum terinisialisasi");
            if (!BUCKET) throw new Error("Konstanta BUCKET belum di-set");

            const isEdit = form.id != null && form.id !== "";
            const idNum = isEdit ? (typeof form.id === "string" ? Number(form.id) : form.id) : undefined;
            const folderKey = isEdit ? String(idNum) : (crypto as any).randomUUID?.() || `${Date.now()}`;

            const payload: any = {
                ...(isEdit ? { id: idNum } : {}),
                nama: form.nama,
                alamat: form.alamat,
                status: form.status,
                lat: form.lat,
                lng: form.lng,
                surat_filename: form.surat_filename || undefined,
                surat_mime: form.surat_mime || undefined,
                surat_path: form.surat_path || undefined,
                sk_filename: form.sk_filename || undefined,
                sk_mime: form.sk_mime || undefined,
                sk_path: form.sk_path || undefined,
                struktur_pengurus_filename: form.struktur_pengurus_filename || undefined,
                struktur_pengurus_mime: form.struktur_pengurus_mime || undefined,
                struktur_pengurus_path: form.struktur_pengurus_path || undefined,
                lokasi_filename: form.lokasi_filename || undefined,
                lokasi_mime: form.lokasi_mime || undefined,
                lokasi_path: form.lokasi_path || undefined,
            };

            const mimeToExt = (m?: string) => {
                const t = (m || "").toLowerCase();
                if (t.includes("pdf")) return "pdf";
                if (t.includes("jpeg")) return "jpeg";
                if (t.includes("jpg")) return "jpg";
                if (t.includes("png")) return "png";
                if (t.includes("gif")) return "gif";
                if (t.includes("webp")) return "webp";
                if (t.includes("msword")) return "doc";
                if (t.includes("officedocument.wordprocessingml")) return "docx";
                return "";
            };

            const ensureExt = (name: string, mime: string) => {
                const hasExt = /\.[A-Za-z0-9]+$/.test(name);
                if (hasExt) return name;
                const ext = mimeToExt(mime);
                return ext ? `${name}.${ext}` : name;
            };

            const uploads: Array<Promise<void>> = [];

            const tryUpload = async (kind: "surat" | "sk" | "struktur_pengurus" | "lokasi", file?: File | null) => {
                if (!file) return;
                const fixedName = ensureExt(file.name, file.type || "");
                const safeName = fixedName.replace(/[^\w.-]+/g, "_");
                const objectKey = `public/ormas_${kind}/${folderKey}/${Date.now()}-${safeName}`;
                const { data: up, error: upErr } = await supabase.storage
                    .from(BUCKET)
                    .upload(objectKey, file, {
                        upsert: true,
                        contentType: file.type || "application/octet-stream",
                        cacheControl: "3600",
                    });
                if (upErr) throw upErr;
                const path = up?.path || objectKey;
                if (kind === "surat") {
                    payload.surat_filename = fixedName;
                    payload.surat_mime = file.type || "application/pdf";
                    payload.surat_path = path;
                } else if (kind === "sk") {
                    payload.sk_filename = fixedName;
                    payload.sk_mime = file.type || "application/pdf";
                    payload.sk_path = path;
                } else if (kind === "struktur_pengurus") {
                    payload.struktur_pengurus_filename = fixedName;
                    payload.struktur_pengurus_mime = file.type || "application/pdf";
                    payload.struktur_pengurus_path = path;
                } else if (kind === "lokasi") {
                    payload.lokasi_filename = fixedName;
                    payload.lokasi_mime = file.type || "application/octet-stream";
                    payload.lokasi_path = path;
                }
            };

            uploads.push(tryUpload("surat", (formFile as any)?.surat));
            uploads.push(tryUpload("sk", (formFile as any)?.sk));
            uploads.push(tryUpload("struktur_pengurus", (formFile as any)?.struktur_pengurus));
            uploads.push(tryUpload("lokasi", (formFile as any)?.lokasi));
            await Promise.all(uploads);

            const { error: dbErr } = await supabase.from("ormas").upsert(payload, { onConflict: "id" });
            if (dbErr) throw dbErr;

            await fetchList();
            onReset();
            alert("Data tersimpan.");
        } catch (err: any) {
            alert(err?.message || "Error");
        } finally {
            setSaving(false);
        }
    };




    const SUPABASE_PUBLIC_BASE =
        "https://rpblbedyqmnzpowbumzd.supabase.co/storage/v1/object/public";

    function buildPublicUrl(path) {
        if (!path) return null;

        // 1) bersihkan leading slash
        let p = String(path).replace(/^\/+/, "");

        // 2) kalau ada bucket di depan, buang supaya tidak /ormas_surat/ormas_surat/…
        p = p.replace(/^ormas_surat\//, "");

        // 3) pastikan selalu diawali "public/"
        if (!p.startsWith("public/")) {
            p = `public/${p}`;
        }

        // 4) hasil akhir
        return `${SUPABASE_PUBLIC_BASE}/${BUCKET}/${p}`;
    }



    return (
        <div className="min-h-screen bg-white text-black p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
                <Link href="/" className="text-blue-600 underline">
                    &larr; Kembali ke Beranda
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Form 8 kolom */}
                <section className="md:col-span-8 col-span-1">
                    <form
                        onSubmit={onSubmit}
                        className="rounded-2xl border border-black/10 p-4 shadow-sm bg-white"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* status */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => onChange("status", e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="-">-</option>
                                    <option value="Belum Aktif">Belum Aktif</option>
                                </select>
                            </div>

                            {/* nama */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Nama</label>
                                <input
                                    type="text"
                                    value={form.nama}
                                    onChange={(e) => onChange("nama", e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                                    placeholder="Nama organisasi"
                                    required
                                />
                            </div>

                            {/* alamat */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Alamat</label>
                                <textarea
                                    value={form.alamat}
                                    onChange={(e) => onChange("alamat", e.target.value)}
                                    className="w-full min-h-[84px] px-3 py-2 rounded-lg border border-black/15 bg-white placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                                    placeholder="Alamat lengkap"
                                    required
                                />
                            </div>

                            {/* lat */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Lat</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.lat ?? ""}
                                    onChange={(e) =>
                                        onChange(
                                            "lat",
                                            e.target.value === "" ? null : Number(e.target.value)
                                        )
                                    }
                                    className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                                    placeholder="-2.2067"
                                />
                            </div>

                            {/* lng */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Lng</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={form.lng ?? ""}
                                    onChange={(e) =>
                                        onChange(
                                            "lng",
                                            e.target.value === "" ? null : Number(e.target.value)
                                        )
                                    }
                                    className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                                    placeholder="119.3522"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowMap(true)}
                                    className="h-10 px-4 rounded-lg border border-black/20 bg-white hover:bg-gray-100 transition"
                                >
                                    Pilih di Peta
                                </button>
                                {form.lat && form.lng ? (
                                    <span className="ml-3 text-sm text-gray-600">
                                        Terpilih: {Number(form.lat).toFixed(6)},{" "}
                                        {Number(form.lng).toFixed(6)}
                                    </span>
                                ) : null}
                            </div>

                            <div className="space-y-6 w-full md:col-span-2">
                                {/* ===================== 1. Surat Keberadaan ===================== */}
                                <div className="border border-black/10 rounded-xl p-4 bg-gray-50 w-full col-span-full">
                                    <h3 className="font-semibold mb-3 text-base">
                                        📄 Surat Keberadaan
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Surat Filename (opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.surat_filename ?? ""}
                                                onChange={(e) =>
                                                    onChange("surat_filename", e.target.value)
                                                }
                                                className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                                                placeholder="surat-1.pdf"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Surat MIME (opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.surat_mime ?? ""}
                                                onChange={(e) => onChange("surat_mime", e.target.value)}
                                                className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                                                placeholder="application/pdf"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">
                                                Upload Surat Keberadaan (PDF/IMG)
                                            </label>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0] ?? null;
                                                    setFormFile((x: any) => ({ ...(x || {}), surat: f }));
                                                    if (f) {
                                                        if (!form.surat_filename) setForm((x) => ({ ...x, surat_filename: f.name }));
                                                        if (!form.surat_mime) setForm((x) => ({ ...x, surat_mime: f.type || "application/octet-stream" }));
                                                    }
                                                }}
                                                className="w-full file:mr-3 file:px-3 file:py-2 file:border file:rounded-lg file:bg-white file:text-black file:border-black/15 border border-black/15 rounded-lg h-10 px-2"
                                            />
                                            {form.surat_filename && (
                                                <p className="mt-1 text-xs text-gray-600">
                                                    File: {form.surat_filename}{" "}
                                                    {form.surat_mime ? `(${form.surat_mime})` : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ===================== 2. SK Kepengurusan ===================== */}
                                <div className="border border-black/10 rounded-xl p-4 bg-gray-50">
                                    <h3 className="font-semibold mb-3 text-base">
                                        📜 SK Kepengurusan
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                SK Filename (opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.sk_filename ?? ""}
                                                onChange={(e) =>
                                                    onChange("sk_filename", e.target.value)
                                                }
                                                className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                placeholder="sk.pdf"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                SK MIME (opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.sk_mime ?? ""}
                                                onChange={(e) => onChange("sk_mime", e.target.value)}
                                                className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                placeholder="application/pdf"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">
                                                Upload SK Kepengurusan (PDF/IMG)
                                            </label>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0] ?? null;
                                                    setFormFile((x: any) => ({ ...(x || {}), sk: f }));
                                                    if (f) {
                                                        if (!form.sk_filename) setForm((x) => ({ ...x, sk_filename: f.name }));
                                                        if (!form.sk_mime) setForm((x) => ({ ...x, sk_mime: f.type || "application/octet-stream" }));
                                                    }
                                                }}
                                                className="w-full file:mr-3 file:px-3 file:py-2 file:border file:rounded-lg file:bg-white file:text-black file:border-black/15 border border-black/15 rounded-lg h-10 px-2"
                                            />
                                            {form.sk_filename && (
                                                <p className="mt-1 text-xs text-gray-600">
                                                    File: {form.sk_filename}{" "}
                                                    {form.sk_mime ? `(${form.sk_mime})` : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ===================== 3. Struktur Organisasi ===================== */}
                                <div className="border border-black/10 rounded-xl p-4 bg-gray-50">
                                    <h3 className="font-semibold mb-3 text-base">
                                        👥 Struktur Organisasi
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Struktur Filename (opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.struktur_pengurus_filename ?? ""}
                                                onChange={(e) =>
                                                    onChange("struktur_pengurus_filename", e.target.value)
                                                }
                                                className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                placeholder="struktur.pdf"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Struktur MIME (opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.struktur_pengurus_mime ?? ""}
                                                onChange={(e) =>
                                                    onChange("struktur_pengurus_mime", e.target.value)
                                                }
                                                className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                placeholder="application/pdf"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">
                                                Upload Struktur Organisasi (PDF/IMG)
                                            </label>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0] ?? null;
                                                    setFormFile((x: any) => ({ ...(x || {}), struktur_pengurus: f }));
                                                    if (f) {
                                                        if (!form.struktur_pengurus_filename) setForm((x) => ({ ...x, struktur_pengurus_filename: f.name }));
                                                        if (!form.struktur_pengurus_mime) setForm((x) => ({ ...x, struktur_pengurus_mime: f.type || "application/octet-stream" }));
                                                    }
                                                }}
                                                className="w-full file:mr-3 file:px-3 file:py-2 file:border file:rounded-lg file:bg-white file:text-black file:border-black/15 border border-black/15 rounded-lg h-10 px-2"
                                            />
                                            {form.struktur_pengurus_filename && (
                                                <p className="mt-1 text-xs text-gray-600">
                                                    File: {form.struktur_pengurus_filename}{" "}
                                                    {form.struktur_pengurus_mime
                                                        ? `(${form.struktur_pengurus_mime})`
                                                        : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ===================== 4. Lokasi / Foto Sekretariat ===================== */}
                                <div className="border border-black/10 rounded-xl p-4 bg-gray-50">
                                    <h3 className="font-semibold mb-3 text-base">
                                        📍 Lokasi / Foto Sekretariat
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Lokasi Filename (opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.lokasi_filename ?? ""}
                                                onChange={(e) =>
                                                    onChange("lokasi_filename", e.target.value)
                                                }
                                                className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                placeholder="lokasi.jpg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Lokasi MIME (opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.lokasi_mime ?? ""}
                                                onChange={(e) =>
                                                    onChange("lokasi_mime", e.target.value)
                                                }
                                                className="w-full h-10 px-3 rounded-lg border border-black/15 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                                                placeholder="image/jpeg"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">
                                                Upload Lokasi / Foto Sekretariat (PDF/IMG)
                                            </label>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0] ?? null;
                                                    setFormFile((x: any) => ({ ...(x || {}), lokasi: f }));
                                                    if (f) {
                                                        if (!form.lokasi_filename) setForm((x) => ({ ...x, lokasi_filename: f.name }));
                                                        if (!form.lokasi_mime) setForm((x) => ({ ...x, lokasi_mime: f.type || "application/octet-stream" }));
                                                    }
                                                }}
                                                className="w-full file:mr-3 file:px-3 file:py-2 file:border file:rounded-lg file:bg-white file:text-black file:border-black/15 border border-black/15 rounded-lg h-10 px-2"
                                            />
                                            {form.lokasi_filename && (
                                                <p className="mt-1 text-xs text-gray-600">
                                                    File: {form.lokasi_filename}{" "}
                                                    {form.lokasi_mime ? `(${form.lokasi_mime})` : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="h-10 px-4 rounded-lg border border-black/20 bg-white hover:bg-gray-100 transition"
                            >
                                {saving ? "Menyimpan..." : "Simpan / Upsert"}
                            </button>
                            <button
                                type="button"
                                onClick={onReset}
                                className="h-10 px-4 rounded-lg border border-black/20 bg-white hover:bg-gray-100 transition"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                    {/* Render modal saat showMap true */}
                    {showMap && (
                        <MapPickerModal
                            initial={
                                form.lat != null && form.lng != null
                                    ? { lat: Number(form.lat), lng: Number(form.lng) }
                                    : null
                            }
                            onCancel={() => setShowMap(false)}
                            onSelect={handlePick}
                        />
                    )}
                </section>

                {/* List 4 kolom */}
                <aside className="md:col-span-4 col-span-1">
                    <div className="rounded-2xl border border-black/10 p-4 shadow-sm bg-white">
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Cari nama/alamat/ID..."
                                className="flex-1 h-10 px-3 rounded-lg border border-black/15 bg-white placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                            <button
                                onClick={() => setQ("")}
                                className="h-10 px-3 rounded-lg border border-black/20 hover:bg-gray-100 transition"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                            {loading ? (
                                <div className="text-sm opacity-70">Memuat data…</div>
                            ) : filtered.length === 0 ? (
                                <div className="text-sm opacity-70">Tidak ada data.</div>
                            ) : (
                                <ul className="space-y-2">
                                    {filtered.map((o) => (
                                        <li key={o.id}>
                                            <button
                                                onClick={() => onEdit(o)}
                                                className="w-full text-left rounded-xl border border-black/10 p-3 hover:bg-gray-50 transition"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="font-medium truncate">{o.nama}</div>
                                                        <div className="text-xs text-gray-600 truncate">
                                                            {o.alamat}
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                                                            <span className="rounded-full border border-black/10 px-2 py-0.5">
                                                                {o.lat?.toFixed(4)}, {o.lng?.toFixed(4)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex gap-2">
                                                            {o.surat_path ? (
                                                                <a
                                                                    href={buildPublicUrl(o.surat_path) ?? "#"}
                                                                    className="text-xs underline underline-offset-4 hover:no-underline"
                                                                    aria-label={`Lihat surat ${o.surat_filename ?? ""
                                                                        }`}
                                                                >
                                                                    Lihat Surat Keberadaan
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">
                                                                    Tidak ada surat
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 flex gap-2">
                                                            {o.sk_path ? (
                                                                <a
                                                                    href={buildPublicUrl(o.sk_path) ?? "#"}
                                                                    className="text-xs underline underline-offset-4 hover:no-underline"
                                                                    aria-label={`Lihat surat keterangan ${o.sk_filename ?? ""
                                                                        }`}
                                                                >
                                                                    Lihat Surat Keterangan
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">
                                                                    Tidak ada surat
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 flex gap-2">
                                                            {o.struktur_pengurus_path ? (
                                                                <a
                                                                    href={buildPublicUrl(o.struktur_pengurus_path) ?? "#"}
                                                                    className="text-xs underline underline-offset-4 hover:no-underline"
                                                                    aria-label={`Lihat struktur pengurus ${o.struktur_pengurus_filename ?? ""
                                                                        }`}
                                                                >
                                                                    Lihat Struktur Pengurus
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">
                                                                    Tidak ada surat
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 flex gap-2">
                                                            {o.lokasi_path ? (
                                                                <a
                                                                    href={buildPublicUrl(o.lokasi_path) ?? "#"}
                                                                    className="text-xs underline underline-offset-4 hover:no-underline"
                                                                    aria-label={`Lihat lokasi ${o.lokasi_filename ?? ""
                                                                        }`}
                                                                >
                                                                    Lihat Lokasi
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">
                                                                    Tidak ada surat
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Delete Button */}
                                                    <div className="ml-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDelete(o.id);
                                                            }}
                                                            className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                                            aria-label={`Hapus ormas ${o.nama}`}
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex justify-between items-center">
                                                    <span
                                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium border ${o.status === "Aktif"
                                                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                                            : "border-gray-400/30 bg-gray-400/10 text-gray-600"
                                                            }`}
                                                    >
                                                        {o.status}
                                                    </span>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
