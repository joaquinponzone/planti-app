"use client"

import { useState, useEffect } from "react";
import { usePlants, type PlantStatusThresholds } from "./plant-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";

// Interface for the local form state, allowing empty strings during input
interface LocalThresholdsState {
  warningDays: number | string;
  dangerDays: number | string;
}

export function ConfigPopover() {
  const { plantStatusThresholds, updateThresholds } = usePlants();
  // Use the local state interface
  const [localThresholds, setLocalThresholds] = useState<LocalThresholdsState>({
    warningDays: plantStatusThresholds.warningDays,
    dangerDays: plantStatusThresholds.dangerDays,
  });
  const [isOpen, setIsOpen] = useState(false);

  // Use useEffect to update local state when context changes
  useEffect(() => {
    setLocalThresholds({
        warningDays: plantStatusThresholds.warningDays,
        dangerDays: plantStatusThresholds.dangerDays,
    });
  }, [plantStatusThresholds]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    // Allow empty string or positive integer
    const numberValue = value === "" ? "" : Math.max(0, parseInt(value, 10));
    setLocalThresholds((prev) => ({
      ...prev,
      [name]: numberValue,
    }));
  }

  function handleSave() {
    // Convert local state (potentially strings) to numbers for saving
    const warningValue = localThresholds.warningDays === "" ? 0 : Number(localThresholds.warningDays);
    const dangerValue = localThresholds.dangerDays === "" ? 0 : Number(localThresholds.dangerDays);

    // Basic validation
    if (isNaN(warningValue) || isNaN(dangerValue)) {
        console.error("Invalid threshold values entered.");
        // Optionally, add user feedback here (e.g., toast notification)
        return;
    }

    const thresholdsToSave: PlantStatusThresholds = {
        warningDays: warningValue,
        dangerDays: dangerValue,
    };
    updateThresholds(thresholdsToSave);
    setIsOpen(false); // Close popover on save
  }

  function handleCancel() {
    // Reset local state to context state on cancel
    setLocalThresholds({
        warningDays: plantStatusThresholds.warningDays,
        dangerDays: plantStatusThresholds.dangerDays,
    });
    setIsOpen(false);
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    // If popover is closing without saving, reset local state
    if (!open) {
        handleCancel();
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="border-2 border-black neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Configure Thresholds</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 border-2 border-black bg-background neo-brutalist-shadow">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Alert Thresholds</h4>
            <p className="text-sm text-muted-foreground">
              Set days since last watered for alerts.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="warningDays">Warning</Label>
              <Input
                id="warningDays"
                name="warningDays"
                type="number"
                min="0"
                value={localThresholds.warningDays}
                onChange={handleInputChange}
                className="col-span-2 h-8 border-2 border-black focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="dangerDays">Danger</Label>
              <Input
                id="dangerDays"
                name="dangerDays"
                type="number"
                min="0"
                value={localThresholds.dangerDays}
                onChange={handleInputChange}
                className="col-span-2 h-8 border-2 border-black focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
             <Button variant="outline" size="sm" onClick={handleCancel} className="border-2 border-black">Cancel</Button>
            <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-black">Save</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 