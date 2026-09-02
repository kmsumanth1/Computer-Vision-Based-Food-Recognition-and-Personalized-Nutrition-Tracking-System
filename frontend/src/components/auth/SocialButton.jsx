export default function SocialButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow-sm"
    >
      {children}
    </button>
  );
}