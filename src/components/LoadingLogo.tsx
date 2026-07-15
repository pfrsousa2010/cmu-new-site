type LoadingLogoProps = {
  label?: string;
  className?: string;
};

export default function LoadingLogo({
  label = "Carregando…",
  className = "",
}: LoadingLogoProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`flex flex-col items-center justify-center gap-4 py-16 ${className}`}
    >
      <img
        src="/logo-cmu.png"
        alt=""
        className="h-20 w-20 animate-logo-pulse object-contain"
      />
      <span className="text-[14px] font-semibold text-ink-2">{label}</span>
    </div>
  );
}
