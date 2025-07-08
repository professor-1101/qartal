"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Plus, Edit, Trash, ArrowLeft, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ExamplesTableProps {
    headers: string[];
    rows: { id: string; values: string[] }[];
    onChange: (headers: string[], rows: { id: string; values: string[] }[]) => void;
}

export const ExamplesTable: React.FC<ExamplesTableProps> = ({ headers, rows, onChange }) => {
    const [editingHeader, setEditingHeader] = useState<number | null>(null);
    const [headerValue, setHeaderValue] = useState("");
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [cellValue, setCellValue] = useState("");
    const [activeColumn, setActiveColumn] = useState<number | null>(null);
    const [activeRow, setActiveRow] = useState<number | null>(null);

    const safeHeaders = headers || [];
    const safeRows = rows || [];

    // Add column
    const handleAddColumn = () => {
        const newHeaders = [...safeHeaders, `پارامتر ${safeHeaders.length + 1}`];
        const newRows = safeRows.map(row => ({ ...row, values: [...row.values, ""] }));
        onChange(newHeaders, newRows);
    };

    // Remove column
    const handleRemoveColumn = (colIdx: number) => {
        const newHeaders = safeHeaders.filter((_, i) => i !== colIdx);
        const newRows = safeRows.map(row => ({ ...row, values: row.values.filter((_, i) => i !== colIdx) }));
        onChange(newHeaders, newRows);
    };

    // Edit header
    const handleHeaderEdit = (idx: number) => {
        setEditingHeader(idx);
        setHeaderValue(safeHeaders[idx]);
    };

    const handleHeaderBlur = (idx: number) => {
        if (headerValue.trim() === "") return;
        
        const newHeaders = [...safeHeaders];
        newHeaders[idx] = headerValue;
        onChange(newHeaders, safeRows);
        setEditingHeader(null);
    };

    // Add row
    const handleAddRow = () => {
        const newRow = { id: Math.random().toString(36).slice(2), values: safeHeaders.map(() => "") };
        onChange(safeHeaders, [...safeRows, newRow]);
    };

    // Remove row
    const handleRemoveRow = (rowIdx: number) => {
        const newRows = safeRows.filter((_, i) => i !== rowIdx);
        onChange(safeHeaders, newRows);
    };

    // Edit cell
    const handleCellEdit = (rowIdx: number, colIdx: number) => {
        setEditingCell({ row: rowIdx, col: colIdx });
        setCellValue(safeRows[rowIdx].values[colIdx]);
    };

    const handleCellBlur = (rowIdx: number, colIdx: number) => {
        const newRows = safeRows.map((row, i) =>
            i === rowIdx ? { ...row, values: row.values.map((v, j) => (j === colIdx ? cellValue : v)) } : row
        );
        onChange(safeHeaders, newRows);
        setEditingCell(null);
    };

    // Move column
    const handleMoveColumn = (fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= safeHeaders.length) return;
        
        const newHeaders = [...safeHeaders];
        const [moved] = newHeaders.splice(fromIdx, 1);
        newHeaders.splice(toIdx, 0, moved);
        
        const newRows = safeRows.map(row => {
            const newValues = [...row.values];
            const [movedValue] = newValues.splice(fromIdx, 1);
            newValues.splice(toIdx, 0, movedValue);
            return { ...row, values: newValues };
        });
        
        onChange(newHeaders, newRows);
    };

    return (
        <div className="border rounded-lg p-4 bg-background shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base flex items-center gap-2">
                    <Badge variant="secondary">مثال‌ها</Badge>
                    <span className="text-gray-600 text-sm">({safeRows.length} سطر، {safeHeaders.length} ستون)</span>
                </h3>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddColumn}
                        className="flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        افزودن ستون
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddRow}
                        className="flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        افزودن سطر
                    </Button>
                </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border">
                <Table className="min-w-full">
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            {/* Column headers */}
                            {safeHeaders.map((header, idx) => (
                                <TableHead 
                                    key={idx} 
                                    className="relative group p-0 border-r"
                                    onMouseEnter={() => setActiveColumn(idx)}
                                    onMouseLeave={() => setActiveColumn(null)}
                                >
                                    <div className="flex items-center justify-between px-3 py-2 h-12">
                                        {editingHeader === idx ? (
                                            <Input
                                                className="w-full h-8 px-2 text-sm border rounded"
                                                value={headerValue}
                                                onChange={e => setHeaderValue(e.target.value)}
                                                onBlur={() => handleHeaderBlur(idx)}
                                                onKeyDown={e => e.key === "Enter" && handleHeaderBlur(idx)}
                                                autoFocus
                                            />
                                        ) : (
                                            <div 
                                                className="flex-1 cursor-pointer truncate max-w-[150px]"
                                                onClick={() => handleHeaderEdit(idx)}
                                            >
                                                {header}
                                            </div>
                                        )}
                                        
                                        <div className={`flex gap-1 transition-opacity ${activeColumn === idx ? 'opacity-100' : 'opacity-0'}`}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-500 hover:text-gray-700"
                                                        onClick={() => handleHeaderEdit(idx)}
                                                        aria-label="ویرایش نام ستون"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>ویرایش نام ستون</TooltipContent>
                                            </Tooltip>
                                            
                                            {safeHeaders.length > 1 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-red-500 hover:text-red-700"
                                                            onClick={() => handleRemoveColumn(idx)}
                                                            aria-label="حذف ستون"
                                                        >
                                                            <Trash className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>حذف ستون</TooltipContent>
                                                </Tooltip>
                                            )}
                                            
                                            <div className="flex flex-col gap-0.5">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-3 w-6 text-gray-500 hover:text-gray-700"
                                                            onClick={() => handleMoveColumn(idx, idx - 1)}
                                                            disabled={idx === 0}
                                                            aria-label="انتقال به چپ"
                                                        >
                                                            <ArrowLeft className="h-3 w-3" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>انتقال به چپ</TooltipContent>
                                                </Tooltip>
                                                
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-3 w-6 text-gray-500 hover:text-gray-700"
                                                            onClick={() => handleMoveColumn(idx, idx + 1)}
                                                            disabled={idx === safeHeaders.length - 1}
                                                            aria-label="انتقال به راست"
                                                        >
                                                            <ArrowRight className="h-3 w-3" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>انتقال به راست</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                </TableHead>
                            ))}
                            
                            {/* Row actions header */}
                            <TableHead className="w-12 bg-gray-50 p-0">
                                <div className="flex items-center justify-center h-12 text-gray-500">
                                    اقدامات
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                        {safeRows.length === 0 ? (
                            <TableRow>
                                <TableCell 
                                    colSpan={safeHeaders.length + 1} 
                                    className="text-center text-gray-400 py-8"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="bg-gray-100 p-3 rounded-full">
                                            <Plus className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm">هیچ داده‌ای وجود ندارد</p>
                                        <Button 
                                            variant="link" 
                                            size="sm"
                                            onClick={handleAddRow}
                                            className="mt-2"
                                        >
                                            افزودن اولین سطر
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            safeRows.map((row, rowIdx) => (
                                <TableRow 
                                    key={row.id} 
                                    className="hover:bg-gray-50"
                                    onMouseEnter={() => setActiveRow(rowIdx)}
                                    onMouseLeave={() => setActiveRow(null)}
                                >
                                    {row.values.map((cell, colIdx) => (
                                        <TableCell key={colIdx} className="p-0 border-r">
                                            <div className="px-3 py-2 h-14 flex items-center">
                                                {editingCell && editingCell.row === rowIdx && editingCell.col === colIdx ? (
                                                    <Input
                                                        className="w-full h-8 px-2 text-sm"
                                                        value={cellValue}
                                                        onChange={e => setCellValue(e.target.value)}
                                                        onBlur={() => handleCellBlur(rowIdx, colIdx)}
                                                        onKeyDown={e => e.key === "Enter" && handleCellBlur(rowIdx, colIdx)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div 
                                                        className="w-full cursor-pointer truncate"
                                                        onClick={() => handleCellEdit(rowIdx, colIdx)}
                                                    >
                                                        {cell || <span className="text-gray-400">برای ویرایش کلیک کنید</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                    ))}
                                    
                                    <TableCell className="p-0">
                                        <div className="flex items-center justify-center h-14">
                                            <div className={`flex gap-2 transition-opacity ${activeRow === rowIdx ? 'opacity-100' : 'opacity-0'}`}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                            onClick={() => handleRemoveRow(rowIdx)}
                                                            aria-label="حذف سطر"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>حذف سطر</TooltipContent>
                                                </Tooltip>
                                                
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                                                            onClick={() => handleCellEdit(rowIdx, 0)}
                                                            aria-label="ویرایش سطر"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>ویرایش سطر</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {safeRows.length > 0 && (
                <div className="mt-4 flex justify-center">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddRow}
                        className="flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        افزودن سطر جدید
                    </Button>
                </div>
            )}
        </div>
    );
};

ExamplesTable.displayName = "ExamplesTable";