"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveRegistrant } from "@/lib/actions";

// Dashboard-Style Action Modal
const ActionModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", isLoading, isEnglish }: any) => {
  if (!isOpen) return null;

  // Modal Translations (English matches your original exactly)
  const modalTitle = isEnglish ? "You are about to submit your Application" : "Ipapasa mo na ang iyong Application";
  const modalMessage = isEnglish 
    ? message 
    : `Ang anumang maling impormasyon sa form na ito ay magreresulta sa pagtanggi at diskwalipikasyon ng iyong aplikasyon.\n\nInirereserba namin ang karapatang i-verify ang kawastuhan ng impormasyon, at ang anumang palsipikasyon ay hahantong sa agarang pagtatanggal sa konsiderasyon.\n\nSa pagsusumite ng form na ito, sumasang-ayon ka sa mga tuntunin at nauunawaan na ang anumang maling representasyon ay maaaring may legal na kahihinatnan.`;
  const modalConfirm = isEnglish ? confirmText : "Pinatutunayan at Ipapasa";
  const modalCancel = isEnglish ? "Cancel" : "I-cancel";

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-[24px] p-6 max-w-[380px] w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-[20px] font-bold text-slate-900 mb-3">{modalTitle}</h3>
        <p className="text-[13px] font-bold text-slate-600 mb-6 leading-relaxed whitespace-pre-line">{modalMessage}</p>
        <div className="flex justify-end gap-3">
          <button 
            disabled={isLoading} 
            onClick={onCancel} 
            className="cursor-pointer px-4 py-2 text-[13px] font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          >
            {modalCancel}
          </button>
          <button 
            disabled={isLoading} 
            onClick={onConfirm} 
            className="cursor-pointer px-5 py-2 text-[13px] font-bold bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (isEnglish ? "Submitting..." : "Ipinapasa...") : modalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GradApplicantsPage() {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState(false); 
  const [showPrivacy, setShowPrivacy] = useState(false); 
  const [currentStep, setCurrentStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false); 
  const [privacyAgreed, setPrivacyAgreed] = useState(false); 
  const [noSuffix, setNoSuffix] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false); // Default to Tagalog

  const [formData, setFormData] = useState({
    surname: "", 
    firstName: "", 
    middleName: "", 
    suffix: "",
    noMiddleName: false,
    noSuffix: false,     
    gender: "HIM", 
    birthday: "", 
    email: "", 
    gradeLevelSection: "",
    strand: "TVL-ICT", 
    schoolYearGraduation: "",
    dateStarted: "", 
    dateEnded: "", 
    positionAssigned: ""
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
      const result = await saveRegistrant({ ...formData });
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

  const StepTracker = ({ currentStep = 1 }) => {
    const steps = isEnglish 
      ? ["Personal Data", "Academic Records", "Service History"]
      : ["Personal Data", "Academic Records", "Service History"];

    return (
      <div className="w-full max-w-[360px] mx-auto mb-20 px-2">
        <div className="relative flex items-center justify-between">
          <div className="absolute top-[18px] left-0 w-full h-[2px] bg-gray-200 z-0" />
          <div 
            className="absolute top-[18px] left-0 h-[1px] bg-blue-600 transition-all duration-500 z-0"
            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
          />
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep >= stepNumber;
            return (
              <div key={stepNumber} className="relative flex flex-col items-center z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] transition-all duration-300 border-2 ${isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-400 border-gray-200"}`}>
                  {stepNumber}
                </div>
                <div className="absolute top-11 w-[75px] text-center leading-[0.9]">
                  <span className={`text-[9px] font-black uppercase transition-colors duration-300 ${isActive ? "text-blue-700" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center p-6 text-black">
        <div className="max-w-lg w-full bg-white rounded-[32px] p-10 md:p-12 shadow-sm text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-blue-500 mb-1">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-[26px] font-bold text-slate-900 mb-4 tracking-tight">
            {isEnglish ? "Application Submitted" : "Naipasa na ang Application"}
          </h1>
          <div className="space-y-4 mb-10">
            <p className="text-slate-600 font-bold text-[16px]">
              {isEnglish ? "We have received your details," : "Natanggap na namin ang iyong mga detalye,"}<br />
              <span className="text-blue-600">
                {formData.firstName} {formData.middleName} {formData.surname}{!noSuffix && formData.suffix ? ` ${formData.suffix}` : ""}
              </span>!
            </p>
            <p className="text-slate-500 font-bold text-[14px] max-w-xs mx-auto">
              {isEnglish 
                ? "We will notify you once we have verified your information and processed your certificate." 
                : "Aabisuhan ka namin kapag na-verify na ang iyong impormasyon at naproseso na ang iyong sertipiko."}
            </p>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <div>
              <p className="text-slate-400 font-bold text-[12px] tracking-normal mb-1">
                {isEnglish ? "For any concerns, please email us at:" : "Para sa mga katanungan, mag-email sa:"}
              </p>
              <p className="text-slate-700 font-bold text-[13px]">records.rmmo@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-12 text-black font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 text-center mb-4 flex justify-between items-center sticky top-0 z-50">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">RMMO Application for Completion</h2>
          {/* LANGUAGE SWITCH TOGGLE */}
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
            <button 
              onClick={() => setIsEnglish(false)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${!isEnglish ? 'bg-blue-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              TAGALOG
            </button>
            <button 
              onClick={() => setIsEnglish(true)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black transition-all ${isEnglish ? 'bg-blue-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ENGLISH
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {!hasStarted && !showPrivacy && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-[24px] p-6 md:p-10 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
                {isEnglish ? "Introduction" : "Panimula"}
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed text-[14px] font-bold">
                <p>
                  {isEnglish 
                    ? "This application form collects basic information regarding your training and completion journey at the Roxasian Moments Multimedia Organization (RMMO). We are committed to protecting your data privacy; the information provided will be used solely to record, verify, and certify your credentials to facilitate the issuance of your Certificate of Completion."
                    : "Ang application form na ito ay nangongolekta ng pangunahing impormasyon tungkol sa iyong training at completion journey sa Roxasian Moments Multimedia Organization (RMMO). Kami ay nakatuon sa pagprotekta ng iyong data privacy; ang impormasyong ibibigay ay gagamitin lamang sa pagtatala, pag-verify, at pagpapatunay ng iyong mga kredensyal para sa pag-isyu ng iyong Certificate of Completion."}
                </p>
                <div className="bg-blue-50 p-5 rounded-xl border-l-4 border-blue-700">
                  <p className="text-blue-900 font-bold italic text-[13px]">
                    {isEnglish 
                      ? "Note: Most of your data will be deleted once your certificate is released. We only keep your Name and Graduation Year for future verification."
                      : "Paunawa: Ang iyong data ay buburahin kapag naibigay na ang iyong Certificate of Completion. Pananatilihin lamang namin ang iyong Pangalan at Taon ng Pagtatapos para sa verification system ng portal na ito."}
                  </p>
                </div>
                <p className="text-red-600">
                  {isEnglish 
                    ? "Reminder: Avoid double submission to prevent double records."
                    : "Paalala: Iwasan ang magdoble ng pagpasa ng Application Form. Para hindi magdoble ang records."}
                </p>                
              </div>
              <button onClick={handleGoToPrivacy} className="cursor-pointer mt-8 w-full py-4 bg-blue-700 text-white rounded-[20px] font-bold text-lg hover:bg-blue-800 transition-all">
                GET STARTED
              </button>
            </div>
          </div>
        )}

        {!hasStarted && showPrivacy && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-white rounded-[24px] p-6 md:p-10 border border-slate-100 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter">
                {isEnglish ? "Privacy Consent" : "Pahintulot sa Privacy"}
              </h2>
              <div className="space-y-4 text-slate-700 leading-relaxed font-bold text-[14px]">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="mb-4">
                    {isEnglish 
                      ? <>By proceeding, you authorize the <b>RMMO Advisory Council</b> to collect and process the following information:</>
                      : <>Sa pagpapatuloy, pinahihintulutan mo ang <b>RMMO Advisory Council</b> na kolektahin at iproseso ang mga sumusunod na impormasyon:</>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-blue-700 uppercase block mb-1">Personal Details</span>
                      <p className="text-[12px] text-slate-600 leading-tight font-bold">{isEnglish ? "Full Name, Pronouns, Birthday, and Email Address." : "Buong Pangalan, Pronouns, Kaarawan, at Email Address."}</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-amber-600 uppercase block mb-1">Academic Info</span>
                      <p className="text-[12px] text-slate-600 leading-tight font-bold">{isEnglish ? "Grade, Section, Strand, and Graduation Year." : "Baitang, Seksyon, Strand, at Taon ng Pagtatapos."}</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-emerald-600 uppercase block mb-1">Service History</span>
                      <p className="text-[12px] text-slate-600 leading-tight font-bold">{isEnglish ? "Training dates and positions held within RMMO." : "Petsa ng training at mga posisyong hinawakan sa RMMO."}</p>
                    </div>
                  </div>
                  <p className="mb-3 text-slate-900 font-bold">{isEnglish ? "How we handle your information:" : "Paano namin pinangangalagaan ang iyong impormasyon:"}</p>
                  <div className="text-slate-600 space-y-1.5 text-[13px]">
                    <ul className="list-disc ml-5 space-y-1.5">
                      {isEnglish ? (
                        <>
                          <li><b>Reviewing your form:</b> We will save your full details for a short time so the <b>RMMO Advisory Council</b> can check your information and generate your certificate.</li>
                          <li><b>Generating your certificate:</b> Once we confirm everything is correct, we will release your official Certificate of Completion.</li>
                          <li><b>Deleting private info:</b> Once your certificate is released, we will <b>delete</b> your private details (like your email and birthday) from our main records.</li>
                          <li><b>What we keep:</b> We will only keep your <b>Name and Graduation Year</b> in our verification system in this portal.</li>
                        </>
                      ) : (
                        <>
                          <li><b>Pagsusuri ng iyong form:</b> Panandalian naming ise-save ang iyong mga personal information upang masuri ng <b>RMMO Advisory Council</b> ang iyong impormasyon bago makagawa ng sertipiko.</li>
                          <li><b>Pagbuo ng iyong sertipiko:</b> Kapag nakumpirma na ang lahat ay tama, ilalabas namin ang iyong opisyal na Certificate of Completion.</li>
                          <li><b>Pagbura ng pribadong info:</b> Kapag nailabas na ang Certificates, aming <b>buburahin</b> ang iyong mga private details (tulad ng email at kaarawan) mula sa aming main records.</li>
                          <li><b>Mga details na pananatilihin:</b> Ang iyong <b>Pangalan at Taon ng Pagtatapos</b> lamang ang aming pananatilihin para sa verification system ng portal na ito.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-5 bg-blue-50 rounded-xl border-2 border-blue-200 flex items-start gap-3">
                <input type="checkbox" id="privacyCheck" className="cursor-pointer mt-1 w-5 h-5 accent-blue-700" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} />
                <label htmlFor="privacyCheck" className="cursor-pointer text-[13px] text-slate-900 font-bold leading-relaxed select-none">
                  {isEnglish 
                    ? "I agree to the terms of data collection and understand how my information will be processed and stored."
                    : "Sumasang-ayon ako sa mga tuntunin ng koleksyon ng data at nauunawaan ko kung paano ipoproseso at itatabi ang aking impormasyon."}
                </label>
              </div>
              <button disabled={!privacyAgreed} onClick={handleStart} className="cursor-pointer mt-8 w-full py-4 bg-blue-700 text-white rounded-[20px] font-bold text-lg hover:bg-blue-800 transition-all disabled:opacity-40">
                NEXT
              </button>
            </div>
          </div>
        )}

        {hasStarted && (
          <>
            <StepTracker currentStep={currentStep} />
            {currentStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <section className="bg-white rounded-[24px] p-6 md:p-10 border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3"><span className="w-1 h-6 bg-blue-700 rounded-full"></span> Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4">
                      <label className={labelClass}>Given Names{requiredStar} <span className="text-[10px] text-slate-400 font-normal">(Mga Pangalan)</span></label>
                      <input required className={inputClass} value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>M.I. <span className="text-[10px] text-slate-400 font-normal">(G.P.)</span></label>
                      <input maxLength={2} className={`${inputClass} ${!formData.middleName && "placeholder:font-normal"}`} value={formData.middleName} disabled={formData.noMiddleName} placeholder={formData.noMiddleName ? "N/A" : ""} onChange={e => setFormData({...formData, middleName: e.target.value.toUpperCase()})} />
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <input type="checkbox" id="nomiddle" checked={formData.noMiddleName} onChange={(e) => setFormData({...formData, noMiddleName: e.target.checked, middleName: e.target.checked ? "" : formData.middleName})} className="cursor-pointer w-4 h-4 accent-blue-700" />
                        <label htmlFor="nomiddle" className="cursor-pointer text-[9px] leading-tight font-black text-slate-500 uppercase">No Middle Initial <br/> <span className="text-slate-400 font-medium">(Walang Gitnang Inisyal)</span></label>
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <label className={labelClass}>Surname{requiredStar} <span className="text-[10px] text-slate-400 font-normal">(Apelyido)</span></label>
                      <input required className={inputClass} value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Suffix</label>
                      <select disabled={noSuffix} className={`${inputClass} disabled:opacity-30`} value={formData.suffix} onChange={e => setFormData({...formData, suffix: e.target.value})}>
                        <option value=""></option><option value="JR">JR</option><option value="III">III</option><option value="IV">IV</option><option value="V">V</option><option value="SR">SR</option>
                      </select>
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <input type="checkbox" id="nosuffix" checked={noSuffix} onChange={(e) => { setNoSuffix(e.target.checked); if(e.target.checked) setFormData({...formData, suffix: ""}) }} className="cursor-pointer w-4 h-4 accent-blue-700" />
                        <label htmlFor="nosuffix" className="cursor-pointer text-[9px] leading-tight font-black text-slate-500 uppercase">No Suffix <br/> <span className="text-slate-400 font-medium">(Walang Karugtong)</span></label>
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <label className={labelClass}>Pronouns{requiredStar}</label>
                      <select required className={`${inputClass} cursor-pointer`} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="HIM">HIM</option><option value="HER">HER</option><option value="PREFER NOT TO SAY">PREFER NOT TO SAY</option>
                      </select>
                    </div>
                    <div className="md:col-span-4">
                      <label className={labelClass}>Date of Birth{requiredStar}</label>
                      <input type="date" required className={`${inputClass} cursor-pointer`} value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} />
                    </div>
                    <div className="md:col-span-4">
                      <label className={labelClass}>Email Address{requiredStar}</label>
                      <input type="email" required className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                </section>
                <button type="submit" className="cursor-pointer w-full bg-blue-700 text-white py-4 rounded-[20px] font-bold text-lg hover:bg-blue-800 transition-all">NEXT</button>
              </form>
            )}

            {currentStep === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <section className="bg-white rounded-[24px] p-6 md:p-10 border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3"><span className="w-1 h-6 bg-amber-500 rounded-full"></span> Academic Records</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className={labelClass}>Grade & Section{requiredStar}</label><input required className={inputClass} value={formData.gradeLevelSection} onChange={e => setFormData({...formData, gradeLevelSection: e.target.value.toUpperCase()})} /></div>
                    <div><label className={labelClass}>Academic Strand{requiredStar}</label>
                      <select required className={`${inputClass} cursor-pointer`} value={formData.strand} onChange={e => setFormData({...formData, strand: e.target.value})}>
                        <option>TVL-ICT</option><option>STEM</option><option>ABM</option><option>HUMSS</option><option>GAS</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>School Year{requiredStar}</label>
                      <select required className={inputClass} value={formData.schoolYearGraduation} onChange={e => setFormData({...formData, schoolYearGraduation: e.target.value})}>
                        <option value="">Select School Year</option><option value="2025-2026">2025-2026</option>
                      </select>
                    </div>
                  </div>
                </section>
                <div className="flex gap-3">
                  <button type="button" onClick={prevStep} className="cursor-pointer flex-1 py-4 bg-white text-slate-500 border border-slate-200 rounded-[20px] font-bold text-lg">BACK</button>
                  <button type="submit" className="cursor-pointer flex-[2] bg-blue-700 text-white py-4 rounded-[20px] font-bold text-lg hover:bg-blue-800 transition-all">NEXT</button>
                </div>
              </form>
            )}

            {currentStep === 3 && (
              <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <section className="bg-white rounded-[24px] p-6 md:p-10 border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3"><span className="w-1 h-6 bg-emerald-500 rounded-full"></span> RMMO Service History</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Service Started{requiredStar}</label><input type="date" required className={`${inputClass} cursor-pointer`} value={formData.dateStarted} onChange={e => setFormData({...formData, dateStarted: e.target.value})} /></div>
                    <div><label className={labelClass}>Service Ended{requiredStar}</label><input type="date" required className={`${inputClass} cursor-pointer`} value={formData.dateEnded}  onChange={e => setFormData({...formData, dateEnded: e.target.value})} /></div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Position Title or Role and Committee Held{requiredStar}</label>
                      <input required placeholder="e.g. Chairman, TECHNICAL WORKING GROUP COMMITTEE" className={inputClass} value={formData.positionAssigned} onChange={e => setFormData({...formData, positionAssigned: e.target.value.toUpperCase()})} />
                    </div>
                  </div>
                </section>
                <div className="flex gap-3">
                  <button type="button" onClick={prevStep} className="cursor-pointer flex-1 py-4 bg-white text-slate-500 border border-slate-200 rounded-[20px] font-bold text-lg">BACK</button>
                  <button type="submit" className="cursor-pointer flex-[2] bg-blue-700 text-white py-4 rounded-[20px] font-bold text-lg hover:bg-blue-800 transition-all">REVIEW DETAILS</button>
                </div>
              </form>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-white rounded-[24px] p-6 md:p-10 border-2 border-blue-100 shadow-sm">
                  <h2 className="text-xl font-black text-slate-900 mb-1">{isEnglish ? "Review Application" : "Review Application"}</h2>
                  <p className="text-slate-500 mb-5 font-bold text-[13px]">{isEnglish ? "Please double-check all your information before submitting." : "Suriin nang mabuti ang iyong impormasyon bago ang ipasa."}</p>
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-[11px] font-black text-blue-700 uppercase tracking-widest mb-3 border-b pb-1.5">Personal Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Full Name</span><span className="font-bold text-slate-900 text-[14px]">{formData.firstName} {formData.middleName} {formData.surname} {noSuffix ? "" : formData.suffix}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Pronouns</span><span className="font-bold text-slate-900 text-[14px]">{formData.gender}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Date of Birth</span><span className="font-bold text-slate-900 text-[14px]">{formatDate(formData.birthday)}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Email Address</span><span className="font-bold text-slate-900 text-[14px]">{formData.email}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-3 border-b pb-1.5">Academic Records</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Grade & Section</span><span className="font-bold text-slate-900 text-[14px]">{formData.gradeLevelSection}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Academic Strand</span><span className="font-bold text-slate-900 text-[14px]">{formData.strand}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">School Year</span><span className="font-bold text-slate-900 text-[14px]">{formData.schoolYearGraduation}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-3 border-b pb-1.5">RMMO Service History</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Service Period</span><span className="font-bold text-slate-900 text-[14px]">{formatDate(formData.dateStarted)} to {formatDate(formData.dateEnded)}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase">Position & Committee</span><span className="font-bold text-slate-900 text-[14px]">{formData.positionAssigned}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-[#EEF1F9] rounded-[20px] border-2 border-blue-200 flex items-start gap-3">
                  <input type="checkbox" id="certify" className="cursor-pointer mt-1 w-5 h-5 accent-blue-700" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} />
                  <label htmlFor="certify" className="cursor-pointer text-[13px] text-slate-900 font-bold leading-relaxed select-none">
                    {isEnglish 
                      ? "I CERTIFY that all information provided is true and correct. I understand the terms of application."
                      : "PINATUTUNAYAN KO na ang lahat ng impormasyong ibinigay ay totoo at tama. Nauunawaan ko ang mga tuntunin ng aplikasyon."}
                  </label>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <button onClick={prevStep} className="cursor-pointer flex-1 py-4 bg-white text-slate-500 border border-slate-200 rounded-[20px] font-bold text-lg hover:bg-slate-50 transition-all">BACK TO EDIT</button>
                  <button disabled={!isAgreed || loading} onClick={handleOpenConfirm} className="cursor-pointer flex-[2] bg-blue-700 text-white py-4 rounded-[20px] font-bold text-lg shadow-lg hover:bg-blue-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {loading ? (isEnglish ? "PROCESSING..." : "IPINAPROSESO...") : "SUBMIT APPLICATION"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <ActionModal 
        isOpen={showConfirmModal}
        isEnglish={isEnglish}
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
