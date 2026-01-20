import { hash } from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { findUserByEmail } from "@/lib/utils/user-utils";
import { requireAdmin } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  conflictResponse,
  handleError,
} from "@/lib/api-responses";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(64),
  role: z.enum(["EMPLOYEE", "ADMIN"]).default("EMPLOYEE"),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const payload = users.map((user) => ({
    ...user,
  }));

  return successResponse(payload);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const payload = await request.json();
  const parsed = createUserSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequestResponse("Invalid payload");
  }

  const existing = await findUserByEmail(parsed.data.email);

  if (existing) {
    return conflictResponse("Email already in use");
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash: await hash(parsed.data.password, 10),
        role: parsed.data.role,
      },
    });

    return successResponse({ id: user.id }, 201);
  } catch (error) {
    return handleError(error, "creating user");
  }
}
