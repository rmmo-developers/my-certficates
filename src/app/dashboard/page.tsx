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
  getModernCount,
  getRegistrants,           
  updateRegistrantStatus,
  approveRegistrant // <--- ADD THIS LINE
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

const UserPlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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
  const [registrants, setRegistrants] = useState<any[]>([]); // New state
  const [activeTab, setActiveTab] = useState<"certificates" | "registrants">("certificates"); // New state
  const [pendingRegistrantId, setPendingRegistrantId] = useState<number | null>(null); // New state
  const [userRole, setUserRole] = useState<string>("encoder");
  const [isLegacyMode, setIsLegacyMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  
  const [isRegistrantModalOpen, setIsRegistrantModalOpen] = useState(false);
  const [selectedRegistrant, setSelectedRegistrant] = useState<any>(null);  
  
  
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
    suffix: "", // Idagdag ito
    type: "Certificate of Completion",
    issuedBy: "RMMO Alumni Advisory Council", 
    dateIssued: "",
    schoolYear: "",
    yearGraduated: "",
    validity: "PENDING", 
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
        const [legacyData, modernData, registrantData] = await Promise.all([
            getCertificates(),
            getModernCertificates(),
            getRegistrants() 
        ]);
        const legacyWithFlag = legacyData.map((r: any) => ({ ...r, isModern: false }));
        const modernWithFlag = modernData.map((r: any) => ({ ...r, isModern: true }));
        
        // DITO NATIN PAGSASAMAHIN ANG DATA
        setRecords([...modernWithFlag, ...legacyWithFlag]);
        setRegistrants(registrantData); 
    } catch (err) { console.error(err); }
    setFetching(false);
  };
  
  const filteredData = useMemo(() => {
    // Piliin kung anong listahan ang ipapakita
    const list = activeTab === "certificates" ? records : registrants;

    return list.filter((item: any) => {
      // ALIGNMENT: Pagsamahin ang data fields para hindi mag-error
      const name = item.issued_to || `${item.first_name} ${item.surname}`;
      const id = item.cert_number || "PENDING";
      
      const searchStr = `${name} ${id}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [activeTab, records, registrants, searchTerm]);

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

useEffect(() => {
  // 1. Create the subscription
  const channel = supabase
    .channel('realtime-registrants')
    .on(
      'postgres_changes',
      {
        event: 'INSERT', // Listen specifically for new entries
        schema: 'public',
        table: 'registrants',
      },
      (payload) => {
        console.log('New registrant detected!', payload.new);
        // 2. Trigger your existing refresh function
        refreshData(); 
        
        // Optional: Add a browser notification or toast here
        if (Notification.permission === "granted") {
          new Notification("New Registration Received", {
            body: `New entry from ${payload.new.first_name} ${payload.new.surname}`,
          });
        }
      }
    )
    .subscribe();

  // 3. Cleanup subscription on unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, [supabase]);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);


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

  // New Memo for Registrants
  const filteredRegistrants = useMemo(() => {
    if (!searchTerm) return registrants;
    const lower = searchTerm.toLowerCase();
    return registrants.filter(r => 
      `${r.first_name} ${r.surname}`.toLowerCase().includes(lower) ||
      r.email?.toLowerCase().includes(lower) ||
      r.position_assigned?.toLowerCase().includes(lower)
    );
  }, [registrants, searchTerm]);

  // Handle Promote Registrant
const handlePromoteRegistrant = (reg: any) => {
  // Close the summary modal first
  setIsRegistrantModalOpen(false); 

  setFormData({
    ...initialForm,
    firstName: reg.first_name.toUpperCase(),
    middleName: reg.middle_name?.toUpperCase() || "",
    surname: reg.surname.toUpperCase(),
    suffix: reg.suffix?.toUpperCase() || "",
    schoolYear: reg.school_year_graduation || "",
    yearGraduated: "",
  });
  setPendingRegistrantId(reg.id);
  setIsLegacyMode(false);
  setIsModalOpen(true);
};

const handleEditClick = (rec: any, e?: React.MouseEvent) => {
  if (e) e.stopPropagation();
  setIsPreviewModalOpen(false);
  setIsEditing(rec.id);
  
  // Better parsing logic
  const nameParts = rec.issued_to ? rec.issued_to.split(" ") : [];
  
  setFormData({
    // If name is "JOHN DOE", firstName is JOHN, surname is DOE
    // If name is "JOHN SMITH DOE", firstName is JOHN, middle is SMITH, surname is DOE
    firstName: (nameParts[0] || "").toUpperCase(),
    middleName: (nameParts.length > 2 ? nameParts[1] : "").toUpperCase(),
    surname: (nameParts.length > 2 ? nameParts.slice(2).join(" ") : nameParts[1] || "").toUpperCase(),
    suffix: rec.suffix || "", // Use actual suffix from DB if it exists
    type: rec.type || "S",
    issuedBy: rec.issued_by || "",
    dateIssued: rec.date_issued || "",
    schoolYear: rec.school_year || "",
    yearGraduated: rec.year_graduated || "",
    validity: rec.validity || "Permanent",
    googlePhotosLink: rec.google_photos_link || "",
    manualCertNumber: rec.cert_number || "",
  });
  
  setIsLegacyMode(!rec.isModern);
  setIsModalOpen(true);
};

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(null);
    setIsLegacyMode(false);
    setPendingRegistrantId(null); // Reset pending ID
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

    // --- NEW VALIDATION CHECK ---
    if (!formData.yearGraduated || formData.yearGraduated.trim() === "") {
        alert("Batch Year (Year Graduated) is required!"); // Or use a nicer toast notification
        return; 
    }
    // ----------------------------

    if (!formData.googlePhotosLink && !showNoThumbnailConfirm) {
        setShowNoThumbnailConfirm(true);
        return;
    }
    setLoading(true);
    
    // Safety check: Gumamit ng (formData.field || "") para hindi mag-error kung undefined ang field
    const upperFirstName = (formData.firstName || "").toUpperCase();
    const upperSurname = (formData.surname || "").toUpperCase();
    const upperMiddleName = (formData.middleName || "").toUpperCase();
    const upperSuffix = (formData.suffix || "").toUpperCase();

    // Isama ang suffix sa dulo ng pangalan at alisin ang extra spaces
    const fullName = `${upperFirstName} ${upperMiddleName} ${upperSurname} ${upperSuffix}`.replace(/\s+/g, ' ').trim();
    const upperManualCert = (formData.manualCertNumber || "").toUpperCase();

    try {
    let savedRecord: any;
    
    // Prepare the standardized ID for manual entry
    const finalManualID = upperManualCert.startsWith("RMMO-") ? upperManualCert : `RMMO-${upperManualCert}`;

    // Base data object to avoid repeating code
    const baseData = {
        ...formData,
        firstName: upperFirstName,
        middleName: upperMiddleName,
        surname: upperSurname,
        suffix: upperSuffix,
        issuedTo: fullName,
    };

if (isEditing) {
        // 1. Identify which table the record belongs to using the existing records state
        const recordToEdit = records.find(r => r.id === isEditing);
        
        // 2. FIXED: Changed baseData.certNumber to baseData.manualCertNumber
        const certNumberToSave = isLegacyMode 
            ? finalManualID 
            : (recordToEdit?.cert_number || baseData.manualCertNumber);

        const updatedData = { ...baseData, certNumber: certNumberToSave };

        // 3. CALL UPDATE
        await updateCertificate(isEditing, updatedData, !!recordToEdit?.isModern);
        
        savedRecord = { ...updatedData, cert_number: certNumberToSave, issued_to: fullName };
    } else {
        // --- NEW RECORD LOGIC (ONLY RUNS IF NOT EDITING) ---
        if (isLegacyMode) {
            // Creates a new row in 'certificates'
            await saveCertificate({ ...baseData, certNumber: finalManualID });
            savedRecord = { ...baseData, cert_number: finalManualID, issued_to: fullName };
        } else {
            // Logic for Modern Table
            const count = await getModernCount(formData.yearGraduated, formData.type);
            const finalID = generateCertificateID(
                upperFirstName, 
                upperSurname, 
                formData.dateIssued, 
                formData.type, 
                count + 1
            );

            // Creates a new row in 'certificates_modern'
            await saveModernCertificate({ ...baseData, certNumber: finalID });
            
            // If this came from a registrant, mark them as approved
            if (pendingRegistrantId) {
                await updateRegistrantStatus(pendingRegistrantId, 'APPROVED'); //
            }
            
            savedRecord = { ...baseData, cert_number: finalID, issued_to: fullName };
        }
    }

    // --- REFRESH AND UI CLEANUP ---
    setShowNoThumbnailConfirm(false);
    await refreshData();
    closeModal(); // This must reset isEditing, pendingRegistrantId, and formData
    
    // Show QR code - isNewRecord is false if we were just editing
    setQrModalRecord({ ...savedRecord, isNewRecord: !isEditing }); 

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
    <h2 className="text-4xl font-normal text-slate-900 mb-2">Registry Management</h2>
    <p className="text-slate-500">Manage certificates and online registrants</p>
  </div>
  
  <div className="flex items-center gap-3">
    {/* Manual Refresh Button */}
    <button 
      onClick={refreshData} 
      disabled={fetching}
      className="cursor-pointer flex bg-white text-slate-600 border border-slate-200 px-4 py-3.5 rounded-[16px] text-[15px] font-medium hover:bg-slate-50 active:scale-95 transition-all items-center gap-2 shadow-sm disabled:opacity-50"
    >
      <div className={fetching ? "animate-spin" : ""}>
        <RefreshIcon />
      </div>
    </button>

    {/* Enroll Certificate Button */}
    {!fetching && activeTab === "certificates" && (
      <button 
        onClick={() => { setIsLegacyMode(false); setIsModalOpen(true); }} 
        className="cursor-pointer flex bg-blue-700 text-white pl-4 pr-6 py-3.5 rounded-[16px] text-[15px] font-medium hover:bg-blue-800 active:bg-blue-900 active:scale-95 transition-all items-center gap-2 shadow-md"
      >
        <PlusIcon /> Enroll Certificate
      </button>
    )}
  </div>
</header>

        {/* Tab System */}
        <div className="flex border-b border-slate-200 mb-8 gap-8 overflow-x-auto no-scrollbar">
            <button 
                onClick={() => setActiveTab("certificates")}
                className={`pb-4 text-[15px] font-bold transition-all cursor-pointer whitespace-nowrap relative ${activeTab === 'certificates' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Certificate Records ({records.length})
                {activeTab === 'certificates' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-700 rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab("registrants")}
                className={`pb-4 text-[15px] font-bold transition-all cursor-pointer whitespace-nowrap relative ${activeTab === 'registrants' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Pending Records ({registrants.length})
                {activeTab === 'registrants' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-700 rounded-t-full"></div>}
            </button>
        </div>

        {/* Floating Action Button for Mobile - Hidden in Registrants Tab */}
        {!fetching && activeTab === "certificates" && (
          <button 
            onClick={() => { setIsLegacyMode(false); setIsModalOpen(true); }} 
            className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center active:bg-blue-800 active:scale-90 transition-all cursor-pointer"
          >
            <PlusIcon />
          </button>
        )}

        {/* Filters Section (Only for Certificates) */}
        {activeTab === "certificates" && (
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
        )}

        {fetching ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin"></div></div>
        ) : (
          <div className="flex flex-col gap-2">
              {/* Conditional Rendering based on Tab */}
              {activeTab === "certificates" ? (
                  filteredRecords.map((rec: any) => (
                      <div 
                          key={`${rec.isModern ? 'm' : 'l'}-${rec.id}`}
                          onClick={() => { setSelectedRecord(rec); setIsPreviewModalOpen(true); }}
                          className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 hover:shadow-md hover:border-blue-200 active:bg-slate-50 transition-all cursor-pointer group"
                      >
                          <div className="flex-1 flex items-start gap-3 overflow-hidden">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[16px] md:text-[17px] font-bold text-slate-900 truncate">
											  {rec.issued_to} {rec.suffix || ""}
											</p>
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
                  ))
              ) : (
			/* Registrants View */
            filteredRegistrants.map((reg) => (
              <div 
                key={`reg-${reg.id}`}
                onClick={() => { setSelectedRegistrant(reg); setIsRegistrantModalOpen(true); }}
                className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all border-l-4 border-l-blue-600 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[16px] md:text-[17px] font-bold text-slate-900 truncate">
                      {reg.first_name} {reg.middle_name ? `${reg.middle_name.charAt(0)}.` : ''} {reg.surname} {reg.suffix || ""}
                    </p>
                    <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">Online Submission</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
                    <span className="font-medium">{reg.email}</span>
                    <span className="hidden md:inline">•</span>
                    <span className="font-bold">{reg.position_assigned}</span>
                    <span className="hidden md:inline">•</span>
                    <span className="italic font-bold text-blue-600">SY {reg.school_year_graduation}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-8 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                  <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">Application Date</p>
                    <p className="text-[14px] text-slate-800 font-bold">{new Date(reg.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handlePromoteRegistrant(reg); 
                      }}
                      className="cursor-pointer w-full md:w-auto px-5 py-2.5 bg-blue-600 text-white text-[13px] font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlusIcon /> Add to Records
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {((activeTab === "certificates" && filteredRecords.length === 0) || 
            (activeTab === "registrants" && filteredRegistrants.length === 0)) && (
              <div className="py-20 text-center bg-white rounded-[28px] border-2 border-dashed border-slate-200 text-slate-500">
                No matching records found.
              </div>
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
                <button onClick={() => { setQrModalRecord(selectedRecord); }} className="cursor-pointer flex-1 py-3.5 bg-white border border-slate-200 text-slate-900 font-medium rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-all">Share QR Code or Link</button>
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

{/* Registrant Summary Modal */}
{isRegistrantModalOpen && selectedRegistrant && (
  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsRegistrantModalOpen(false)}></div>
    <div className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
      
      {(() => {
        // Helper function for clipboard
        const handleCopy = (text: string) => { // Added : string here
		  if (!text || text === "N/A") return;
		  navigator.clipboard.writeText(text);
		};

        const fullName = `${selectedRegistrant.first_name} ${selectedRegistrant.middle_name ? `${selectedRegistrant.middle_name.charAt(0)}.` : ''} ${selectedRegistrant.surname} ${selectedRegistrant.suffix || ""}`.trim();

        // Sub-component for clickable data fields
// Sub-component for clickable data fields
const CopyableField = ({ label, value, colorClass = "text-slate-700" }: { 
  label: string; 
  value: string; 
  colorClass?: string 
}) => (
  <div className="flex flex-col items-start">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</label>
    <div 
      onClick={() => handleCopy(value)}
      className="group relative flex items-center gap-2 cursor-pointer w-fit"
    >
      <p className={`text-[14px] font-bold ${colorClass} transition-colors group-hover:text-blue-600 select-all`}>
        {value || "N/A"}
      </p>
      <svg 
        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-blue-500 transition-all duration-200 transform group-hover:scale-110" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
    </div>
  </div>
);
        return (
          <>
            <div className="p-6 border-b border-slate-100 bg-[#F3F6FC] flex justify-between items-center">
              <h3 className="text-xl font-medium">Registrant Summary</h3>
              <button onClick={() => setIsRegistrantModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-200 cursor-pointer rounded-full">✕</button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              
              {/* PERSONAL INFORMATION */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Details</h4>
                <div className="bg-slate-50 rounded-2xl p-5 space-y-5 border border-slate-100">
                  <CopyableField label="Full Name" value={fullName} />
                  <div className="grid grid-cols-2 gap-4">
                    <CopyableField label="Pronouns" value={selectedRegistrant.gender} />
                    <CopyableField label="Birthday" value={selectedRegistrant.birthday} />
                  </div>
                </div>
              </div>

              {/* POSITION ROLE / COMMITTEE ASSIGNMENT DETAILS */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">POSITION ROLE / COMMITTEE ASSIGNMENT</h4>
                <div className="bg-blue-50/30 rounded-2xl p-5 space-y-5 border border-blue-100/50">
                  <CopyableField label="Position / Committee Assigned" value={selectedRegistrant.position_assigned} />
                  <CopyableField label="Email Address" value={selectedRegistrant.email} colorClass="text-blue-600" />
                </div>
              </div>

              {/* ACADEMIC RECORDS */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Records</h4>
                <div className="bg-slate-50 rounded-2xl p-5 space-y-5 border border-slate-100">
                  <div className="grid grid-cols-2 gap-4">
                    <CopyableField label="Grade & Section" value={selectedRegistrant.grade_level_section} />
                    <CopyableField label="Academic Strand" value={selectedRegistrant.strand} />
                  </div>
                  <CopyableField label="Graduation Year" value={selectedRegistrant.school_year_graduation} />
                </div>
              </div>

              {/* SERVICE PERIOD */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">Service Period</h4>
                <div className="bg-emerald-50/30 rounded-2xl p-5 border border-emerald-100/50">
                  <div className="grid grid-cols-2 gap-4">
                    <CopyableField label="Date Started" value={selectedRegistrant.date_started} />
                    <CopyableField label="Date Ended" value={selectedRegistrant.date_ended} />
                  </div>
                </div>
              </div>

              {/* APPLICATION STATUS */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Application Status</span>
                  <span className="text-[14px] font-black text-amber-700 tracking-wider uppercase">
                    {selectedRegistrant.status || "PENDING"}
                  </span>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  </div>
)}
{/* MD3 Form Modal - Fullscreen on Mobile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm hidden md:block" onClick={closeModal}></div>
          <div className="relative w-full h-full md:h-auto md:max-w-5xl bg-[#F8F9FF] md:bg-white md:rounded-[28px] shadow-2xl overflow-y-auto animate-in md:zoom-in-95 slide-in-from-bottom duration-300 flex flex-col">
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
                            {/* LEGAL NAME SECTION */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-4">
                                    <span className="text-[11px] text-slate-400 ml-1">Surname</span>
                                    <input required className="uppercase w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all" value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="md:col-span-4">
                                    <span className="text-[11px] text-slate-400 ml-1">First Name</span>
                                    <input required className="uppercase w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="md:col-span-2">
                                    <span className="text-[11px] text-slate-400 ml-1">M.I.</span>
                                    <input maxLength={2} className="uppercase w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="md:col-span-2">
                                    <span className="text-[11px] text-slate-400 ml-1">Suffix</span>
                                    <select className="w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none cursor-pointer hover:bg-slate-200 transition-all" value={formData.suffix} onChange={e => setFormData({...formData, suffix: e.target.value.toUpperCase()})}>
                                        <option value="">N/A</option>
                                        <option value="JR">JR</option>
                                        <option value="SR">SR</option>
                                        <option value="II">II</option>
                                        <option value="III">III</option>
                                        <option value="IV">IV</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                                    <select 
                                        disabled={isEditing !== null} 
                                        className={`w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] outline-none transition-all ${isEditing !== null ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-200 active:bg-slate-300'}`}
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
                                        <option value="PENDING">PENDING</option>
										<option value="VALID">VALID</option>
                                        <option value="REVOKED">REVOKED</option>
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
                                <div>
                                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-2">SY</label>
                                    <input required placeholder="e.g., 2025-2026" className="w-full p-4 bg-[#EEF1F9] rounded-xl text-[16px] hover:bg-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all outline-none" value={formData.schoolYear} onChange={e => setFormData({...formData, schoolYear: e.target.value})} />
                                </div>
                                <div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Batch Year <span className="text-red-500">*</span>
  </label>
  <input
    required
    type="text"
    placeholder="e.g. 2025"
    value={formData.yearGraduated}
    onChange={(e) => setFormData({ ...formData, yearGraduated: e.target.value })}
    className={`w-full p-4 rounded-xl border ${!formData.yearGraduated ? 'border-red-300' : 'border-slate-200'}`}
  />
</div>
                            </div>
                        </div>

                        {/* PREVIEW SECTION */}
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
      
      {/* SUCCESS MESSAGE BOX */}
      <div className="mb-6 py-3 px-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700 text-[14px] font-bold">
              {isEditing ? "QR Code and Link Sharing Generated" : "QR Code and Link Sharing Generated"}
          </span>
      </div>

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