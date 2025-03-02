"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    // get userId from Clerk
    const { userId } = await auth();
    const user = await currentUser();

    // if userId is not available, return
    if (!userId || !user) return;

    // check if user already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    // if user exists, return the user
    if (existingUser) return existingUser;

    // create a new user in the database
    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        // grab only the first name from the email address
        username:
          user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });

    return dbUser;
  } catch (error) {
    console.log("Error in syncUser", error);
  }
}
