import { mockUsers, mockUserList } from "@/data/mock-users";
import { userSchema } from "@/schemas";
import type { User, UserRole } from "@/types";
import { mockRequest } from "./client";

/**
 * Stands in for "who is signed in". A real implementation resolves this from
 * the session rather than from a demo role selection.
 */
export async function getCurrentMockUser(role: UserRole): Promise<User> {
  return mockRequest(() => userSchema.parse(mockUsers[role]), mockUsers[role]);
}

export function getMockUserForRole(role: UserRole): User {
  return mockUsers[role];
}

export function listMockUsers(): User[] {
  return mockUserList;
}
