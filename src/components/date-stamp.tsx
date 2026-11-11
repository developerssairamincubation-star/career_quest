/** Today's day, date and month (school time), top right of every signed-in page. */
export function DateStamp() {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
  return <p className="mb-4 text-right text-sm font-semibold text-muted">{today}</p>;
}
