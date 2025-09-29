"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useParams, useRouter } from "next/navigation";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwYmxiZWR5cW1uenBvd2J1bXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMjcxMjYsImV4cCI6MjA3MzcwMzEyNn0.QaMJlyqhZcPorbFUpImZAynz3o2l0xDfq_exf2wUrTs"
const SURAT_VIEW_URL = "https://rpblbedyqmnzpowbumzd.supabase.co/rest/v1/ormas_surat_v"

type SuratRow = {
    surat_b64: string;
    surat_filename: string | null;
    surat_mime: string | null;
};

export default function SuratViewerPage() {
    const params = useParams<{ id: string }>();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const router = useRouter();

    const containerRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [b64, setB64] = useState<string | null>(null);
    const [filename, setFilename] = useState<string>("document.pdf");
    const [mime, setMime] = useState<string>("application/pdf");

    // Fetch data dari view (surat_b64)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr(null);

                const url =
                    `${SURAT_VIEW_URL}?select=surat_b64,surat_filename,surat_mime` +
                    `&id=eq.${encodeURIComponent(String(id))}&limit=1`;
                const res = await fetch(url, {
                    headers: {
                        apikey: SUPABASE_ANON_KEY,
                        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                        Accept: "application/json",
                    },
                    cache: "no-store",
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const [row]: SuratRow[] = await res.json();
                if (!row?.surat_b64) throw new Error("Surat tidak tersedia.");

                // normalisasi base64
                let cleaned = row.surat_b64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
                while (cleaned.length % 4) cleaned += "=";

                if (!cancelled) {
                    setB64(cleaned);
                    setFilename(row.surat_filename || "document.pdf");
                    setMime((row.surat_mime || "application/pdf").toLowerCase());
                }
            } catch (e: any) {
                if (!cancelled) setErr(e?.message || "Gagal memuat surat.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id]);

    // Render PDF via PDF.js saat b64 & script siap
    useEffect(() => {
        if (!b64) return;
        const pdfjsLib = (globalThis as any).pdfjsLib;
        if (!pdfjsLib) return; // nunggu script PDF.js load

        // worker dari CDN (paling gampang)
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.js";

        (async () => {
            try {
                if (!containerRef.current) return;
                containerRef.current.innerHTML = ""; // bersihkan

                if (!mime.includes("pdf")) {
                    // Jika bukan PDF, tampilkan pesan & tombol download
                    const note = document.createElement("div");
                    note.className = "text-sm text-gray-700";
                    note.textContent = "File bukan PDF. Silakan unduh untuk melihat.";
                    containerRef.current.appendChild(note);
                    return;
                }

                const bytes = base64ToBytes(b64);
                const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;

                for (let p = 1; p <= pdf.numPages; p++) {
                    const page = await pdf.getPage(p);
                    const viewport = page.getViewport({ scale: 1.25 });

                    const wrapper = document.createElement("div");
                    wrapper.className = "mb-4 flex justify-center";
                    const canvas = document.createElement("canvas");
                    canvas.style.boxShadow = "0 2px 12px rgba(0,0,0,.25)";
                    canvas.style.borderRadius = "8px";
                    const ctx = canvas.getContext("2d")!;
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    wrapper.appendChild(canvas);
                    containerRef.current.appendChild(wrapper);

                    await page.render({ canvasContext: ctx, viewport }).promise;
                }
            } catch (e: any) {
                setErr(e?.message || "Gagal merender PDF.");
            }
        })();
    }, [b64, mime]);

    const onDownload = () => {
        if (!b64) return;
        const dataUrl = `data:${mime || "application/pdf"};base64,${b64}`;
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename || "document.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    return (
        <>
            {/* PDF.js dari CDN */}
            <Script
                src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.js"
                strategy="afterInteractive"
            />

            {/* Fullscreen “page modal” */}
            <div className="fixed inset-0 z-50 bg-black/70 p-3 sm:p-6 flex">
                <div className="relative mx-auto my-auto w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="min-w-0">
                            <div className="text-sm text-gray-500">Pratinjau Surat</div>
                            <div className="font-semibold truncate">{filename}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onDownload}
                                className="h-9 px-4 rounded-lg border border-black/10 bg-white hover:bg-gray-50"
                            >
                                Download
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="h-9 px-4 rounded-lg bg-black text-white hover:opacity-90"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>

                    {/* Isi */}
                    <div className="flex-1 overflow-auto bg-neutral-100">
                        <div className="mx-auto max-w-5xl p-4">
                            {loading && (
                                <div className="text-center py-16 text-gray-600">Memuat dokumen…</div>
                            )}
                            {err && !loading && (
                                <div className="text-center py-16 text-red-600">Error: {err}</div>
                            )}
                            <div ref={containerRef} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* Helpers */
function base64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}
