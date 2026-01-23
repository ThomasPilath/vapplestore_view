"use client";

import React from "react";
import { useSessionWarning } from "@/hook/session-timeout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SessionTimeoutWarningProps {
  inactivityMinutes?: number;
  warningBeforeMinutes?: number;
}

export function SessionTimeoutWarning({
  inactivityMinutes = 30,
  warningBeforeMinutes = 5,
}: SessionTimeoutWarningProps) {
  const { showWarning, setShowWarning } = useSessionWarning(
    inactivityMinutes,
    warningBeforeMinutes
  );

  const handleExtendSession = async () => {
    try {
      await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      setShowWarning(false);
    } catch (error) {
      console.error("Error extending session:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
      window.location.href = "/";
    }
  };

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>⏰ Session expiring soon</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your session will expire in{" "}
            <strong>{warningBeforeMinutes} minutes</strong> due to inactivity.
          </p>
          <p className="text-xs text-muted-foreground">
            Last activity: {new Date().toLocaleTimeString()}
          </p>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
            <Button onClick={handleExtendSession}>
              Extend Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
