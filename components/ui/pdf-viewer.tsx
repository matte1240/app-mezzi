"use client";

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { cn } from "@/lib/utils";

// Configure worker
// Using unpkg as a reliable fallback for development environments where local worker resolution might be tricky
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error("PDF Load Error:", err);
    setError("Impossibile caricare il documento PDF.");
  }

  const changePage = (offset: number) => {
    setPageNumber(prevPage => {
      const newPage = prevPage + offset;
      return Math.min(Math.max(1, newPage), numPages);
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2 bg-white border-b border-slate-200 gap-2">
        <div className="flex items-center gap-1 bg-slate-100 rounded-md p-1">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all text-slate-600"
            title="Precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium px-2 min-w-[3rem] text-center text-slate-700">
            {pageNumber} / {numPages || '--'}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all text-slate-600"
            title="Successiva"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-md p-1">
          <button
            onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium px-2 min-w-[3.5rem] text-center text-slate-700">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(s + 0.1, 3.0))}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-md p-1">
           <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600"
            title="Ruota"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex justify-center p-4">
        {error ? (
          <div className="flex flex-col items-center justify-center text-red-500 h-full">
            <p className="font-semibold">{error}</p>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Caricamento documento...</p>
              </div>
            }
            className="max-w-full"
          >
            <div className={cn("shadow-lg transition-transform origin-top", rotation !== 0 && "transition-all duration-200")}>
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                rotate={rotation}
                loading={
                  <div className="h-[600px] w-[400px] bg-white animate-pulse rounded shadow" />
                }
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white"
              />
            </div>
          </Document>
        )}
      </div>
    </div>
  );
}
