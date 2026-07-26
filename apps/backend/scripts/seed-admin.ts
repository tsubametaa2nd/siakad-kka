// Fitur: script seed akun guru pertama
import { supabase } from "../src/config/supabase";
import { hashPassword } from "../src/shared/auth/password";

const fullName = process.argv[2] || "Guru Admin";
const nip = process.argv[3] || "198001012005011001";
const password = process.argv[4] || "admin123";

const seedAdmin = async () => {
  console.log(`Menginisialisasi akun guru admin...`);
  console.log(`Nama: ${fullName}, NIP: ${nip}`);

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("identifier", nip)
    .maybeSingle();

  if (existing) {
    console.log(`Akun guru dengan NIP ${nip} sudah ada (ID: ${existing.id}).`);
    process.exit(0);
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .insert({
      full_name: fullName,
      role: "teacher",
      identifier: nip,
    })
    .select("id")
    .single();

  if (profileErr || !profile) {
    console.error("Gagal membuat profile guru:", profileErr);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const { error: credErr } = await supabase.from("credentials").insert({
    profile_id: profile.id,
    username: nip,
    password_hash: passwordHash,
  });

  if (credErr) {
    console.error("Gagal membuat kredensial guru, menghapus profile...", credErr);
    await supabase.from("profiles").delete().eq("id", profile.id);
    process.exit(1);
  }

  console.log(`✅ Berhasil membuat akun guru admin!`);
  console.log(`ID: ${profile.id}`);
  console.log(`Username (NIP): ${nip}`);
  console.log(`Password: ${password}`);
};

seedAdmin().catch(console.error);
