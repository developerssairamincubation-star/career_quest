import { requireRole } from "@/lib/auth";
import { ImportForm } from "./import-form";

export const metadata = { title: "Add students" };

export default async function ImportPage() {
  await requireRole("admin", "counsellor");
  return (
    <div className="max-w-3xl">
      <h1 className="font-crest text-3xl font-bold">Add students</h1>
      <p className="mt-2 text-muted">
        Upload the template (or a CSV file) with one student per row. Each student gets an account and a password to sign in with.
        Classes are created automatically from the grade and section.
      </p>

      <div className="mt-6 rounded-[14px] bg-sunken p-4">
        <h2 className="font-semibold">Columns</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li><code className="font-semibold">email</code>, <code className="font-semibold">full_name</code>, <code className="font-semibold">grade</code> (9 to 12) and <code className="font-semibold">section</code> are required.</li>
          <li><code className="font-semibold">teacher</code> is optional. Pick a name from the dropdown; that teacher is assigned to the student&apos;s class. The list is built from your current teachers, so download the template again after adding one.</li>
          <li><code className="font-semibold">roll_no</code> and <code className="font-semibold">house</code> (varunaa, vaaranam, veera or vimaana) are optional. Students without a house choose one when they first sign in.</li>
          <li><code className="font-semibold">password</code> is optional. Leave it blank and a password is made for you; it must be at least 8 characters if you set one.</li>
        </ul>
        <a href="/staff/import/template" download className="mt-3 inline-block font-semibold text-royal underline">
          Download a template
        </a>
      </div>

      <ImportForm />
    </div>
  );
}
