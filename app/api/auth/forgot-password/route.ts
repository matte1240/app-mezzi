import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendPasswordResetLinkEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Per sicurezza, restituiamo sempre lo stesso messaggio
    // anche se l'utente non esiste (per evitare user enumeration)
    if (!user) {
      // Attendiamo un po' per simulare l'elaborazione
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return NextResponse.json({
        message: "Se l'email esiste nel sistema, riceverai le istruzioni per il reset della password",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Token expires in 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Create new reset token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires,
      },
    });

    // Send email with reset link
    try {
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      await sendPasswordResetLinkEmail(
        email,
        user.name || email,
        resetUrl
      );
      
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error("⚠️ Failed to send password reset email:", emailError);
      
      // Cleanup token if email fails
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });
      
      return NextResponse.json(
        { error: "Errore nell'invio dell'email. Riprova più tardi." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Se l'email esiste nel sistema, riceverai le istruzioni per il reset della password",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
