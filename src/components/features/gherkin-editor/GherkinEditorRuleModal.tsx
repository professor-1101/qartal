import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GherkinEditorRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rule: { id?: string; name: string; description: string }) => void;
  editingRule: { id?: string; name: string; description: string } | null;
}

export function GherkinEditorRuleModal({ open, onClose, onSubmit, editingRule }: GherkinEditorRuleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setName(editingRule?.name || "");
    setDescription(editingRule?.description || "");
  }, [editingRule, open]);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({ id: editingRule?.id, name: name.trim(), description: description.trim() });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingRule?.id ? "ویرایش قانون" : "افزودن قانون جدید"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="نام قانون"
            autoFocus
          />
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="توضیحات (اختیاری)"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>انصراف</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>ثبت</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 