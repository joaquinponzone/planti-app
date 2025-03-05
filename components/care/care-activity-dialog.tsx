"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { usePlants } from "../plant-provider";

type CareActivityType = 'watered' | 'misted' | 'wiped' | 'pruned' | 'repotted' | 'fertilized' | 'medicated' | 'moved';

interface CareActivity {
  id: CareActivityType;
  label: string;
  placeholder: string;
}

const CARE_ACTIVITIES: Record<string, CareActivity> = {
  repotted: {
    id: "repotted",
    label: "Repotting Details",
    placeholder: "Enter details about the repotting (e.g., new pot size, soil mix used)",
  },
  fertilized: {
    id: "fertilized",
    label: "Fertilizer Details",
    placeholder: "Enter details about fertilization (e.g., type, amount, concentration)",
  },
  medicated: {
    id: "medicated",
    label: "Treatment Details",
    placeholder: "Enter details about the treatment (e.g., pest/disease, product used, dosage)",
  },
  moved: {
    id: "moved",
    label: "Location Change Details",
    placeholder: "Enter details about the new location (e.g., room, light conditions)",
  },
};

interface CareActivityDialogProps {
  plantId: string;
  activityType: keyof typeof CARE_ACTIVITIES;
  trigger?: React.ReactNode;
}

export function CareActivityDialog({ plantId, activityType, trigger }: CareActivityDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addCareActivity } = usePlants();

  const activity = CARE_ACTIVITIES[activityType];

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      addCareActivity(plantId, { type: activityType as CareActivityType, notes });
      setNotes("");
      setIsOpen(false);
    } catch (error) {
      console.error(`Failed to submit ${activityType} notes:`, error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setIsOpen(true)} className="text-black h-12 md:h-10 border-2 border-black justify-start hover:bg-primary/30 bg-neutral-100 dark:neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
          Record {activity.label}
        </Button>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-4 neo-brutalist-shadow border-black">
          <DialogHeader>
            <DialogTitle>Add {activity.label}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder={activity.placeholder}
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
              className="border-2 border-black neo-brutalist-shadow"
            >
              {isSubmitting ? "Saving..." : "Save Care Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 