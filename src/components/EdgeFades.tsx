// Soft top/bottom fades so content dissolves at the viewport edges.
export function EdgeFades() {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30">
        <div className="bg-background" style={{ height: "env(safe-area-inset-top)" }} />
        <div className="h-16 bg-gradient-to-b from-background to-transparent" />
      </div>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="h-20 bg-gradient-to-t from-background to-transparent" />
      </div>
    </>
  );
}
