// Creates a school and its first admin account. Run once:
//   node --env-file=.env.local scripts/bootstrap-admin.mjs "School name" SCHOOLCODE admin@school.edu "Admin Name"
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [schoolName, code, email, fullName] = process.argv.slice(2);
if (!schoolName || !code || !email || !fullName) {
  console.error('Usage: node --env-file=.env.local scripts/bootstrap-admin.mjs "School name" CODE email "Full name"');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: school, error: sErr } = await db
  .from("schools")
  .upsert({ name: schoolName, code: code.toUpperCase() }, { onConflict: "code" })
  .select()
  .single();
if (sErr) throw sErr;

const password = randomBytes(9).toString("base64url");
const { data: user, error: uErr } = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (uErr) throw uErr;

const { error: pErr } = await db.from("profiles").insert({
  id: user.user.id,
  school_id: school.id,
  role: "admin",
  full_name: fullName,
  email: email.toLowerCase(),
});
if (pErr) {
  await db.auth.admin.deleteUser(user.user.id);
  throw pErr;
}
console.log(`School "${school.name}" (${school.code}) is ready.`);
console.log(`Admin: ${email}\nPassword: ${password}\nSign in, then add staff and students from the app.`);
