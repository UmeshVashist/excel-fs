export function LoadingIcon({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center w-full h-full ${className || "min-h-[400px]"}`}>
      <div className="loader-wrapper">
        <span className="loader-letter">L</span>
        <span className="loader-letter">o</span>
        <span className="loader-letter">a</span>
        <span className="loader-letter">d</span>
        <span className="loader-letter">i</span>
        <span className="loader-letter">n</span>
        <span className="loader-letter">g</span>
        <span className="loader-letter">.</span>
        <span className="loader-letter">.</span>
        <span className="loader-letter">.</span>
        <div className="loader"></div>
      </div>
    </div>
  )
}
