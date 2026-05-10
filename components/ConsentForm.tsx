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
  offenseType: string;
  signLocation: string;
  sigDate: string;
  editorName: string;
  editorBadgeNum: string;
  sigEditorDate: string;
}

const emptyForm = (): FormState => ({
  plaNum: '',
  docDate: today(),
  fullName: '',
  idNum: '',
  address: '',
  devices: Array(2).fill(''),
  computerType: '',
  presence: '',
  remarks: '',
  offenseType: '',
  signLocation: '',
  sigDate: today(),
  editorName: '',
  editorBadgeNum: '',
  sigEditorDate: today(),
});

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

  const [form, setForm] = useState<FormState>(emptyForm);

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
    setForm(emptyForm());
    sigRef.current?.clear();
    sigEditorRef.current?.clear();
    setPrintSigs({ owner: '', editor: '' });
  };

  const waitForImages = (root: HTMLElement) =>
    Promise.all(
      Array.from(root.querySelectorAll('img')).map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = img.onerror = () => resolve();
            })
      )
    );

  const handlePrint = async () => {
    setPrintSigs({
      owner:  sigRef.current?.toDataURL()       ?? '',
      editor: sigEditorRef.current?.toDataURL() ?? '',
    });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const summary = document.querySelector<HTMLElement>('.print-summary');
    if (summary) await waitForImages(summary);
    window.print();
  };

  const handleSaveHTML = () => {
    const ownerSig  = sigRef.current?.toDataURL()       ?? '';
    const editorSig = sigEditorRef.current?.toDataURL() ?? '';

    const clone = document.documentElement.cloneNode(true) as HTMLElement;

    const liveCanvases   = Array.from(document.querySelectorAll('canvas'));
    const clonedCanvases = Array.from(clone.querySelectorAll('canvas'));
    clonedCanvases.forEach((c, i) => {
      const live = liveCanvases[i];
      if (!live) return;
      const img = clone.ownerDocument!.createElement('img');
      img.src = live.toDataURL();
      img.setAttribute('style', 'width:100%;max-height:130px;object-fit:contain;border:1px solid #d1d5db;border-radius:6px;background:#fafafa;');
      c.replaceWith(img);
    });

    const sigs = [ownerSig, editorSig];
    clone.querySelectorAll<HTMLImageElement>('.print-summary img').forEach((img, i) => {
      if (sigs[i]) img.src = sigs[i];
    });

    const summary = clone.querySelector<HTMLElement>('.print-summary');
    if (summary) summary.style.display = 'block';

    const html = '<!DOCTYPE html>\n' + clone.outerHTML;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `הסכמה_${form.fullName || 'טופס'}_${form.docDate}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const formatDateLocal = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="min-h-screen bg-[#e8ecf3]">

      {/* ══ HEADER ══ */}
      <header className="sticky top-0 z-50 no-print" style={{ background: '#1e3264', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 max-w-3xl mx-auto gap-3">
          <div className="text-white text-right min-w-0 flex-1">
            <div className="font-bold text-[13px] sm:text-base leading-tight truncate">
              הסכמת בעל הרשאה לחיפוש בחומר מחשב
            </div>
            <div className="text-[11px] sm:text-xs text-blue-200 mt-0.5">
              משטרת ישראל | נספח ט׳
            </div>
          </div>
          <div
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl sm:text-2xl shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            ✡
          </div>
        </div>
      </header>

      {/* ══ TOP-BAR ══ */}
      <div className="top-bar border-b border-gray-300 no-print" style={{ background: '#f7f8fa' }}>
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-x-4 sm:gap-y-2 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">פל״א</label>
            <input
              className="form-input !py-1.5 !text-sm flex-1 sm:w-24 sm:flex-none text-center min-w-0"
              value={form.plaNum}
              onChange={(e) => set('plaNum', e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">תאריך</label>
            <input
              type="date"
              className="form-input !py-1.5 !text-sm flex-1 sm:w-36 sm:flex-none min-w-0"
              value={form.docDate}
              onChange={(e) => set('docDate', e.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-auto flex items-center gap-2 sm:mr-auto">
            <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">יחידה</label>
            <span className="text-xs sm:text-sm font-bold text-navy bg-blue-50 border border-blue-200 rounded px-2 py-1">
              תחנת בת ים
            </span>
          </div>
        </div>
      </div>

      {/* ══ FORM BODY ══ */}
      <main className="page-container max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-5">

        {/* ── Section 1 ── */}
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
          <div className="mt-3">
            <Field label="סוג העבירה / נושא החקירה (אופציונלי)">
              <input
                className="form-input"
                value={form.offenseType}
                onChange={(e) => set('offenseType', e.target.value)}
                placeholder="לדוגמה: עבירות מחשב, הונאה ברשת..."
              />
            </Field>
          </div>
          <p className="legal-text mt-4 mb-3">
            מאשר בזאת למשטרת ישראל לחדור ולבצע חיפוש במחשב/חומר מחשב{' '}
            <em>(מחק המיותר)</em> שבשימושי, וזאת לצורך החקירה (פירוט המחשבים,
            חומרי המחשב והחשבונות בעניינים ניתנה ההסכמה בכל מקום בו הם נמצאים,
            לרבות מחוץ לישראל):
          </p>
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

        {/* ── Section 2 ── */}
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

        {/* ── Sections 3–6 ── */}
        <SectionCard num="3–6" title="הצהרות שהובהרו לבעל ההרשאה">
          <div className="space-y-3">
            {LEGAL.map(({ n, text }) => (
              <div key={n} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-navy/10 text-navy text-xs font-bold flex items-center justify-center mt-0.5">
                  {n}
                </span>
                <p className="legal-text">{text}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Section 7 ── */}
        <SectionCard num={7} title="נוכחות">
          <p className="legal-text mb-3">
            הנני מאשר למשטרה כי החיפוש במחשב ייערך <em>(סמן באחת המתאימה):</em>
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

        {/* ── Section 8 ── */}
        <SectionCard num={8} title="הערות בעל ההרשאה לחומר המחשב">
          <textarea
            className="form-input resize-y min-h-[80px]"
            value={form.remarks}
            onChange={(e) => set('remarks', e.target.value)}
            placeholder="הערות..."
          />
        </SectionCard>

        {/* ── Owner signature ── */}
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
            <div className="w-full sm:w-44 space-y-3">
              <div>
                <label className="form-label">תאריך</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.sigDate}
                  onChange={(e) => set('sigDate', e.target.value)}
                />
                <div className="mt-1 text-center text-sm font-medium text-navy">
                  {formatDateLocal(form.sigDate)}
                </div>
              </div>
              <div>
                <label className="form-label">מקום החתימה (אופציונלי)</label>
                <input
                  className="form-input"
                  value={form.signLocation}
                  onChange={(e) => set('signLocation', e.target.value)}
                  placeholder="עיר / מקום"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Editor signature ── */}
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
            <div className="w-full sm:w-40 space-y-1">
              <label className="form-label">תאריך</label>
              <input
                type="date"
                className="form-input"
                value={form.sigEditorDate}
                onChange={(e) => set('sigEditorDate', e.target.value)}
              />
              <div className="mt-2 text-center text-sm font-medium text-navy">
                {formatDateLocal(form.sigEditorDate)}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══ ACTION BUTTONS ══ */}
        <div className="no-print grid grid-cols-1 sm:flex sm:flex-wrap sm:justify-center gap-2.5 sm:gap-3 mt-6 mb-6 sm:mb-8 safe-bottom">
          <button
            type="button"
            onClick={handlePrint}
            className="btn-action text-white w-full sm:w-auto"
            style={{ background: '#2e7d32' }}
          >
            <span>🖨️</span>
            <span>הדפס / PDF</span>
          </button>
          <button
            type="button"
            onClick={handleSaveHTML}
            className="btn-action text-white w-full sm:w-auto"
            style={{ background: '#7b4f00' }}
          >
            <span>💾</span>
            <span>שמור כ-HTML</span>
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="btn-action text-white w-full sm:w-auto"
            style={{ background: '#607d8b' }}
          >
            <span>🗑️</span>
            <span>נקה הכל</span>
          </button>
        </div>

      </main>

      {/* ══ PRINT SUMMARY ══ */}
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

const fmt = (d: string) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

function PrintSummary({
  form,
  printSigs,
}: {
  form: FormState;
  printSigs: { owner: string; editor: string };
}) {
  const filledDevices = form.devices.filter(Boolean);

  const navy      = '#1e3264';
  const navyDark  = '#0f1d3d';
  const ink       = '#1a1a1a';
  const muted     = '#6b7280';
  const ruleColor = '#d4d8e0';

  const root: React.CSSProperties = {
    fontFamily: '"Times New Roman", "David", "Frank Ruehl CLM", serif',
    direction: 'rtl',
    fontSize: '10pt',
    lineHeight: 1.55,
    color: ink,
    background: '#fff',
    maxWidth: '190mm',
    margin: '0 auto',
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: 'Arial, "David", sans-serif',
    fontWeight: 700,
    fontSize: '10pt',
    color: navyDark,
    padding: '0 0 3px',
    borderBottom: `1px solid ${navy}`,
    marginBottom: 7,
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  };

  const sectionNum: React.CSSProperties = {
    fontFamily: 'Arial, sans-serif',
    fontWeight: 700,
    fontSize: '10pt',
    color: navy,
    minWidth: 24,
  };

  const fieldLabel: React.CSSProperties = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '7.5pt',
    color: muted,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    marginBottom: 1,
  };

  const fieldValue: React.CSSProperties = {
    fontSize: '10pt',
    color: ink,
    borderBottom: `1px solid ${ruleColor}`,
    paddingBottom: 2,
    minHeight: 16,
  };

  const declarationText: React.CSSProperties = {
    fontSize: '9pt',
    lineHeight: 1.6,
    textAlign: 'justify' as const,
    color: '#222',
  };

  const checkbox = (checked: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 13,
    height: 13,
    border: `1.5px solid ${navy}`,
    fontSize: '11pt',
    fontWeight: 700,
    color: navy,
    lineHeight: 1,
    flexShrink: 0,
    marginInlineEnd: 6,
    background: checked ? '#eef1f7' : '#fff',
  });

  const checkboxRow: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
  };

  return (
    <div className="print-summary" style={{ ...root, display: 'none' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 8 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: navyDark, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26pt', lineHeight: 1, flexShrink: 0,
          }}>
            ✡
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '8.5pt', color: muted, letterSpacing: '0.2em', fontWeight: 700 }}>
              מדינת ישראל · משטרת ישראל
            </div>
            <div style={{ fontFamily: '"Times New Roman", "David", serif', fontSize: '17pt', fontWeight: 700, color: navyDark, marginTop: 3 }}>
              הסכמת בעל הרשאה לחיפוש בחומר מחשב
            </div>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt', color: navy, marginTop: 2, fontWeight: 600, letterSpacing: '0.06em' }}>
              נספח ט׳
            </div>
          </div>
        </div>
        <div style={{ borderTop: `2px solid ${navy}`, borderBottom: `1px solid ${navy}`, height: 3, marginBottom: 6 }} />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Arial, sans-serif',
          fontSize: '8.5pt',
          color: navyDark,
        }}>
          <span><span style={{ color: muted, fontWeight: 700 }}>יחידה:</span> <strong>תחנת בת ים</strong></span>
          <span><span style={{ color: muted, fontWeight: 700 }}>מס׳ פל״א:</span> <strong>{form.plaNum || '—'}</strong></span>
          <span><span style={{ color: muted, fontWeight: 700 }}>תאריך:</span> <strong>{fmt(form.docDate) || '—'}</strong></span>
        </div>
      </div>

      {/* ── Section 1 ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionTitle}>
          <span style={sectionNum}>1.</span>
          <span>פרטי בעל ההרשאה</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 6 }}>
          <div>
            <div style={fieldLabel}>שם מלא</div>
            <div style={fieldValue}>{form.fullName || ' '}</div>
          </div>
          <div>
            <div style={fieldLabel}>מספר זהות</div>
            <div style={{ ...fieldValue, fontFamily: '"Courier New", monospace', letterSpacing: '0.1em' }}>{form.idNum || ' '}</div>
          </div>
        </div>
        <div>
          <div style={fieldLabel}>כתובת מגורים</div>
          <div style={fieldValue}>{form.address || ' '}</div>
        </div>
        {form.offenseType && (
          <div style={{ marginTop: 6 }}>
            <div style={fieldLabel}>סוג העבירה / נושא החקירה</div>
            <div style={fieldValue}>{form.offenseType}</div>
          </div>
        )}

        <p style={{ ...declarationText, marginTop: 9, marginBottom: 6 }}>
          מאשר/ת בזאת למשטרת ישראל לחדור ולבצע חיפוש במחשב/חומר מחשב שבשימושי, וזאת לצורך החקירה. פירוט המחשבים וחומרי המחשב שבעניינם ניתנת ההסכמה — בכל מקום בו הם נמצאים, לרבות מחוץ לישראל:
        </p>

        {filledDevices.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', border: `1px solid ${ruleColor}` }}>
            <thead>
              <tr style={{ background: '#f4f6fb' }}>
                <th style={{ width: 30, padding: '4px 6px', borderBottom: `1px solid ${ruleColor}`, borderLeft: `1px solid ${ruleColor}`, textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: '8pt', color: navy }}>#</th>
                <th style={{ padding: '4px 8px', borderBottom: `1px solid ${ruleColor}`, textAlign: 'right', fontFamily: 'Arial, sans-serif', fontSize: '8pt', color: navy }}>תיאור ההתקן / חומר המחשב</th>
              </tr>
            </thead>
            <tbody>
              {filledDevices.map((d, i) => (
                <tr key={i}>
                  <td style={{ padding: '4px 6px', borderBottom: `1px solid ${ruleColor}`, borderLeft: `1px solid ${ruleColor}`, textAlign: 'center', color: muted, fontFamily: 'Arial, sans-serif' }}>{i + 1}</td>
                  <td style={{ padding: '4px 8px', borderBottom: `1px solid ${ruleColor}` }}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ fontSize: '8.5pt', color: muted, fontStyle: 'italic', padding: '4px 0' }}>לא צוינו התקנים.</div>
        )}
      </div>

      {/* ── Section 2 ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionTitle}>
          <span style={sectionNum}>2.</span>
          <span>סוג המחשב</span>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: '10pt' }}>
          <span style={checkboxRow}>
            <span style={checkbox(form.computerType === 'personal')}>{form.computerType === 'personal' ? '✓' : ''}</span>
            <span style={{ fontWeight: form.computerType === 'personal' ? 700 : 400 }}>מחשב פרטי</span>
          </span>
          <span style={checkboxRow}>
            <span style={checkbox(form.computerType === 'institutional')}>{form.computerType === 'institutional' ? '✓' : ''}</span>
            <span style={{ fontWeight: form.computerType === 'institutional' ? 700 : 400 }}>מחשב מוסדי</span>
          </span>
        </div>
        {form.computerType && (
          <p style={{ ...declarationText, marginTop: 6, fontSize: '8.5pt', color: '#444' }}>
            הנני מצהיר/ה כי המחשב הוא {form.computerType === 'personal' ? 'מחשבי הפרטי' : 'מחשב מוסדי'}, ואני מורשה גישה ושימוש במחשב או בחלק המחשב שבו יתבצע החיפוש.
          </p>
        )}
      </div>

      {/* ── Sections 3–6 ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionTitle}>
          <span style={sectionNum}>3–6.</span>
          <span>הצהרות שהובהרו לבעל ההרשאה</span>
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {LEGAL.map(({ n, text }) => (
            <li key={n} style={{ display: 'flex', gap: 8, marginBottom: 7, ...declarationText, breakInside: 'avoid' }}>
              <span style={{
                flexShrink: 0,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 700,
                color: navy,
                fontSize: '9pt',
                minWidth: 18,
              }}>{n}.</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Section 7 ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={sectionTitle}>
          <span style={sectionNum}>7.</span>
          <span>נוכחות</span>
        </div>
        <p style={{ ...declarationText, marginBottom: 5 }}>
          הנני מאשר/ת למשטרה כי החיפוש במחשב ייערך:
        </p>
        <div style={{ display: 'flex', gap: 28, fontSize: '10pt' }}>
          <span style={checkboxRow}>
            <span style={checkbox(form.presence === 'no-witnesses')}>{form.presence === 'no-witnesses' ? '✓' : ''}</span>
            <span style={{ fontWeight: form.presence === 'no-witnesses' ? 700 : 400 }}>ללא נוכחות עדים</span>
          </span>
          <span style={checkboxRow}>
            <span style={checkbox(form.presence === 'no-self')}>{form.presence === 'no-self' ? '✓' : ''}</span>
            <span style={{ fontWeight: form.presence === 'no-self' ? 700 : 400 }}>ללא נוכחותי</span>
          </span>
        </div>
      </div>

      {/* ── Section 8 ── */}
      {form.remarks && (
        <div style={{ marginBottom: 14 }}>
          <div style={sectionTitle}>
            <span style={sectionNum}>8.</span>
            <span>הערות בעל ההרשאה</span>
          </div>
          <div style={{
            ...declarationText,
            border: `1px solid ${ruleColor}`,
            padding: '6px 8px',
            background: '#fafbfd',
            whiteSpace: 'pre-wrap' as const,
          }}>
            {form.remarks}
          </div>
        </div>
      )}

      {/* ── Signatures ── */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        {/* Owner */}
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <div style={sectionTitle}>
            <span style={{ ...sectionNum, fontSize: '11pt' }}>✍</span>
            <span>חתימת בעל ההרשאה</span>
          </div>
          <div style={{ marginBottom: 5 }}>
            <div style={fieldLabel}>שם החותם</div>
            <div style={fieldValue}>{form.fullName || ' '}</div>
          </div>
          <div style={{
            border: `1px solid ${navy}`,
            height: 110,
            background: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {printSigs.owner ? (
              <img src={printSigs.owner} alt="חתימה" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd2de', fontSize: '8pt', fontStyle: 'italic' }}>
                — לחתימה —
              </div>
            )}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: form.signLocation ? '1fr 1fr' : '1fr',
            gap: 8, marginTop: 5,
            fontFamily: 'Arial, sans-serif', fontSize: '8.5pt',
          }}>
            <span><span style={{ color: muted, fontWeight: 700 }}>תאריך:</span> {fmt(form.sigDate) || '—'}</span>
            {form.signLocation && (
              <span><span style={{ color: muted, fontWeight: 700 }}>מקום:</span> {form.signLocation}</span>
            )}
          </div>
        </div>

        {/* Editor */}
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <div style={sectionTitle}>
            <span style={{ ...sectionNum, fontSize: '11pt' }}>✍</span>
            <span>חתימת עורך המסמך</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 5 }}>
            <div>
              <div style={fieldLabel}>שם עורך המסמך</div>
              <div style={fieldValue}>{form.editorName || ' '}</div>
            </div>
            <div>
              <div style={fieldLabel}>מספר אישי</div>
              <div style={{ ...fieldValue, fontFamily: '"Courier New", monospace', letterSpacing: '0.1em' }}>{form.editorBadgeNum || ' '}</div>
            </div>
          </div>
          <div style={{
            border: `1px solid ${navy}`,
            height: 110,
            background: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {printSigs.editor ? (
              <img src={printSigs.editor} alt="חתימה" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd2de', fontSize: '8pt', fontStyle: 'italic' }}>
                — לחתימה וחותמת —
              </div>
            )}
          </div>
          <div style={{ marginTop: 5, fontFamily: 'Arial, sans-serif', fontSize: '8.5pt' }}>
            <span style={{ color: muted, fontWeight: 700 }}>תאריך:</span> {fmt(form.sigEditorDate) || '—'}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        marginTop: 20,
        paddingTop: 6,
        borderTop: `1px solid ${navy}`,
        fontFamily: 'Arial, sans-serif',
        color: muted,
      }}>
        <div style={{ fontSize: '7pt', textAlign: 'center', fontStyle: 'italic', marginBottom: 4 }}>
          מסמך זה מהווה הסכמה משפטית מודעת לחיפוש בחומר מחשב על-פי דין. נחתם מרצון חופשי ולאחר שהובהרו לחותם זכויותיו.
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '7pt',
          letterSpacing: '0.05em',
        }}>
          <span>משטרת ישראל · נספח ט׳</span>
          <span>הופק דיגיטלית · {fmt(form.docDate) || '—'}</span>
        </div>
      </div>
    </div>
  );
}
