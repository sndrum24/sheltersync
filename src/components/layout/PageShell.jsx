export default function PageShell({ title, children }) {
  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
      
      {title && (
        <h1 className="text-2xl font-semibold tracking-tight">
          {title}
        </h1>
      )}

      {children}
    </div>
  );
}