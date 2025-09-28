import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { signUpSchema } from "@/lib/validations/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = signUpSchema.parse(body)
    // Normalize email to lowercase for consistent storage and auth
    const email = validatedData.email.toLowerCase().trim()
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: validatedData.name,
        email,
        password: hashedPassword,
        role: "user",
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      })

    return NextResponse.json(
      { 
        message: "Account created successfully!",
        user: newUser
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Sign up error:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
