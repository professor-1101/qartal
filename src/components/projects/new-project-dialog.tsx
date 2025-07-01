"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface NewProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // TODO: Add onSave callback
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSave = () => {
        // TODO: Implement save logic
        console.log("در حال ذخیره پروژه:", { name, description });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>ایجاد پروژه جدید</DialogTitle>
                    <DialogDescription>
                        جزئیات پروژه جدید خود را وارد کنید. پس از اتمام، روی ذخیره کلیک کنید.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                            نام
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="نام پروژه"
                            aria-label="نام پروژه"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium">
                            توضیحات
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="توضیح مختصری از پروژه بنویسید."
                            aria-label="توضیحات پروژه"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} aria-label="انصراف">
                        انصراف
                    </Button>
                    <Button type="submit" onClick={handleSave} aria-label="ذخیره پروژه">
                        ذخیره
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

NewProjectDialog.displayName = "NewProjectDialog";