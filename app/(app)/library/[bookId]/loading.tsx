export default function BookDetailLoading() {
  return (
    <div className="flex animate-pulse flex-col items-center gap-4 px-5 pt-20">
      <div
        className="rounded-corner-sm bg-surface-container-highest"
        style={{ height: "11rem", aspectRatio: "2 / 3" }}
      />
      <div className="h-6 w-40 rounded-corner-xs bg-surface-container-highest" />
      <div className="h-4 w-24 rounded-corner-xs bg-surface-container-highest" />
      <div className="mt-4 size-40 rounded-corner-full bg-surface-container-highest" />
      <div className="h-12 w-64 rounded-corner-full bg-surface-container-highest" />
    </div>
  );
}
