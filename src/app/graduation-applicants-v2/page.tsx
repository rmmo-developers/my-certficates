"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveRegistrant } from "@/lib/actions";

// Dashboard-Style Action Modal
const ActionModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", isLoading }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-[24px] p-6 max-w-[380px] w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-[20px] font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-[13px] font-bold text-slate-600 mb-6 leading-relaxed whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            disabled={isLoading} 
            onClick={onCancel} 
            className="cursor-pointer px-4 py-2 text-[13px] font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            disabled={isLoading} 
            onClick={onConfirm} 
            className="cursor-pointer px-5 py-2 text-[13px] font-bold bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Submitting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GradApplicantsPage() {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false); // Controls entry to Stepper
  const [showPrivacy, setShowPrivacy] = useState(false); // Controls transition from Intro to Privacy
  const [currentStep, setCurrentStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false); 
  const [privacyAgreed, setPrivacyAgreed] = useState(false); 
  const [noSuffix, setNoSuffix] = useState(false);

  const [formData, setFormData] = useState({
    surname: "", firstName: "", middleName: "", suffix: "",
    gender: "HIM", 
    birthday: "", email: "", gradeLevelSection: "",
    strand: "TVL-ICT", schoolYearGraduation: "",
    dateStarted: "", dateEnded: "", positionAssigned: ""
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = [
      "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitted && hasStarted) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave? Your changes will not be saved.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [submitted, hasStarted]);

  // Helper to scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToPrivacy = () => {
    setShowPrivacy(true);
    scrollToTop();
  };

  const handleStart = () => {
    setHasStarted(true);
    scrollToTop();
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
    scrollToTop();
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    scrollToTop();
  };

  const handleOpenConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const result = await saveRegistrant({
        ...formData
      });

      if (result.success) {
        setSubmitted(true);
        scrollToTop();
      } else {
        alert("Submission Failed: " + (result.error || "System Error"));
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const inputClass = "w-full p-3.5 bg-[#EEF1F9] border-2 border-transparent focus:border-blue-600 focus:bg-white text-black font-bold rounded-xl outline-none transition-all placeholder:text-slate-500 text-[14px]";
  const labelClass = "text-[12px] font-black text-slate-700 uppercase ml-1 mb-1.5 block tracking-wider";
  const requiredStar = <span className="text-red-600 ml-1 font-bold">*</span>;

  const StepTracker = () => (
    <div className="flex items-center justify-between mb-6 max-w-[280px] mx-auto">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
            currentStep >= step ? "bg-blue-700 text-white shadow-md scale-105" : "bg-slate-200 text-slate-400"
          }`}>
            {step}
          </div>
          {step < 3 && (
            <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ${
              currentStep > step ? "bg-blue-700" : "bg-slate-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );


if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center p-6 text-black">
        <div className="max-w-sm w-full bg-white rounded-[28px] p-8 shadow-sm text-center border border-slate-100">
          <div className="text-emerald-600 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-1">Application Sent</h1>
          
          {/* Full Name Display */}
          <div className="mb-4">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Registrant</p>
            <p className="text-emerald-600 font-bold text-lg leading-tight uppercase">
              {formData.firstName} {formData.middleName} {formData.surname} {!noSuffix && formData.suffix ? formData.suffix : ""}
            </p>
          </div>

          <p className="text-slate-600 mb-4 font-bold text-[14px]">
            Your certificate is on the way!
          </p>
          
          <div className="pt-4 border-t border-slate-50">
            <p className="text-slate-500 mb-1 font-bold text-[12px]">
              For any concerns, contact us at:
            </p>
            <p className="text-emerald-600 font-bold text-[13px]">
              records.rmmo@gmail.com
            </p>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-[12px] hover:bg-slate-200 transition-all uppercase"
          >
            Done
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-12 text-black font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 text-center mb-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
          <h2 className="text-xl font-bold tracking-tight">RMMO Application for Completion</h2>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        
        {/* SCREEN 1: INTRODUCTION */}
        {!hasStarted && !showPrivacy && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[24px] p-6 md:p-10 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Introduction</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed text-[14px] font-bold">
                <p>
                  This application form collects basic information regarding your training and completion journey at the Roxasian Moments Multimedia Organization (RMMO). We are committed to protecting your data privacy; the information provided will be used solely to record, verify, and certify your credentials to facilitate the issuance of your Certificate of Completion.
                </p>
                <div className="bg-blue-50 p-5 rounded-xl border-l-4 border-blue-700">
                  <p className="text-blue-900 font-bold italic text-[13px]">
                    Note: Most of your data is deleted once your certificate is released. We only keep your Name and Graduation Year for future verification.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleGoToPrivacy} 
                className="cursor-pointer mt-8 w-full py-4 bg-blue-700 text-white rounded-[20px] font-bold text-lg hover:bg-blue-800 transition-all"
              >
                GET STARTED
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: PRIVACY CONSENT */}
        {!hasStarted && showPrivacy && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-white rounded-[24px] p-6 md:p-10 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Privacy Consent</h2>
              <div className="space-y-4 text-slate-700 leading-relaxed font-bold text-[14px]">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="mb-4">
                    By proceeding, you authorize the <b>RMMO Advisory Council</b> to collect and process the following information:
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-blue-700 uppercase block mb-1">Personal Details</span>
                      <p className="text-[12px] text-slate-600 leading-tight font-bold">Full Name, Pronouns, Birthday, and Email Address.</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-amber-600 uppercase block mb-1">Academic Info</span>
                      <p className="text-[12px] text-slate-600 leading-tight font-bold">Grade, Section, Strand, and Graduation Year.</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-emerald-600 uppercase block mb-1">Service History</span>
                      <p className="text-[12px] text-slate-600 leading-tight font-bold">Training dates and positions held within RMMO.</p>
                    </div>
                  </div>

                  <p className="mb-3 text-slate-900 font-bold">How we handle your information:</p>
                  <div className="text-slate-600 space-y-1.5 text-[13px]">
                    <ul className="list-disc ml-5 space-y-1.5">
                      <li className="list-item"><b>Reviewing your form:</b> We will save your full details for a short time so the <b>RMMO Advisory Council</b> can check your information and generate your certificate.</li>
                      <li className="list-item"><b>Generating your certificate:</b> Once we confirm everything is correct, we will release your official Certificate of Completion.</li>
                      <li className="list-item"><b>Deleting private info:</b> Once your certificate is released, we will <b>delete</b> your private details (like your email and birthday) from our main records.</li>
                      <li className="list-item"><b>What we keep:</b> We will only keep your <b>Name and Graduation Year</b> in our verification system in this portal.</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-5 bg-blue-50 rounded-xl border-2 border-blue-200 flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="privacyCheck" 
                  className="cursor-pointer mt-1 w-5 h-5 accent-blue-700" 
                  checked={privacyAgreed} 
                  onChange={(e) => setPrivacyAgreed(e.target.checked)} 
                />
                <label htmlFor="privacyCheck" className="cursor-pointer text-[13px] text-slate-900 font-bold leading-relaxed select-none">
                  I agree to the terms of data collection and understand how my information will be processed and stored.
                </label>
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={!privacyAgreed}
                  onClick={handleStart} 
                  className="cursor-pointer mt-8 flex-[2] py-4 bg-blue-700 text-white rounded-[20px] font-bold text-lg hover:bg-blue-800 transition-all disabled:opacity-40"
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEPPER FORM */}
        {hasStarted && (
          <>
            <StepTracker />
            
            {currentStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <section className="bg-white rounded-[24px] p-6 md:p-8 border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-1 h-6 bg-blue-700 rounded-full"></span> Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                      <div className="md:col-span-4">
                          <label className={labelClass}>Given Name{requiredStar}</label>
                          <input required className={inputClass} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="md:col-span-2">
                          <label className={labelClass}>M.I.{requiredStar}</label>
                          <input required maxLength={2} className={inputClass} value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="md:col-span-4">
                          <label className={labelClass}>Surname{requiredStar}</label>
                          <input required className={inputClass} value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Suffix</label>
                        <select 
                          disabled={noSuffix} 
                          className={`${inputClass} disabled:opacity-30`} 
                          value={formData.suffix} 
                          onChange={e => setFormData({...formData, suffix: e.target.value})}
                        >
                          <option value=""></option>
                          <option value="JR">JR</option>
                          <option value="III">III</option>
                          <option value="IV">IV</option>
                          <option value="V">V</option>
                          <option value="SR">SR</option>
                        </select>
                        <div className="flex items-center gap-2 mt-2 ml-1">
                          <input 
                            type="checkbox" 
                            id="nosuffix" 
                            checked={noSuffix} 
                            onChange={(e) => {
                              setNoSuffix(e.target.checked); 
                              if(e.target.checked) setFormData({...formData, suffix: ""})
                            }} 
                            className="cursor-pointer w-4 h-4 accent-blue-700" 
                          />
                          <label htmlFor="nosuffix" className="cursor-pointer text-[10px] font-black text-slate-500 uppercase">
                            No Suffix
                          </label>
                        </div>
                      </div>

                      <div className="md:col-span-4">
                        <label className={labelClass}>Pronouns{requiredStar}</label>
                        <select required className={`${inputClass} cursor-pointer`} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                          <option value="HIM">HIM</option>
                          <option value="HER">HER</option>
                          <option value="PREFER NOT TO SAY">PREFER NOT TO SAY</option>
                        </select>
                      </div>

                      <div className="md:col-span-4">
                        <label className={labelClass}>Date of Birth{requiredStar}</label>
                        <input 
                        type="date" 
                        required 
                        className={`${inputClass} cursor-pointer`} 
                        value={formData.birthday}
                        onChange={e => setFormData({...formData, birthday: e.target.value})} 
                        />
                      </div>
                      <div className="md:col-span-4"><label className={labelClass}>Email Address{requiredStar}</label>
                        <input type="email" required className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                  </div>
                </section>
                <button type="submit" className="cursor-pointer w-full bg-blue-700 text-white py-4 rounded-[20px] font-bold text-lg shadow-lg hover:bg-blue-800 transition-all">NEXT</button>
              </form>
            )}

            {currentStep === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <section className="bg-white rounded-[24px] p-6 md:p-8 border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3"><span className="w-1 h-6 bg-amber-500 rounded-full"></span> Academic Records</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className={labelClass}>Grade & Section{requiredStar}</label><input required className={inputClass} value={formData.gradeLevelSection} onChange={e => setFormData({...formData, gradeLevelSection: e.target.value.toUpperCase()})} /></div>
                    <div><label className={labelClass}>Academic Strand{requiredStar}</label>
                      <select required className={`${inputClass} cursor-pointer`} value={formData.strand} onChange={e => setFormData({...formData, strand: e.target.value})}>
                        <option>TVL-ICT</option>
                        <option>STEM</option>
                        <option>ABM</option>
                        <option>HUMSS</option>
                        <option>GAS</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>School Year{requiredStar}</label>
                      <select 
                        required 
                        className={inputClass} 
                        value={formData.schoolYearGraduation} 
                        onChange={e => setFormData({...formData, schoolYearGraduation: e.target.value})}
                      >
                        <option value="">Select School Year</option>
                        <option value="2025-2026">2025-2026</option>
                      </select>
                    </div>
                  </div>
                </section>
                <div className="flex gap-3">
                  <button type="button" onClick={prevStep} className="cursor-pointer flex-1 py-4 bg-white text-slate-500 border border-slate-200 rounded-[20px] font-bold text-lg">BACK</button>
                  <button type="submit" className="cursor-pointer flex-[2] bg-blue-700 text-white py-4 rounded-[20px] font-bold text-lg shadow-lg hover:bg-blue-800 transition-all">NEXT</button>
                </div>
              </form>
            )}

            {currentStep === 3 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <section className="bg-white rounded-[24px] p-6 md:p-8 border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3"><span className="w-1 h-6 bg-emerald-500 rounded-full"></span> RMMO Service History</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className={labelClass}>Service Started{requiredStar}</label><input type="date" required className={`${inputClass} cursor-pointer`} value={formData.dateStarted} onChange={e => setFormData({...formData, dateStarted: e.target.value})} /></div>
                    <div><label className={labelClass}>Service Ended{requiredStar}</label><input type="date" required className={`${inputClass} cursor-pointer`} value={formData.dateEnded}  onChange={e => setFormData({...formData, dateEnded: e.target.value})} /></div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Position Title or Role and Committee Held{requiredStar}</label>
                      <input 
                        required 
                        placeholder="e.g. Chairman, TECHNICAL WORKING GROUP COMMITTEE" 
                        className={inputClass} 
                        value={formData.positionAssigned} 
                        onChange={e => setFormData({...formData, positionAssigned: e.target.value.toUpperCase()})} 
                      />
                    </div>
                  </div>
                </section>
                <div className="flex gap-3">
                  <button type="button" onClick={prevStep} className="cursor-pointer flex-1 py-4 bg-white text-slate-500 border border-slate-200 rounded-[20px] font-bold text-lg">BACK</button>
                  <button type="submit" className="cursor-pointer flex-[2] bg-blue-700 text-white py-4 rounded-[20px] font-bold text-lg shadow-lg hover:bg-blue-800 transition-all">REVIEW DETAILS</button>
                </div>
              </form>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-white rounded-[24px] p-6 md:p-8 border-2 border-blue-100 shadow-sm">
                  <h2 className="text-xl font-black text-slate-900 mb-1">Review Application</h2>
                  <p className="text-slate-500 mb-5 font-bold text-[13px]">Please double-check all your information before final certification.</p>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[11px] font-black text-blue-700 uppercase tracking-widest mb-3 border-b pb-1.5">Personal Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Full Name</span>
                          <span className="font-bold text-slate-900 text-[14px]">{formData.firstName} {formData.middleName} {formData.surname} {noSuffix ? "" : formData.suffix}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Pronouns</span>
                          <span className="font-bold text-slate-900 text-[14px]">{formData.gender}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Date of Birth</span>
                          <span className="font-bold text-slate-900 text-[14px]">{formatDate(formData.birthday)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Email Address</span>
                          <span className="font-bold text-slate-900 text-[14px]">{formData.email}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-3 border-b pb-1.5">Academic Records</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Grade & Section</span>
                          <span className="font-bold text-slate-900 text-[14px]">{formData.gradeLevelSection}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Academic Strand</span>
                          <span className="font-bold text-slate-900 text-[14px]">{formData.strand}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">School Year</span>
                          <span className="font-bold text-slate-900 text-[14px]">{formData.schoolYearGraduation}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-3 border-b pb-1.5">RMMO Service History</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Service Period</span>
                          <span className="font-bold text-slate-900 text-[14px]">{formatDate(formData.dateStarted)} to {formatDate(formData.dateEnded)}</span>
                        </div>
                        <div className="md:col-span-2 flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Position & Committee</span>
                          <span className="font-bold text-slate-900 text-[14px]">{formData.positionAssigned}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#EEF1F9] rounded-[20px] border-2 border-blue-200 flex items-start gap-3">
                  <input type="checkbox" id="certify" className="cursor-pointer mt-1 w-5 h-5 accent-blue-700" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} />
                  <label htmlFor="certify" className="cursor-pointer text-[13px] text-slate-900 font-bold leading-relaxed select-none">
                    I CERTIFY that all information provided is true and correct. I understand the terms of application.
                  </label>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <button onClick={prevStep} className="cursor-pointer flex-1 py-4 bg-white text-slate-500 border border-slate-200 rounded-[20px] font-bold text-lg hover:bg-slate-50 transition-all">BACK TO EDIT</button>
                  <button disabled={!isAgreed || loading} onClick={handleOpenConfirm} className="cursor-pointer flex-[2] bg-blue-700 text-white py-4 rounded-[20px] font-bold text-lg shadow-lg hover:bg-blue-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {loading ? "PROCESSING..." : "SUBMIT APPLICATION"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <ActionModal 
        isOpen={showConfirmModal}
        title="You are about to submit your Application"
        message={`Any misinformation provided in this form will result in rejection and disqualification of your application.\n\nWe reserve the right to verify the accuracy of the information provided, and any falsification will lead to immediate dismissal from consideration.\n\nBy submitting this form, you agree to the terms and understand that any misrepresentation may have legal consequences.`}
        confirmText="I Certify & Submit"
        onConfirm={handleFinalSubmit}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={loading}
      />
    </div>
  );
}
