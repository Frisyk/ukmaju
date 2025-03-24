import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connection";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password harus diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Koneksi ke database
    await dbConnect();

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    // Buat user baru
    const user = await User.create({
      name: name || email.split("@")[0], // Gunakan bagian username dari email jika nama tidak diisi
      email,
      password,
    });

    // Hapus password dari respons
    const userWithoutPassword = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      { message: "Pendaftaran berhasil", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mendaftar" },
      { status: 500 }
    );
  }
} 