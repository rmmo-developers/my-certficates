"use client";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Use the @ alias for absolute reliability on Vercel
import { verifyCertificate } from "@/lib/actions";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";

// --- MD3 Icons ---
const ZoomIcon = () => (
  <svg
    className="w-6 h-6 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    className="w-12 h-12 text-blue-700"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      fillRule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.24z"
      clipRule="evenodd"
    />
  </svg>
);

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certId, setCertId] = useState("RMMO-");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isInputErrorModalOpen, setIsInputErrorModalOpen] = useState(false);
  const [viewSummary, setViewSummary] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lastVerifiedId = useRef<string | null>(null);

  useEffect(() => {
    const queryId = searchParams.get("c");
    if (queryId) {
      const fullId = queryId.toUpperCase().startsWith("RMMO-")
        ? queryId.toUpperCase()
        : `RMMO-${queryId.toUpperCase()}`;
      if (fullId !== lastVerifiedId.current) {
        setCertId(fullId);
        autoVerify(fullId);
      }
    } else {
      lastVerifiedId.current = null;
    }
  }, [searchParams]);

  const processDecodedText = (decodedText: string) => {
    let extractedId = decodedText.trim();
    if (decodedText.startsWith("http")) {
      try {
        const url = new URL(decodedText);
        const queryParam = url.searchParams.get("c");
        extractedId =
          queryParam || url.pathname.split("/").pop() || decodedText;
      } catch (e) {
        extractedId = decodedText;
      }
    }
    const cleanId = extractedId.toUpperCase().startsWith("RMMO-")
      ? extractedId.toUpperCase()
      : `RMMO-${extractedId.toUpperCase()}`;
    setCertId(cleanId);
    autoVerify(cleanId);
    setIsScannerOpen(false);
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    // Using a timeout to ensure the DOM element #reader is fully rendered before initializing
    const timer = setTimeout(() => {
      if (isScannerOpen) {
        scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            supportedScanTypes: [0] // 0 = QR code only
          },
          false,
        );
        scanner.render(
          (text) => {
            processDecodedText(text);
            if (scanner) scanner.clear();
          },
          (error) => {
            // Silent error for scanning frames
          },
        );
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch((error) => console.error("Failed to clear scanner", error));
      }
    };
  }, [isScannerOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const html5QrCode = new Html5Qrcode("reader-hidden");
    try {
      setLoading(true);
      const decodedText = await html5QrCode.scanFile(file, true);
      processDecodedText(decodedText);
    } catch (err) {
      alert("No valid QR code found in this image.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const autoVerify = async (id: string) => {
    if (!id || id.trim() === "RMMO-") {
      setIsInputErrorModalOpen(true);
      return;
    }

    if (loading) return;
    setLoading(true);
    const res = await verifyCertificate(id.trim());
    if (res.success) {
      lastVerifiedId.current = id.trim().toUpperCase();
      const idOnly = lastVerifiedId.current.replace("RMMO-", "");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?c=${idOnly}`,
      );
      setResult(res.data);
      setViewSummary(true);
      if (!res.data.google_photos_link) setImageError(true);
    } else {
      setIsErrorModalOpen(true);
    }
    setLoading(false);
  };

  const resetSearch = () => {
    lastVerifiedId.current = null;
    setResult(null);
    setViewSummary(false);
    setCertId("RMMO-");
    setImageError(false);
    router.replace("/", { scroll: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    if (value.startsWith("RMMO-RMMO-"))
      value = value.replace("RMMO-RMMO-", "RMMO-");
    else if (!value.startsWith("RMMO-")) value = "RMMO-";
    setCertId(value);
  };

  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com")) {
      const id =
        url.split("/d/")[1]?.split("/")[0] ||
        url.split("id=")[1]?.split("&")[0];
      return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
    }
    return url;
  };

  // --- SEARCH LANDING ---
  if (!viewSummary) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] text-slate-900 font-sans flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
          <div className="text-center mt-10 mb-3">
            <img 
              src="/logo.png" 
              alt="RMMO Logo" 
              className="h-auto w-auto max-w-[300px] md:max-w-[380px] mx-auto"
            />
          </div>

          <div className="w-full max-sm:max-w-xs md:max-w-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                autoVerify(certId);
              }}
              className="flex flex-col gap-3 mb-8"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500">
                  <SearchIcon />
                </div>
                <input
                  required
                  placeholder="ENTER RECORD ID"
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-full text-md font-medium focus:ring-2 focus:ring-blue-700 outline-none transition-all uppercase shadow-sm text-slate-900"
                  value={certId}
                  onChange={handleInputChange}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 cursor-pointer w-full bg-blue-700 text-white py-4 rounded-full font-bold text-xs uppercase hover:bg-blue-800 transition-all shadow-md disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <span>Verify Record</span>
              </button>
            </form>

            <div className="relative flex items-center justify-center my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative px-4 bg-[#F8F9FF] text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                or
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="cursor-pointer py-4 bg-[#EEF1F9] text-slate-700 rounded-[20px] font-medium flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
              >
                <svg
                  className="w-5 h-5 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Scan QR Code
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer py-4 bg-[#EEF1F9] text-slate-700 rounded-[20px] font-medium flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
              >
                <svg
                  className="w-5 h-5 text-blue-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload QR Code
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
<div id="reader-hidden" className="hidden"></div>
            {isScannerOpen && (
              <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-6">
                <style>{`
                  #reader__dashboard_section_csr span > a, 
                  #reader img[alt="Info icon"],
                  #reader__header_message { 
                    display: none !important; 
                  }
                  #reader__camera_permission_button {
                    background-color: #2563eb !important;
                    color: white !important;
                    padding: 12px 28px !important;
                    border-radius: 9999px !important;
                    border: none !important;
                    font-weight: 600 !important;
                    font-size: 16px !important;
                    cursor: pointer !important;
                    margin-top: 15px !important;
                    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3) !important;
                    transition: transform 0.2s ease !important;
                  }
                  #reader__camera_permission_button:active {
                    transform: scale(0.95) !important;
                  }
                  #reader { border: none !important; width: 100% !important; }
                  #reader__dashboard_section_csr { 
                    display: flex !important; 
                    flex-direction: column !important; 
                    align-items: center !important; 
                    justify-content: center !important;
                  }
                  #reader__scan_region {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                  }
                  #reader video {
                    border-radius: 20px !important;
                  }
                `}</style>

                <div className="w-full max-w-2xl flex flex-col items-center">
                  <div id="reader" className="w-full"></div>
                </div>

                <button
                  onClick={() => setIsScannerOpen(false)}
                  className="mt-12 w-16 h-16 flex items-center justify-center bg-white/10 text-white border border-white/20 rounded-full shadow-2xl hover:bg-red-500 hover:text-white transition-all cursor-pointer group"
                  aria-label="Close Scanner"
                >
                  <span className="text-2xl font-light">
                    ✕
                  </span>
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="w-full max-w-xl mx-auto px-6 pb-10 text-center space-y-4">
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Your Certificate Number is located below the certificate together
            with the QR Code.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed italic">
            By granting camera permissions the QR code scanner scans locally
            without uploading any data or stored in our servers, ensuring that
            your information stays private.
          </p>
          <p className="text-[11px] text-slate-400 pt-4">
            Powered by RMMO © {new Date().getFullYear()}.
          </p>
        </footer>

        {loading && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-[200]">
            <div className="bg-white rounded-[28px] p-8 max-w-[280px] w-full text-center shadow-xl flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-700 rounded-full animate-spin mb-4"></div>
              <h3 className="text-[18px] font-medium text-slate-900">
                Searching Record
              </h3>
              <p className="text-[12px] text-slate-500 mt-2">
                Please wait while we verify the certificate information.
              </p>
            </div>
          </div>
        )}

        {isInputErrorModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-[110]">
            <div className="bg-[#F3F6FC] rounded-[28px] p-8 max-w-[312px] w-full text-center shadow-xl">
              <h3 className="text-[24px] font-medium text-slate-900 mb-4"></h3>
              <p className="text-[14px] text-slate-600 mb-6 tracking-wide">
                Enter a valid Document Number Code.
              </p>
              <button
                onClick={() => setIsInputErrorModalOpen(false)}
                className="cursor-pointer w-full py-3 bg-blue-100 text-blue-700 rounded-full font-medium text-[14px] hover:bg-blue-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {isErrorModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-[110]">
            <div className="bg-[#F3F6FC] rounded-[28px] p-8 max-w-[312px] w-full text-center shadow-xl">
              <h3 className="text-[24px] font-medium text-slate-900 mb-4">
                No Record Found
              </h3>
              <p className="text-[14px] text-slate-600 mb-6 tracking-wide">
                This document either does not exist in our records or has an
                invalid code.
              </p>
              <button
                onClick={() => setIsErrorModalOpen(false)}
                className="cursor-pointer w-full py-3 bg-blue-100 text-blue-700 rounded-full font-medium text-[14px] hover:bg-blue-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VERIFIED RESULTS ---
  return (
    <div className="min-h-screen lg:h-screen bg-[#F8F9FF] text-slate-900 font-sans flex flex-col overflow-y-auto lg:overflow-hidden">
      <nav className="max-w-7xl mx-auto w-full px-4 md:px-8 py-4 flex justify-between items-center shrink-0">
        <button
          onClick={resetSearch}
          className="cursor-pointer flex items-center gap-2 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-full font-medium text-[14px] transition"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Verify Another Document
        </button>
      </nav>

      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 lg:min-h-0 pb-6">
        <div className="lg:col-span-4 space-y-4 lg:overflow-y-auto lg:pr-2">
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="flex flex-col items-center mb-6">
              <CheckCircleIcon />
              <span className="mt-2 text-[12px] font-bold text-blue-700 uppercase tracking-[0.2em]">
                Document Found
              </span>
            </div>

            <div className="w-full space-y-6">
              <section>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Issued to
                </p>
                <p className="text-[14px] font-medium text-slate-700 uppercase">
                  {result.issued_to}
                </p>
              </section>

              <section>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Certificate Number
                </p>
                <p className="font-mono font-bold text-[14px] text-blue-700">
                  {result.cert_number}
                </p>
              </section>

              <section>
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Validity
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[12px] font-bold ${
                    result.validity?.toUpperCase() === "VALID"
                      ? "bg-emerald-50 text-emerald-700"
                      : result.validity?.toUpperCase() === "REVOKED"
                        ? "bg-red-50 text-red-700"
                        : result.validity?.toUpperCase() === "PENDING"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      result.validity?.toUpperCase() === "VALID"
                        ? "bg-emerald-500"
                        : result.validity?.toUpperCase() === "REVOKED"
                          ? "bg-red-500"
                          : result.validity?.toUpperCase() === "PENDING"
                            ? "bg-amber-500"
                            : "bg-slate-500"
                    }`}
                  ></div>
                  {result.validity}
                </div>
              </section>

              <div className="pt-4 border-t border-slate-50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Document Type
                  </span>
                  <span className="text-[14px] font-medium text-slate-700">
                    {result.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Term
                  </span>
                  <span className="text-[14px] font-medium text-slate-700">
                    {result.school_year}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Issue Date
                  </span>
                  <span className="text-[14px] font-medium text-slate-700">
                    {result.date_issued}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    Issued By
                  </span>
                  <span className="text-[14px] font-medium text-slate-700">
                    {result.issued_by}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-700 p-5 rounded-[24px] text-white shadow-lg shadow-blue-100">
            <p className="text-[12px] font-medium leading-relaxed opacity-90 text-center lg:text-left">
              This record is officially recognized by the institution. Any
              unauthorized modifications are strictly prohibited.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col min-h-[500px] lg:min-h-0">
          <div className="bg-white p-4 rounded-[28px] shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0">
            <div
              onClick={() =>
                !imageError &&
                result.google_photos_link &&
                setIsFullscreen(true)
              }
              className="flex-1 rounded-[20px] overflow-hidden bg-[#F8F9FF] border border-slate-50 relative flex items-center justify-center group cursor-pointer active:scale-[0.99] transition-all min-h-0"
            >
              {!imageError && result.google_photos_link ? (
                <>
                  <img
                    src={getImageUrl(result.google_photos_link)}
                    className="w-full h-full object-contain p-2"
                    alt="Document"
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIcon />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-[20px] flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-slate-900 font-medium mb-1 text-[14px]">
                    Preview not available
                  </h4>
                  <p className="text-slate-400 text-[12px] max-w-xs leading-relaxed">
                    Source image is currently processing.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3 px-2 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Digital Hash: {result.cert_number?.split("-")[1]}
              </span>
            </div>
          </div>
        </div>
      </main>

      {isFullscreen && !imageError && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="cursor-pointer absolute top-8 right-8 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 active:bg-white/30 transition-all z-[310]"
          >
            ✕
          </button>
          <img
            src={getImageUrl(result.google_photos_link)}
            className="max-w-full max-h-full object-contain shadow-2xl"
            alt="Full View"
          />
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FF]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin"></div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}