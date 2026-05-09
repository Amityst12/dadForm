'use client';

import { useRef, useState, useCallback } from 'react';
import SignaturePad, { type SignaturePadHandle } from './SignaturePad';

const today = () => new Date().toISOString().split('T')[0];

interface FormState {
  plaNum: string;
  docDate: string;
  fullName: string;
  idNum: string;
  address: string;
  devices: string[];
  computerType: 'personal' | 'institutional' | '';
  presence: 'no-witnesses' | 'no-self' | '';
  remarks: string;
  sigDate: string;
  editorName: string;
  editorBadgeNum: string;
  sigEditorDate: string;
}

function SectionCard({
  num,
  title,
  children,
}: {
  num: number | string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-badge">{num}</span>
        <span className="text-sm font-bold text-navy">{title}</span>
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col sm:flex-row gap-3">{children}</div>;
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 ${className}`}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

export default function ConsentForm() {
  const sigRef       = useRef<SignaturePadHandle>(null);
  const sigEditorRef = useRef<SignaturePadHandle>(null);
  const [printSigs, setPrintSigs] = useState<{ owner: string; editor: string }>({
    owner: '',
    editor: '',
  });

  const [form, setForm] = useState<FormState>({
    plaNum: '',
    docDate: today(),
    fullName: '',
    idNum: '',
    address: '',
    devices: Array(8).fill(''),
    computerType: '',
    presence: '',
    remarks: '',
    sigDate: today(),
    editorName: '',
    editorBadgeNum: '',
    sigEditorDate: today(),
  });

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  const setDevice = useCallback((i: number, val: string) =>
    setForm((prev) => {
      const devices = [...prev.devices];
      devices[i] = val;
      return { ...prev, devices };
    }), []);

  const resetForm = () => {
    if (!confirm('האם לאפס את כל הטופס?')) return;
    setForm({
      plaNum: '',
      docDate: today(),
      fullName: '',
      idNum: '',
      address: '',
      devices: Array(8).fill(''),
      computerType: '',
      presence: '',
      remarks: '',
      sigDate: today(),
      editorName: '',
      editorBadgeNum: '',
      sigEditorDate: today(),
    });
    sigRef.current?.clear();
    sigEditorRef.current?.clear();
    setPrintSigs({ owner: '', editor: '' });
  };

  const handlePrint = () => {
    setPrintSigs({
      owner:  sigRef.current?.toDataURL()       ?? '',
      editor: sigEditorRef.current?.toDataURL() ?? '',
    });
    setTimeout(() => window.print(), 60);
  };

  const handleSaveHTML = () => {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `הסכמה_${form.fullName || 'טופס'}_${form.docDate}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-[#e8ecf3]">

      {/* ══ HEADER ══ */}
      <header
        className="sticky top-0 z-50 no-print"
        style={{ background: '#1e3264' }}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <div className="text-white text-right">
            <div className="font-bold text-sm sm:text-base leading-tight">
              הסכמת בעל הרשאה לחיפוש בחומר מחשב
            </div>
            <div className="text-xs text-blue-200 mt-0.5">
              משטרת ישראל | נספח ט׳
            </div>
          </div>
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            ✡
          </div>
        </div>
      </header>

      {/* ══ TOP-BAR (פל"א / תאריך / יחידה) ══ */}
      <div className="top-bar sticky top-[68px] z-40 border-b border-gray-300 no-print" style={{ background: '#f7f8fa' }}>
        <div className="max-w-3xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {/* פל"א */}
          <div className="flex items-center gap-2 min-w-[130px]">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">מס׳ פל״א</label>
            <input
              className="form-input !py-1 !text-sm w-24 text-center"
              value={form.plaNum}
              onChange={(e) => set('plaNum', e.target.value)}
              placeholder="—"
            />
          </div>
          {/* שם היחידה */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">שם היחידה</label>
            <span className="text-sm font-bold text-navy bg-blue-50 border border-blue-200 rounded px-2 py-1">
              תחנת בת ים
            </span>
          </div>
          {/* תאריך */}
          <div className="flex items-center gap-2 mr-auto">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">תאריך</label>
            <input
              type="date"
              className="form-input !py-1 !text-sm w-36"
              value={form.docDate}
              onChange={(e) => set('docDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ══ PRINT HEADER (only in print) ══ */}
      <div className="hidden print:block print:mb-4">
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ background: '#1e3264' }}
        >
          <div className="text-white">
            <div className="font-bold text-base">הסכמת בעל הרשאה לחיפוש בחומר מחשב — נספח ט׳</div>
            <div className="text-xs mt-0.5">
              פל״א: {form.plaNum || '—'} | יחידה: תחנת בת ים | תאריך: {formatDate(form.docDate)}
            </div>
          </div>
          <div className="text-white text-3xl">✡</div>
        </div>
      </div>

      {/* ══ FORM BODY ══ */}
      <main className="page-container max-w-3xl mx-auto px-3 sm:px-4 py-5">

        {/* ── Section 1: Personal details ── */}
        <SectionCard num={1} title="בעל ההרשאה">
          <FieldRow>
            <Field label="שם מלא">
              <input
                className="form-input"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                placeholder="שם פרטי ושם משפחה"
              />
            </Field>
            <Field label="מספר זהות" className="sm:max-w-[160px]">
              <input
                className="form-input"
                value={form.idNum}
                onChange={(e) => set('idNum', e.target.value.replace(/\D/g, ''))}
                maxLength={9}
                placeholder="000000000"
                inputMode="numeric"
              />
            </Field>
          </FieldRow>
          <div className="mt-3">
            <Field label="כתובת מגורים">
              <input
                className="form-input"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="רחוב, מספר, עיר"
              />
            </Field>
          </div>
          <p className="legal-text mt-4 mb-3">
            מאשר בזאת למשטרת ישראל לחדור ולבצע חיפוש במחשב/חומר מחשב{' '}
            <em>(מחק המיותר)</em> שבשימושי, וזאת לצורך החקירה (פירוט המחשבים,
            חומרי המחשב והחשבונות בעניינים ניתנה ההסכמה בכל מקום בו הם נמצאים,
            לרבות מחוץ לישראל):
          </p>
          {/* Device grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-300 rounded-md overflow-hidden">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-2 border border-gray-200 px-2 py-1">
                <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}.</span>
                <input
                  className="flex-1 border-none outline-none text-sm bg-transparent py-1"
                  value={form.devices[i]}
                  onChange={(e) => setDevice(i, e.target.value)}
                  placeholder="פרט התקן / חומר מחשב"
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Section 2: Computer type ── */}
        <SectionCard num={2} title="הסכמת בעל ההרשאה במחשב">
          <div className="space-y-3">
            <label
              className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                form.computerType === 'personal'
                  ? 'border-navy bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="computerType"
                value="personal"
                checked={form.computerType === 'personal'}
                onChange={() => set('computerType', 'personal')}
                className="mt-0.5 accent-navy shrink-0"
              />
              <span className="legal-text">
                <strong>מחשב פרטי</strong> — הנני מצהיר כי המחשב הוא מחשבי
                הפרטי, ואני מורשה גישה ושימוש במחשב או בחלק המחשב שבו יתבצע
                החיפוש.
              </span>
            </label>
            <label
              className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                form.computerType === 'institutional'
                  ? 'border-navy bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="computerType"
                value="institutional"
                checked={form.computerType === 'institutional'}
                onChange={() => set('computerType', 'institutional')}
                className="mt-0.5 accent-navy shrink-0"
              />
              <span className="legal-text">
                <strong>מחשב מוסדי</strong> — הנני מצהיר כי המחשב הוא מחשב
                מוסדי, ואני מורשה גישה ושימוש במחשב או בחלק המחשב שבו יתבצע
                החיפוש.
              </span>
            </label>
          </div>
        </SectionCard>

        {/* ── Sections 3–6: Legal declarations (fixed text) ── */}
        <SectionCard num="3–6" title="הצהרות שהובהרו לבעל ההרשאה">
          <div className="space-y-3">
            {[
              {
                n: 3,
                text: 'הובהרה לי זכותי שלא להסכים לחיפוש במחשב בלא צו שיפוטי, או להסכים לחיפוש מחומרי המחשב בלבד, עצם הסירוב לא ייקרא לחובתי. כן הובהר לי כי אני רשאי לחזור בי מהסכמתי לחיפוש בכל עת ו/או להגבילו, וכי אין בחזרה מהסכמה כדי לפגוע בחוקיות הפעולות שנעשו עד לחזרה מהסכמה.',
              },
              {
                n: 4,
                text: 'הובהר לי כי החיפוש במחשב הינו בכלל החומר שנוצר או קיים במחשב או שנמנה לעיל, ובחומרי המחשב שנמנה לעיל, וכי משטרת ישראל עשויה להשתמש בכל אמצעי טכנולוגי שברשותה במהלך החיפוש.',
              },
              {
                n: 5,
                text: 'במקרה של הרשאה לחיפוש בחלק מחומרי המחשב: הובהר לי כי בשל מגבלות טכנולוגיות וצרכי החקירה, כלל חומרי המחשב יועתקו וייישמרו על-ידי המשטרה בנפרד מתיק החקירה, אולם הצפייה תהא רק בקבצים, בתיקיות או בסוגי הקבצים אליהם אני מרשה לעיין כמפורט לעיל בסעיף 1. למשטרת ישראל שמורה הזכות לפנות לבית-המשפט להתיר את העיון בקבצים נוספים, בהתאם להתקדמות החקירה.',
              },
              {
                n: 6,
                text: 'הובהרה לי זכותי שהחיפוש יתבצע בנוכחותי ובפני שני עדים בגירים שאינם שוטרים.',
              },
            ].map(({ n, text }) => (
              <div key={n} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-navy/10 text-navy text-xs font-bold flex items-center justify-center mt-0.5">
                  {n}
                </span>
                <p className="legal-text">{text}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Section 7: Presence ── */}
        <SectionCard num={7} title="נוכחות">
          <p className="legal-text mb-3">
            הנני מאשר למשטרה כי החיפוש במחשב ייערך{' '}
            <em>(סמן X באחת המתאימה):</em>
          </p>
          <div className="space-y-2">
            {[
              { value: 'no-witnesses' as const, label: 'ללא נוכחות עדים.' },
              { value: 'no-self' as const, label: 'ללא נוכחותי.' },
            ].map(({ value, label }) => (
              <label
                key={value}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  form.presence === value
                    ? 'border-navy bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="presence"
                  value={value}
                  checked={form.presence === value}
                  onChange={() => set('presence', value)}
                  className="accent-navy"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </SectionCard>

        {/* ── Section 8: Remarks ── */}
        <SectionCard num={8} title="הערות בעל ההרשאה לחומר המחשב">
          <textarea
            className="form-input resize-y min-h-[80px]"
            value={form.remarks}
            onChange={(e) => set('remarks', e.target.value)}
            placeholder="הערות..."
          />
        </SectionCard>

        {/* ── Signature section ── */}
        <SectionCard num="✍" title="חתימת בעל ההרשאה">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
              <label className="form-label mb-2">חתימה</label>
              <SignaturePad ref={sigRef} />
              <button
                type="button"
                onClick={() => sigRef.current?.clear()}
                className="no-print mt-2 text-xs text-gray-500 underline hover:text-navy"
              >
                נקה חתימה
              </button>
            </div>
            <div className="w-full sm:w-40">
              <label className="form-label">תאריך</label>
              <input
                type="date"
                className="form-input"
                value={form.sigDate}
                onChange={(e) => set('sigDate', e.target.value)}
              />
              <div className="mt-2 text-center text-sm font-medium text-navy">
                {formatDate(form.sigDate)}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Editor signature section ── */}
        <SectionCard num="✍" title="חתימת עורך המסמך">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="flex-1">
                  <label className="form-label">שם עורך המסמך</label>
                  <input
                    className="form-input"
                    value={form.editorName}
                    onChange={(e) => set('editorName', e.target.value)}
                    placeholder="שם פרטי ושם משפחה"
                  />
                </div>
                <div className="sm:w-36">
                  <label className="form-label">מספר אישי (מא)</label>
                  <input
                    className="form-input"
                    value={form.editorBadgeNum}
                    onChange={(e) => set('editorBadgeNum', e.target.value)}
                    placeholder="מספר אישי"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <label className="form-label mb-2">חתימה</label>
              <SignaturePad ref={sigEditorRef} />
              <button
                type="button"
                onClick={() => sigEditorRef.current?.clear()}
                className="no-print mt-2 text-xs text-gray-500 underline hover:text-navy"
              >
                נקה חתימה
              </button>
            </div>
            <div className="w-full sm:w-40">
              <label className="form-label">תאריך</label>
              <input
                type="date"
                className="form-input"
                value={form.sigEditorDate}
                onChange={(e) => set('sigEditorDate', e.target.value)}
              />
              <div className="mt-2 text-center text-sm font-medium text-navy">
                {formatDate(form.sigEditorDate)}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══ ACTION BUTTONS ══ */}
        <div className="no-print flex flex-wrap justify-center gap-3 mt-6 mb-8">
          <button
            type="button"
            onClick={handlePrint}
            className="btn-action text-white"
            style={{ background: '#2e7d32' }}
          >
            <span>🖨️</span>
            <span>הדפס / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleSaveHTML}
            className="btn-action text-white"
            style={{ background: '#7b4f00' }}
          >
            <span>💾</span>
            <span>שמור כ-HTML</span>
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="btn-action text-white"
            style={{ background: '#607d8b' }}
          >
            <span>🗑️</span>
            <span>נקה הכל</span>
          </button>
        </div>

      </main>
      {/* ══ PRINT SUMMARY — shown only on print ══ */}
      <PrintSummary form={form} printSigs={printSigs} />

    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Print-only single-page summary                           */
/* ────────────────────────────────────────────────────────── */

const LEGAL: { n: number; text: string }[] = [
  { n: 3, text: 'הובהרה לי זכותי שלא להסכים לחיפוש במחשב בלא צו שיפוטי, או להסכים לחיפוש מחומרי המחשב בלבד, עצם הסירוב לא ייקרא לחובתי. כן הובהר לי כי אני רשאי לחזור בי מהסכמתי לחיפוש בכל עת ו/או להגבילו, וכי אין בחזרה מהסכמה כדי לפגוע בחוקיות הפעולות שנעשו עד לחזרה מהסכמה.' },
  { n: 4, text: 'הובהר לי כי החיפוש במחשב הינו בכלל החומר שנוצר או קיים במחשב או שנמנה לעיל, ובחומרי המחשב שנמנה לעיל, וכי משטרת ישראל עשויה להשתמש בכל אמצעי טכנולוגי שברשותה במהלך החיפוש.' },
  { n: 5, text: 'במקרה של הרשאה לחיפוש בחלק מחומרי המחשב: הובהר לי כי בשל מגבלות טכנולוגיות וצרכי החקירה, כלל חומרי המחשב יועתקו וייישמרו על-ידי המשטרה בנפרד מתיק החקירה, אולם הצפייה תהא רק בקבצים, בתיקיות או בסוגי הקבצים אליהם אני מרשה לעיין כמפורט לעיל בסעיף 1. למשטרת ישראל שמורה הזכות לפנות לבית-המשפט להתיר את העיון בקבצים נוספים, בהתאם להתקדמות החקירה.' },
  { n: 6, text: 'הובהרה לי זכותי שהחיפוש יתבצע בנוכחותי ובפני שני עדים בגירים שאינם שוטרים.' },
];

function PrintSummary({
  form,
  printSigs,
}: {
  form: FormState;
  printSigs: { owner: string; editor: string };
}) {
  const filledDevices = form.devices.filter(Boolean);
  const presenceLabel =
    form.presence === 'no-witnesses' ? 'ללא נוכחות עדים' :
    form.presence === 'no-self'      ? 'ללא נוכחותי'     : '—';
  const computerLabel =
    form.computerType === 'personal'     ? 'מחשב פרטי' :
    form.computerType === 'institutional'? 'מחשב מוסדי' : '—';

  const S: React.CSSProperties = {
    fontFamily: 'Arial, David, sans-serif',
    direction: 'rtl',
    fontSize: '8.5pt',
    lineHeight: 1.45,
    color: '#111',
  };
  const navy = '#1e3264';
  const borderLight = '1px solid #bbb';
  const cell: React.CSSProperties = {
    padding: '3px 6px',
    borderBottom: borderLight,
  };
  const sectionTitle: React.CSSProperties = {
    background: '#eef1f7',
    fontWeight: 'bold',
    fontSize: '8pt',
    padding: '3px 6px',
    borderBottom: borderLight,
    borderTop: borderLight,
    color: navy,
  };

  return (
    <div
      className="print-summary"
      style={{ ...S, display: 'none' }}
    >
      {/* ── Header ── */}
      <div style={{ background: navy, color: '#fff', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>הסכמת בעל הרשאה לחיפוש בחומר מחשב — נספח ט׳</div>
          <div style={{ fontSize: '8pt', opacity: 0.85 }}>משטרת ישראל | תחנת בת ים</div>
        </div>
        <div style={{ fontSize: '22pt', lineHeight: 1 }}>✡</div>
      </div>

      {/* ── Meta row ── */}
      <div style={{ display: 'flex', gap: 16, border: borderLight, borderRadius: 3, padding: '4px 8px', marginBottom: 6, background: '#f7f8fa' }}>
        <span><strong>מס׳ פל״א:</strong> {form.plaNum || '—'}</span>
        <span><strong>יחידה:</strong> תחנת בת ים</span>
        <span><strong>תאריך:</strong> {formatDate(form.docDate)}</span>
      </div>

      {/* ── Two-column top ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>

        {/* Left: personal + devices */}
        <div style={{ border: borderLight, borderRadius: 3, overflow: 'hidden', borderRight: `3px solid ${navy}` }}>
          <div style={sectionTitle}>1 — בעל ההרשאה</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={cell}><strong>שם מלא:</strong></td><td style={cell}>{form.fullName || '—'}</td></tr>
              <tr><td style={cell}><strong>מספר זהות:</strong></td><td style={cell}>{form.idNum || '—'}</td></tr>
              <tr><td style={cell}><strong>כתובת:</strong></td><td style={cell}>{form.address || '—'}</td></tr>
            </tbody>
          </table>
          {filledDevices.length > 0 && (
            <>
              <div style={{ ...sectionTitle, fontSize: '7.5pt' }}>התקנים / חומר מחשב</div>
              <div style={{ padding: '3px 6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px' }}>
                {filledDevices.map((d, i) => (
                  <div key={i} style={{ fontSize: '7.5pt' }}>{i + 1}. {d}</div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: selections */}
        <div style={{ border: borderLight, borderRadius: 3, overflow: 'hidden', borderRight: `3px solid ${navy}` }}>
          <div style={sectionTitle}>2 — סוג מחשב</div>
          <div style={{ padding: '4px 8px' }}>
            <span style={{ background: navy, color: '#fff', borderRadius: 3, padding: '1px 6px', fontSize: '8pt' }}>
              {computerLabel}
            </span>
            {form.computerType === 'personal' && (
              <p style={{ marginTop: 4, fontSize: '7.5pt', color: '#444' }}>הנני מצהיר כי המחשב הוא מחשבי הפרטי, ואני מורשה גישה ושימוש במחשב.</p>
            )}
            {form.computerType === 'institutional' && (
              <p style={{ marginTop: 4, fontSize: '7.5pt', color: '#444' }}>הנני מצהיר כי המחשב הוא מחשב מוסדי, ואני מורשה גישה ושימוש במחשב.</p>
            )}
          </div>
          <div style={sectionTitle}>7 — נוכחות</div>
          <div style={{ padding: '4px 8px' }}>
            <span style={{ background: navy, color: '#fff', borderRadius: 3, padding: '1px 6px', fontSize: '8pt' }}>
              {presenceLabel}
            </span>
          </div>
          {form.remarks && (
            <>
              <div style={sectionTitle}>8 — הערות</div>
              <div style={{ padding: '4px 8px', fontSize: '7.5pt' }}>{form.remarks}</div>
            </>
          )}
        </div>
      </div>

      {/* ── Legal declarations 3–6 ── */}
      <div style={{ border: borderLight, borderRadius: 3, overflow: 'hidden', borderRight: `3px solid ${navy}`, marginBottom: 6 }}>
        <div style={sectionTitle}>3–6 — הצהרות שהובהרו לבעל ההרשאה</div>
        <div style={{ padding: '4px 8px' }}>
          {LEGAL.map(({ n, text }) => (
            <div key={n} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
              <span style={{ minWidth: 16, fontWeight: 'bold', color: navy, fontSize: '7.5pt', marginTop: 1 }}>{n}.</span>
              <span style={{ fontSize: '7.5pt' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Signatures ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* Owner */}
        <div style={{ border: borderLight, borderRadius: 3, overflow: 'hidden', borderRight: `3px solid ${navy}` }}>
          <div style={sectionTitle}>חתימת בעל ההרשאה</div>
          <div style={{ padding: '4px 8px' }}>
            {printSigs.owner
              ? <img src={printSigs.owner} alt="חתימה" style={{ width: '100%', height: 70, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 3, background: '#fafafa' }} />
              : <div style={{ height: 70, border: '1px dashed #aaa', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '7pt' }}>ללא חתימה</div>
            }
            <div style={{ marginTop: 4, fontSize: '7.5pt' }}><strong>תאריך:</strong> {formatDate(form.sigDate)}</div>
          </div>
        </div>

        {/* Editor */}
        <div style={{ border: borderLight, borderRadius: 3, overflow: 'hidden', borderRight: `3px solid ${navy}` }}>
          <div style={sectionTitle}>חתימת עורך המסמך</div>
          <div style={{ padding: '4px 8px' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 3, fontSize: '7.5pt' }}>
              <span><strong>שם:</strong> {form.editorName || '—'}</span>
              <span><strong>מא:</strong> {form.editorBadgeNum || '—'}</span>
            </div>
            {printSigs.editor
              ? <img src={printSigs.editor} alt="חתימה" style={{ width: '100%', height: 70, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 3, background: '#fafafa' }} />
              : <div style={{ height: 70, border: '1px dashed #aaa', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '7pt' }}>ללא חתימה</div>
            }
            <div style={{ marginTop: 4, fontSize: '7.5pt' }}><strong>תאריך:</strong> {formatDate(form.sigEditorDate)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
