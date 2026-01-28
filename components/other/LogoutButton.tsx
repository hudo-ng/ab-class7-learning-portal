"use client";
import { signOut } from "next-auth/react";
import { Button } from "../ui/button";

export default function LogoutButton() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        if (confirm("Are you sure you want to logout?")) {
          signOut({ callbackUrl: "/login" });
        }
      }}
    >
      Logout
    </Button>
  );
}
