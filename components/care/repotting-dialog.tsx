"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Flower2 } from "lucide-react";
import { usePlants } from "../plant-provider";

interface RepottingDialogProps {
  plantId: string;
  trigger?: React.ReactNode;
}

export function RepottingDialog({ plantId, trigger }: RepottingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addCareActivity } = usePlants();

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      addCareActivity(plantId, { type: "repotted", notes });
      setNotes("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to submit repotting notes:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          className="text-black h-12 md:h-10 border-2 border-black justify-start hover:bg-primary/30 bg-neutral-100 dark:neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          onClick={() => setIsOpen(true)}
        >
          <Flower2 className="h-5 w-5" />
          <span className="ml-2">Repotting</span>
        </Button>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold border-b-4 w-fit border-black">Add notes</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <DialogDescription className="text-sm text-muted-foreground">
              Enter details about the repotting (e.g., new pot size, soil mix used)
            </DialogDescription>
            <Textarea
              placeholder=""
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] bg-neutral-100 dark:bg-neutral-900 border-4 neo-brutalist-shadow border-black"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-neutral-100 dark:bg-neutral-900 border-2 border-black neo-brutalist-shadow">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="border-2 neo-brutalist-shadow border-black"
            >
              {isSubmitting ? "Saving..." : "Save activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 