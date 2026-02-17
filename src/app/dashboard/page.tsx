"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

// Using the @ alias ensures Vercel finds these regardless of folder depth
import { createClient } from "@/lib/supabase/client";
import { generateCertificateID } from "@/lib/utils";
import { 
  saveCertificate, 
  getCertificates, 
  deleteCertificate, 
  updateCertificate,
  saveModernCertificate, 
  getModernCertificates, 
  getModernCount          
} from "@/lib/actions";

// --- MD3 Icons ---
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
);

const ZoomIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

// MD3 Styled Action Modal
const ActionModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", type = "info" }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div className="bg-[#F3F6FC] rounded-[28px] p-6 max-w-[312px] w-full shadow-xl">
        <h3 className="text-[24px] font-medium text-slate-900 mb-4">{title}</h3>
        <p className="text-[14px] text-slate-600 mb-6 tracking-wide">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="cursor-pointer px-4 py-2 text-[14px] font-medium text-blue-700 hover:bg-blue-50 active:bg-blue-100 rounded-full transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`cursor-pointer px-4 py-2 text-[14px] font-medium rounded-full transition-colors ${type === 'danger' ? 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qrModalRecord, setQrModalRecord] = useState<any>(null);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("encoder");
  const [isLegacyMode, setIsLegacyMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNoThumbnailConfirm, setShowNoThumbnailConfirm] = useState(false);

  // Password Security for Delete
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [sortByYear, setSortByYear] = useState("Newest First");
  
  const router = useRouter();
  const supabase = createClient();

  const initialForm = {
    firstName: "",
    middleName: "",
    surname: "",
    type: "Certificate of Completion",
    issuedBy: "RMMO Alumni Advisory Council", 
    dateIssued: "",
    schoolYear: "",
    yearGraduated: "",
    validity: "VALID", 
    googlePhotosLink: "", 
    manualCertNumber: "",
  };

  const [formData, setFormData] = useState(initialForm);

  const closeTopModal = useCallback(() => {
    if (isFullscreen) return setIsFullscreen(false);
    if (showNoThumbnailConfirm) return setShowNoThumbnailConfirm(false);
    if (showDeleteConfirm) return setShowDeleteConfirm(false);
    if (showDeletePasswordModal) {
      setShowDeletePasswordModal(false);
      setDeletePassword("");
      setPasswordError(false);
      return;
    }
    if (showLogoutConfirm) return setShowLogoutConfirm(false);
    if (qrModalRecord) return setQrModalRecord(null);
    if (isPreviewModalOpen) return setIsPreviewModalOpen(false);
    if (isModalOpen) return closeModal();
  }, [isFullscreen, showNoThumbnailConfirm, showDeleteConfirm, showDeletePasswordModal, showLogoutConfirm, qrModalRecord, isModalOpen, isPreviewModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTopModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeTopModal]);

  useEffect(() => {
    const isAnyModalOpen = isModalOpen || isPreviewModalOpen || qrModalRecord || showLogoutConfirm || showDeleteConfirm || showDeletePasswordModal || showNoThumbnailConfirm || isFullscreen;
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'unset';
  }, [isModalOpen, isPreviewModalOpen, qrModalRecord, showLogoutConfirm, showDeleteConfirm, showDeletePasswordModal, showNoThumbnailConfirm, isFullscreen]);

  const getImageUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com")) {
      const id = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
      return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
    }
    return url;
  };

  const refreshData = async () => {
    setFetching(true);
    try {
        const [legacyData, modernData] = await Promise.all([
            getCertificates(),
            getModernCertificates()
        ]);
        const legacyWithFlag = legacyData.map((r: any) => ({ ...r, isModern: false }));
        const modernWithFlag = modernData.map((r: any) => ({ ...r, isModern: true }));
        setRecords([...modernWithFlag, ...legacyWithFlag]);
    } catch (err) { console.error(err); }
    setFetching(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
      else {
        setUserRole(user.user_metadata?.role || "encoder");
        refreshData();
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(rec => 
        rec.issued_to?.toLowerCase().includes(lowerSearch) ||
        rec.cert_number?.toLowerCase().includes(lowerSearch) ||
        rec.school_year?.toLowerCase().includes(lowerSearch) ||
        rec.year_graduated?.toLowerCase().includes(lowerSearch)
      );
    }
    if (filterType !== "All Types") result = result.filter(rec => rec.type === filterType);
    if (filterStatus !== "All Status") result = result.filter(rec => rec.validity === filterStatus);
    
    // Sort logic
    result.sort((a, b) => {
        const yearA = parseInt(a.year_graduated) || 0;
        const yearB = parseInt(b.year_graduated) || 0;
        return sortByYear === "Newest First" ? yearB - yearA : yearA - yearB;
    });

    return result;
  }, [records, searchTerm, filterType, filterStatus, sortByYear]);

  const handleEditClick = (rec: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPreviewModalOpen(false);
    setIsEditing(rec.id);
    const nameParts = rec.issued_to ? rec.issued_to.split(" ") : [];
    setFormData({
      firstName: (nameParts[0] || "").toUpperCase(),
      middleName: (nameParts.length > 2 ? nameParts[1] : "").toUpperCase(),
      surname: (nameParts.length > 2 ? nameParts.slice(2).join(" ") : nameParts[1] || "").toUpperCase(),
      type: rec.type,
      issuedBy: rec.issued_by,
      dateIssued: rec.date_issued,
      schoolYear: rec.school_year,
      yearGraduated: rec.year_graduated,
      validity: rec.validity || "VALID",
      googlePhotosLink: rec.google_photos_link || "",
      manualCertNumber: rec.cert_number,
    });
    setIsLegacyMode(!rec.isModern);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(null);
    setIsLegacyMode(false);
    setFormData(initialForm);
  };

  const handleConfirmedDelete = async () => {
    setLoading(true);
    setPasswordError(false);
    
    // 1. Get current user's email
    const { data: { user } } = await supabase.auth.getUser();
    
    // 2. Re-authenticate to verify password
    const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: deletePassword,
    });

    if (error) {
        setPasswordError(true);
        setLoading(false);
        return;
    }

    // 3. If password correct, proceed to delete
    if (isEditing) {
      const recordToDelete = records.find(r => r.id === isEditing);
      const result = await deleteCertificate(isEditing, recordToDelete?.isModern);
      if (result.success) {
        setShowDeletePasswordModal(false);
        setDeletePassword("");
        closeModal();
        refreshData();
      }
    }
    setLoading(false);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 1000; canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR-${qrModalRecord.cert_number}.png`;
        downloadLink.href = pngFile; downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const copyShareLink = (rec: any) => {
    const link = `${window.location.origin}/?c=${rec.cert_number.replace("RMMO-", "")}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.googlePhotosLink && !showNoThumbnailConfirm) {
        setShowNoThumbnailConfirm(true);
        return;
    }
    setLoading(true);
    
    // Sinisiguro nito na lahat ng text ay magiging UPPERCASE
    const upperFirstName = formData.firstName.toUpperCase();
    const upperSurname = formData.surname.toUpperCase();
    const upperMiddleName = formData.middleName.toUpperCase();
    const fullName = `${upperFirstName} ${upperMiddleName} ${upperSurname}`.replace(/\s+/g, ' ').trim();
    const upperManualCert = formData.manualCertNumber.toUpperCase();

    try {
        let savedRecord: any;
        if (isEditing) {
            const recordToEdit = records.find(r => r.id === isEditing);
            const finalID = upperManualCert.startsWith("RMMO-") ? upperManualCert : `RMMO-${upperManualCert}`;
            const updated = { 
                ...formData, 
                firstName: upperFirstName,
                middleName: upperMiddleName,
                surname: upperSurname,
                issuedTo: fullName, 
                certNumber: finalID 
            };
            await updateCertificate(isEditing, updated, recordToEdit?.isModern);
            savedRecord = { ...updated, cert_number: finalID, issued_to: fullName };
        } else {
            if (isLegacyMode) {
                // Para sa Legacy (Manual input)
                const finalID = upperManualCert.startsWith("RMMO-") ? upperManualCert : `RMMO-${upperManualCert}`;
                await saveCertificate({ 
                    ...formData, 
                    firstName: upperFirstName,
                    middleName: upperMiddleName,
                    surname: upperSurname,
                    issuedTo: fullName, 
                    certNumber: finalID 
                });
                savedRecord = { ...formData, cert_number: finalID, issued_to: fullName };
            } else {
                // ETO YUNG CRITICAL NA UPDATE:
                // Ipinapasa na natin ang 'yearGraduated' at 'type' sa getModernCount
                const count = await getModernCount(formData.yearGraduated, formData.type);
                
                // Gagamitin ang count + 1 para sa serial number
                const finalID = generateCertificateID(
                    upperFirstName, 
                    upperSurname, 
                    formData.dateIssued, 
                    formData.type, 
                    count + 1
                );

                await saveModernCertificate({ 
                    ...formData, 
                    firstName: upperFirstName,
                    middleName: upperMiddleName,
                    surname: upperSurname,
                    issuedTo: fullName, 
                    certNumber: finalID 
                });
                savedRecord = { ...formData, cert_number: finalID, issued_to: fullName };
            }
        }
        setShowNoThumbnailConfirm(false);
        await refreshData();
        closeModal();
        setQrModalRecord({ ...savedRecord, isNewRecord: true }); 
    } catch (err) { 
        console.error("Submission error:", err); 
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-[#F8F9FF] text-slate-900 font-sans pb-20 selection:bg-blue-100">
      {/* MD3 Top Bar */}
      <nav className="bg-[#F8F9FF] border-b border-slate-200/60 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-medium tracking-tight leading-none">Control Center</h1>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{userRole}</span>
          </div>
        </div>
        
        <div className="hidden md:flex flex-1 max-w-xl mx-12">
            <div className="relative w-full group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500"><SearchIcon /></div>
                <input 
                    type="text" 
                    placeholder="Search records..." 
                    className="w-full pl-12 pr-4 py-3 bg-[#EEF1F9] border-none rounded-full text-[15px] focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder-slate-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex items-center gap-2">
            <button onClick={() => setShowLogoutConfirm(true)} className="cursor-pointer px-4 py-2 text-blue-700 text-[14px] font-medium rounded-full hover:bg-blue-50 active:bg-blue-100 transition-all">Sign Out</button>
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-800 text-xs">
                {userRole === 'admin' ? 'AD' : 'EN'}
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-normal text-slate-900 mb-2">Certificates</h2>
            <p className="text-slate-500">Manage and verify alumni records</p>
          </div>
          {/* Desktop New Record button - Accessible by both Admin and Encoder */}
          {!fetching && (
            <button onClick={() => { setIsLegacyMode(false); setIsModalOpen(true); }} className="cursor-pointer hidden md:flex bg-blue-700 text-white pl-4 pr-6 py-3.5 rounded-[16px] text-[15px] font-medium hover:bg-blue-800 active:bg-blue-900 active:scale-95 transition-all items-center gap-2 shadow-md">
              <PlusIcon /> Enroll Certificate
            </button>
          )}
        </header>

        {/* Floating Action Button for Mobile */}
        {!fetching && (
          <button 
            onClick={() => { setIsLegacyMode(false); setIsModalOpen(true); }} 
            className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center active:bg-blue-800 active:scale-90 transition-all cursor-pointer"
          >
            <PlusIcon />
          </button>
        )}

        {/* Filters Section */}
        <div className="mb-8">
          {/* Mobile Accordion Toggle */}
          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="md:hidden w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl mb-2"
          >
            <span className="text-[14px] font-bold text-slate-700">Filter & Sort</span>
            <div className={`transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`}><ChevronDownIcon /></div>
          </button>

          {/* Desktop Inline (Always Visible) / Mobile Accordion (Toggleable) */}
          <div className={`${isFilterExpanded ? 'flex' : 'hidden md:flex'} flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200`}>
              <div className="flex flex-col w-full md:w-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase ml-2 mb-1">Type</span>
                <select className="w-full px-4 py-2.5 bg-[#EEF1F9] border-none rounded-xl text-[14px] font-medium text-slate-700 outline-none hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option>All Types</option>
                    <option>Certificate of Completion</option>
					<option>Certificate of Appreciation</option>
                    <option>Awards Certificate</option>
                </select>
              </div>
              
              <div className="flex flex-col w-full md:w-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase ml-2 mb-1">Status</span>
                <select className="w-full px-4 py-2.5 bg-[#EEF1F9] border-none rounded-xl text-[14px] font-medium text-slate-700 outline-none hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option>All Status</option>
                    <option>VALID</option>
                    <option>REVOKED</option>
                    <option>PENDING</option>
                </select>
              </div>

              <div className="flex flex-col w-full md:w-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase ml-2 mb-1">Sort by Year</span>
                <select className="w-full px-4 py-2.5 bg-[#EEF1F9] border-none rounded-xl text-[14px] font-medium text-slate-700 outline-none hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer" value={sortByYear} onChange={(e) => setSortByYear(e.target.value)}>
                    <option>Newest First</option>
                    <option>Oldest First</option>
                </select>
              </div>

              <span className="hidden md:block ml-auto text-[14px] font-medium text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200">{filteredRecords.length} records</span>
          </div>
        </div>

        {fetching ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin"></div></div>
        ) : (
          <div className="flex flex-col gap-2">
              {filteredRecords.map((rec) => (
                  <div 
                      key={`${rec.isModern ? 'm' : 'l'}-${rec.id}`}
                      onClick={() => { setSelectedRecord(rec); setIsPreviewModalOpen(true); }}
                      className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 hover:shadow-md hover:border-blue-200 active:bg-slate-50 transition-all cursor-pointer group"
                  >
                      <div className="flex-1 flex items-start gap-3 overflow-hidden">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[16px] md:text-[17px] font-bold text-slate-900 truncate">{rec.issued_to}</p>
                                <span className={`flex-shrink-0 text-[9px] px-2 py-0.5 rounded-md font-black uppercase ${rec.isModern ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {rec.isModern ? 'New' : 'Legacy'}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                                <span className="text-slate-500 font-medium">{rec.type}</span>
                                <span className="hidden md:inline w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span className="font-mono text-blue-600 font-bold">{rec.cert_number}</span>
                                <span className="inline md:hidden text-slate-400 font-bold">• SY {rec.school_year}</span>
                            </div>
                          </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-3 md:gap-8 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                          <div className="hidden md:block text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">Academic Year</p>
                              <p className="text-[14px] text-slate-800 font-bold">{rec.school_year}</p>
                          </div>
                          
                          <div className={`px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-2 ${rec.validity === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              <div className={`w-2 h-2 rounded-full animate-pulse ${rec.validity === 'VALID' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                              {rec.validity || 'VALID'}
                          </div>

                          <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handleEditClick(rec); }} className="cursor-pointer p-2.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 rounded-xl transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
              {filteredRecords.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-[28px] border-2 border-dashed border-slate-200 text-slate-500">No matching records found.</div>
              )}
          </div>
        )}
      </main>

      {/* Center Preview Modal (Desktop) / Fullscreen (Mobile) */}
      {isPreviewModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsPreviewModalOpen(false)}></div>
          <div className="relative w-full h-full md:h-auto md:max-w-2xl bg-white md:rounded-[28px] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-screen md:max-h-[90vh]">
             <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-[#F3F6FC]">
                <h3 className="text-xl font-medium">Record Preview</h3>
                <button onClick={() => setIsPreviewModalOpen(false)} className="cursor-pointer w-10 h-10 flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors">✕</button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div 
                    onClick={() => setIsFullscreen(true)}
                    className="aspect-video bg-slate-100 rounded-[24px] mb-8 overflow-hidden border border-slate-200 flex items-center justify-center relative group cursor-pointer active:scale-[0.98] transition-all"
                >
                    {selectedRecord.google_photos_link ? (
                        <>
                          <img src={getImageUrl(selectedRecord.google_photos_link)} className="w-full h-full object-contain p-2" alt="Preview" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <ZoomIcon />
                          </div>
                        </>
                    ) : (
                        <p className="text-slate-400 font-medium">No Image attached</p>
                    )}
                </div>

                <div className="space-y-4 text-[16px] text-slate-700">
                    <p><strong className="text-slate-400 font-bold uppercase text-[12px] block mb-1">Full Name</strong> {selectedRecord.issued_to}</p>
                    <p><strong className="text-slate-400 font-bold uppercase text-[12px] block mb-1">ID Number</strong> {selectedRecord.cert_number}</p>
                    <p><strong className="text-slate-400 font-bold uppercase text-[12px] block mb-1">Document Type</strong> {selectedRecord.type}</p>
                    <p><strong className="text-slate-400 font-bold uppercase text-[12px] block mb-1">Status</strong> {selectedRecord.validity || 'VALID'}</p>
                    <p><strong className="text-slate-400 font-bold uppercase text-[12px] block mb-1">Academic Year</strong> {selectedRecord.school_year}</p>
                    <p><strong className="text-slate-400 font-bold uppercase text-[12px] block mb-1">Date Issued</strong> {selectedRecord.date_issued}</p>
                </div>
             </div>

             <div className="p-6 bg-slate-50 flex flex-col md:flex-row gap-3">
                <button onClick={() => { setQrModalRecord(selectedRecord); }} className="cursor-pointer flex-1 py-3.5 bg-white border border-slate-200 text-slate-900 font-medium rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-all">Share / QR Code</button>
                <button onClick={() => handleEditClick(selectedRecord)} className="cursor-pointer flex-1 py-3.5 bg-blue-700 text-white font-medium rounded-xl hover:bg-blue-800 active:bg-blue-900 active:scale-[0.98] transition-all shadow-md">Edit Record</button>
             </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {isFullscreen && selectedRecord && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4">
            <button onClick={() => setIsFullscreen(false)} className="cursor-pointer absolute top-8 right-8 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 active:bg-white/30 transition-all z-[310]">✕</button>
            <img src={getImageUrl(selectedRecord.google_photos_link)} className="max-w-full max-h-full object-contain" alt="Full View" />
        </div>
      )}

      {/* MD3 Form Modal - Fullscreen on Mobile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm hidden md:block" onClick={closeModal}></div>
          <div className="relative w-full h-full md:h-auto md:max-w-4xl bg-[#F8F9FF] md:bg-white md:rounded-[28px] shadow-2xl overflow-y-auto animate-in md:zoom-in-95 slide-in-from-bottom duration-300 flex flex-col">
            <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <h3 className="text-2xl font-normal text-slate-900">{isEditing ? "Edit" : "Add"} Entry</h3>
                <button onClick={closeModal} className="cursor-pointer w-10 h-10 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 rounded-full transition-colors">✕</button>
            </div>

            <div className="p-6 md:p-10 flex-1">
                <form id="entryForm" onSubmit={handleFormSubmit} className="space-y-10">
                    {/* Toggle Section */}
                    <div className="w-full bg-[#EEF1F9] p-1.5 rounded-2xl flex">
                        <button type="button" disabled={isEditing !== null} onClick={() => setIsLegacyMode(false)} className={`cursor-pointer flex-1 py-3 text-[14px] font-bold rounded-xl transition-all ${!isLegacyMode ? 'bg-blue-700 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700 active:bg-slate-200'}`}>New Record</button>
                        <button type="button" disabled={isEditing !== null} onClick={() => setIsLegacyMode(true)} className={`cursor-pointer flex-1 py-3 text-[14px] font-bold rounded-xl transition-all ${isLegacyMode ? 'bg-blue-700 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700 active:bg-slate-200'}`}>Legacy Record</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      <div className="md:col-span-8 space-y-8">
                          <div>
                              <label className="text-[12px] font-bold text-blue-700 uppercase tracking-widest block mb-4">Legal Name</label>
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                  <div className="md:col-span-5">
                                    <span className="text-[11px] text-slate-400 ml-1">Surname</span>
                                    <input required className="uppercase w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all" value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value.toUpperCase()})} />
                                  </div>
                                  <div className="md:col-span-5">
                                    <span className="text-[11px] text-slate-400 ml-1">First Name</span>
                                    <input required className="uppercase w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value.toUpperCase()})} />
                                  </div>
                                  <div className="md:col-span-2">
                                    <span className="text-[11px] text-slate-400 ml-1">M.I.</span>
                                    <input maxLength={2} className="uppercase w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value.toUpperCase()})} />
                                  </div>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Category</label>
									<select 
										disabled={isEditing !== null} 
										className={`w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none transition-all ${
											isEditing !== null 
											? 'opacity-60 cursor-not-allowed' 
											: 'cursor-pointer hover:bg-slate-200 active:bg-slate-300'
										}`}
										value={formData.type} 
										onChange={e => setFormData({...formData, type: e.target.value})}
									>
										<option>Certificate of Completion</option>
										<option>Certificate of Appreciation</option>
										<option>Awards Certificate</option>
									</select>
								</div>
                              <div>
                                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Validation Status</label>
                                  <select className="w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none cursor-pointer hover:bg-slate-200 active:bg-slate-300 transition-all" value={formData.validity} onChange={e => setFormData({...formData, validity: e.target.value})}>
                                      <option value="VALID">VALID</option><option value="REVOKED">REVOKED</option><option value="PENDING">PENDING</option>
                                  </select>
                              </div>
                          </div>

                          {isLegacyMode && (
                              <div className="p-6 bg-orange-50 border border-orange-100 rounded-2xl">
                                  <label className="text-[11px] font-bold text-orange-700 uppercase tracking-widest block mb-2">Manual Serial Number</label>
                                  <input required placeholder="e.g. RMMO-001" className="uppercase w-full p-4 bg-white border border-orange-200 rounded-xl font-mono text-[16px] outline-none focus:ring-2 focus:ring-orange-500" value={formData.manualCertNumber} onChange={e => setFormData({...formData, manualCertNumber: e.target.value.toUpperCase()})} />
                              </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div><label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">Issue Date</label><input type="date" required className="w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] hover:bg-slate-200 active:bg-slate-300 transition-all" value={formData.dateIssued} onChange={e => setFormData({...formData, dateIssued: e.target.value})} /></div>
                              <div><label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">SY</label><input placeholder="24-25" className="w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] hover:bg-slate-200 focus:bg-white active:bg-slate-300 transition-all" value={formData.schoolYear} onChange={e => setFormData({...formData, schoolYear: e.target.value})} /></div>
                              <div><label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">Batch Year</label><input placeholder="2025" className="w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] hover:bg-slate-200 focus:bg-white active:bg-slate-300 transition-all" value={formData.yearGraduated} onChange={e => setFormData({...formData, yearGraduated: e.target.value})} /></div>
                          </div>
                      </div>

                      <div className="md:col-span-4 space-y-4">
                          <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block">Document Preview</label>
                          <div 
                            onClick={() => formData.googlePhotosLink && setIsFullscreen(true)}
                            className={`aspect-[3/4] bg-[#EEF1F9] border-2 border-dashed border-slate-300 rounded-[24px] overflow-hidden flex items-center justify-center transition-all group relative ${formData.googlePhotosLink ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                          >
                               {formData.googlePhotosLink ? (
                                 <>
                                    <img src={getImageUrl(formData.googlePhotosLink)} className="w-full h-full object-cover" alt="Thumb" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ZoomIcon />
                                    </div>
                                 </>
                               ) : <div className="text-center p-6"><p className="text-[13px] text-slate-400 font-medium italic">No Image Attached</p></div>}
                          </div>
                          <input placeholder="Paste Google Photos Link" className="w-full p-4 bg-[#EEF1F9] rounded-xl text-[13px] font-mono focus:bg-white active:bg-slate-200 transition-all outline-none" value={formData.googlePhotosLink} onChange={e => setFormData({...formData, googlePhotosLink: e.target.value})} />
                      </div>
                    </div>
                </form>
            </div>

            {/* Footer Buttons with Role Awareness */}
            <div className="px-6 py-10 bg-white border-t border-slate-100">
                {/* Desktop Layout */}
                <div className="hidden md:flex items-center justify-between w-full">
                    <div>
                        {/* Only Admins can see the Delete button */}
                        {isEditing && userRole === "admin" && (
                            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="cursor-pointer bg-red-600 text-white text-[15px] font-medium px-8 py-4 hover:bg-red-700 active:bg-red-800 active:scale-95 rounded-full transition-all">Delete Record</button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={closeModal} className="cursor-pointer px-8 py-4 text-[15px] font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-full transition-all">Discard</button>
                        <button type="submit" form="entryForm" disabled={loading} className="cursor-pointer px-10 py-4 bg-blue-700 text-white rounded-full text-[15px] font-bold shadow-lg shadow-blue-200 hover:bg-blue-800 active:bg-blue-900 active:scale-95 transition-all disabled:opacity-50">
                            {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Record"}
                        </button>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="flex flex-col md:hidden gap-3 w-full">
                    <button type="submit" form="entryForm" disabled={loading} className="cursor-pointer w-full px-10 py-4 bg-blue-700 text-white rounded-full text-[15px] font-bold shadow-lg shadow-blue-200 hover:bg-blue-800 active:bg-blue-900 active:scale-95 transition-all disabled:opacity-50">
                        {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Record"}
                    </button>
                    {/* Only Admins can see the Delete button */}
                    {isEditing && userRole === "admin" && (
                        <button type="button" onClick={() => setShowDeleteConfirm(true)} className="cursor-pointer w-full bg-red-600 text-white text-[15px] font-medium px-8 py-4 hover:bg-red-700 active:bg-red-800 active:scale-95 rounded-full transition-all">Delete Record</button>
                    )}
                    <button type="button" onClick={closeModal} className="cursor-pointer w-full px-8 py-4 text-[15px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-all">Discard</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* QR & Sharing Modal */}
      {qrModalRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-[28px] p-8 max-w-[420px] w-full text-center shadow-2xl relative border border-slate-100">
            <h3 className="text-2xl font-medium mb-1">{qrModalRecord.issued_to}</h3>
            <p className="text-blue-700 font-mono text-[14px] mb-8 font-semibold uppercase">{qrModalRecord.cert_number}</p>
            
            <div className="bg-[#EEF1F9] p-6 rounded-[24px] inline-block mb-8">
              <QRCodeSVG id="qr-code-svg" value={`${window.location.origin}/?c=${qrModalRecord.cert_number.replace("RMMO-", "")}`} size={180} level="H" includeMargin={true} />
            </div>

            <div className="mb-8 text-left">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Sharing Link</label>
                <div className="flex gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <input readOnly className="flex-1 bg-transparent border-none text-[13px] px-2 outline-none text-slate-600" value={`${window.location.origin}/?c=${qrModalRecord.cert_number.replace("RMMO-", "")}`} />
                    <button onClick={() => copyShareLink(qrModalRecord)} className="cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-blue-700 hover:bg-blue-50 active:bg-blue-100 transition-all">
                        {copySuccess ? "Copied!" : "Copy"}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <button onClick={downloadQRCode} className="cursor-pointer w-full py-4 bg-blue-700 text-white rounded-2xl text-[15px] font-bold hover:bg-blue-800 active:bg-blue-900 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <DownloadIcon /> Download QR Code
                </button>
                <button onClick={() => setQrModalRecord(null)} className="cursor-pointer w-full py-3 text-slate-500 font-medium text-[15px] hover:text-slate-900 active:bg-slate-50 rounded-xl transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Password Security Modal */}
      {showDeletePasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[210]">
          <div className="bg-white rounded-[28px] p-8 max-w-[340px] w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-[22px] font-medium text-slate-900 mb-2">Security Check</h3>
            <p className="text-[14px] text-slate-500 mb-6">Enter your administrator password to authorize this deletion.</p>
            
            <div className="mb-6">
                <input 
                    type="password" 
                    placeholder="Enter admin password"
                    className={`w-full p-4 bg-[#EEF1F9] rounded-xl text-[15px] outline-none transition-all ${passwordError ? 'ring-2 ring-red-500 bg-red-50' : 'focus:ring-2 focus:ring-blue-600 focus:bg-white'}`}
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setPasswordError(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmedDelete()}
                    autoFocus
                />
                {passwordError && <p className="text-red-600 text-[12px] font-bold mt-2 ml-2">Incorrect password. Access denied.</p>}
            </div>

            <div className="flex gap-2">
                <button onClick={() => { setShowDeletePasswordModal(false); setDeletePassword(""); setPasswordError(false); }} className="cursor-pointer flex-1 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-100 rounded-full transition-colors">Cancel</button>
                <button 
                    onClick={handleConfirmedDelete} 
                    disabled={loading || !deletePassword}
                    className="cursor-pointer flex-1 py-3 bg-red-600 text-white text-[14px] font-bold rounded-full hover:bg-red-700 active:bg-red-800 transition-all disabled:opacity-50"
                >
                    {loading ? "Verifying..." : "Confirm Delete"}
                </button>
            </div>
          </div>
        </div>
      )}

      <ActionModal isOpen={showNoThumbnailConfirm} title="Missing Photo" message="This record won't have a visual preview. Do you want to proceed?" onConfirm={() => handleFormSubmit()} onCancel={() => setShowNoThumbnailConfirm(false)} confirmText="Save Anyway" />
      <ActionModal isOpen={showDeleteConfirm} title="Delete Record?" message="This entry will be permanently removed from the registry." onConfirm={() => { setShowDeleteConfirm(false); setShowDeletePasswordModal(true); }} onCancel={() => setShowDeleteConfirm(false)} confirmText="Delete" type="danger" />
      <ActionModal isOpen={showLogoutConfirm} title="Sign Out" message="Are you sure you want to end your session?" onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} confirmText="Sign Out" type="danger" />
    </div>
  );
}