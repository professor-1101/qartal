"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Plus, Trash } from "lucide-react";

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

    // Add column
    const handleAddColumn = () => {
        const newHeaders = [...headers, `Column ${headers.length + 1}`];
        const newRows = rows.map(row => ({ ...row, values: [...row.values, ""] }));
        onChange(newHeaders, newRows);
    };
    // Remove column
    const handleRemoveColumn = (colIdx: number) => {
        const newHeaders = headers.filter((_, i) => i !== colIdx);
        const newRows = rows.map(row => ({ ...row, values: row.values.filter((_, i) => i !== colIdx) }));
        onChange(newHeaders, newRows);
    };
    // Edit header
    const handleHeaderEdit = (idx: number) => {
        setEditingHeader(idx);
        setHeaderValue(headers[idx]);
    };
    const handleHeaderBlur = (idx: number) => {
        const newHeaders = [...headers];
        newHeaders[idx] = headerValue;
        onChange(newHeaders, rows);
        setEditingHeader(null);
    };
    // Add row
    const handleAddRow = () => {
        const newRow = { id: Math.random().toString(36).slice(2), values: headers.map(() => "") };
        onChange(headers, [...rows, newRow]);
    };
    // Remove row
    const handleRemoveRow = (rowIdx: number) => {
        const newRows = rows.filter((_, i) => i !== rowIdx);
        onChange(headers, newRows);
    };
    // Edit cell
    const handleCellEdit = (rowIdx: number, colIdx: number) => {
        setEditingCell({ row: rowIdx, col: colIdx });
        setCellValue(rows[rowIdx].values[colIdx]);
    };
    const handleCellBlur = (rowIdx: number, colIdx: number) => {
        const newRows = rows.map((row, i) =>
            i === rowIdx ? { ...row, values: row.values.map((v, j) => (j === colIdx ? cellValue : v)) } : row
        );
        onChange(headers, newRows);
        setEditingCell(null);
    };

    return (
        <div className="border rounded-lg p-6 bg-background shadow-md">
            <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-sm">Examples</span>
                <Button variant="outline" size="sm" onClick={handleAddColumn} aria-label="Add column">
                    <Plus className="h-4 w-4 ml-1" /> Add Column
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map((header, idx) => (
                            <TableHead key={idx} className="relative group">
                                {editingHeader === idx ? (
                                    <input
                                        className="text-xs px-2 py-1 border rounded w-24"
                                        value={headerValue}
                                        onChange={e => setHeaderValue(e.target.value)}
                                        onBlur={() => handleHeaderBlur(idx)}
                                        onKeyDown={e => e.key === "Enter" && handleHeaderBlur(idx)}
                                        autoFocus
                                        aria-label={`Edit header ${idx}`}
                                    />
                                ) : (
                                    <span
                                        className="cursor-pointer hover:underline"
                                        onClick={() => handleHeaderEdit(idx)}
                                        aria-label={`Header ${idx}`}
                                    >
                                        {header}
                                    </span>
                                )}
                                {headers.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100"
                                        onClick={() => handleRemoveColumn(idx)}
                                        aria-label={`Remove column ${idx}`}
                                    >
                                        <Trash className="h-3 w-3" />
                                    </Button>
                                )}
                            </TableHead>
                        ))}
                        <TableHead>
                            <Button variant="outline" size="sm" onClick={handleAddRow} aria-label="Add row">
                                <Plus className="h-3 w-3 ml-1" /> Row
                            </Button>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={headers.length + 1} className="text-right text-gray-400 text-xs py-2">هیچ ردیفی برای مثال وجود ندارد. یک ردیف اضافه کنید!</TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row, rowIdx) => (
                            <TableRow key={row.id}>
                                {row.values.map((cell, colIdx) => (
                                    <TableCell key={colIdx}>
                                        {editingCell && editingCell.row === rowIdx && editingCell.col === colIdx ? (
                                            <input
                                                className="text-xs px-2 py-1 border rounded w-20"
                                                value={cellValue}
                                                onChange={e => setCellValue(e.target.value)}
                                                onBlur={() => handleCellBlur(rowIdx, colIdx)}
                                                onKeyDown={e => e.key === "Enter" && handleCellBlur(rowIdx, colIdx)}
                                                autoFocus
                                                aria-label={`Edit cell ${rowIdx}-${colIdx}`}
                                            />
                                        ) : (
                                            <span
                                                className="cursor-pointer hover:underline"
                                                onClick={() => handleCellEdit(rowIdx, colIdx)}
                                                aria-label={`Cell ${rowIdx}-${colIdx}`}
                                            >
                                                {cell}
                                            </span>
                                        )}
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveRow(rowIdx)}
                                        className="flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-700 p-1 rounded-full"
                                        aria-label="حذف سطر"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

ExamplesTable.displayName = "ExamplesTable";