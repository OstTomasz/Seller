// ─── Layout ───
export const styles = {
  page: "min-h-screen bg-bg-base text-celery-100",
  containerApp: "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",

  // ─── Cards ───
  card: "bg-bg-surface border border-celery-600 rounded-lg p-6",
  cardElevated: "bg-bg-elevated border border-gold-500 rounded-lg p-6",

  // ─── Typography ───
  heading1: "text-2xl sm:text-3xl font-bold text-celery-100",
  heading2: "text-xl sm:text-2xl font-semibold text-celery-100",
  heading3: "text-lg font-semibold text-celery-100",
  textMuted: "text-sm text-celery-500",
  textSecondary: "text-sm text-celery-300",

  // ─── Buttons — base ───
  btnBase:
    "inline-flex items-center justify-center font-medium rounded-lg disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm",

  // ─── Buttons — variants ───
  btnPrimary:
    "inline-flex items-center justify-center font-medium rounded-lg disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm bg-celery-600 hover:bg-celery-500 text-celery-100 border border-gold-500 hover:border-gold-400",
  btnSecondary:
    "inline-flex items-center justify-center font-medium rounded-lg disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm bg-celery-800 hover:bg-celery-700 text-celery-300 border border-celery-600",
  btnGhost:
    "inline-flex items-center justify-center font-medium rounded-lg disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm bg-transparent hover:bg-celery-800 text-celery-500 hover:text-celery-300",
  btnDanger:
    "inline-flex items-center justify-center font-medium rounded-lg disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm bg-red-950 hover:bg-red-900 text-red-400 border border-red-800",

  // ─── Button size modifiers — use with cn() ───
  btnSm: "px-3 py-1.5 text-xs",
  btnLg: "px-6 py-3 text-base",

  // ─── Form ───
  input:
    "w-full bg-celery-700 text-celery-100 border border-celery-600 rounded-lg px-4 py-2.5 text-sm outline-none placeholder:text-celery-500 focus:border-gold-500",
  label: "text-sm text-celery-300 mb-1.5 block",
  fieldError: "text-xs text-error min-h-[16px] mt-1",
  field: "flex flex-col",

  // ─── Misc ───
  divider: "border-t border-celery-600 my-4",
  goldRing: "border-2 border-gold-500 rounded-lg",

  // ─── Badges ───
  badge:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  badgeActive:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-celery-800 text-celery-300 border border-celery-600",
  badgeWarning:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-400 border border-amber-800",
  badgeError:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-950 text-red-400 border border-red-800",
  badgeMuted:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-celery-900 text-celery-500 border border-celery-800",

  // ─── Table ───
  tableWrapper: "w-full overflow-x-auto rounded-lg border border-celery-600",
  table: "w-full text-sm text-celery-300",
  tableThead: "bg-celery-800 text-celery-500 uppercase text-xs tracking-wider",
  tableTh: "px-4 py-3 text-left",
  tableTd: "px-4 py-3 border-t border-celery-800",
  tableTr: "hover:bg-celery-800",
} as const;
