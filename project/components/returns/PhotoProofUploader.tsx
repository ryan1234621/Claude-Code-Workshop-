'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';
import { cn } from '@/app/lib/utils';

const MAX_FILES = 4;
const MAX_MB = 10;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export interface UploadedProof {
  path: string;       // supabase storage path
  publicUrl: string;
  name: string;
  previewUrl: string; // local object URL or storage URL
}

interface PhotoProofUploaderProps {
  returnId: string;   // used as folder key in storage
  value: UploadedProof[];
  onChange: (proofs: UploadedProof[]) => void;
  required?: boolean;
  error?: string;
}

export function PhotoProofUploader({
  returnId,
  value,
  onChange,
  required,
  error,
}: PhotoProofUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploadError(null);
      const list = Array.from(files);
      const remaining = MAX_FILES - value.length;
      if (remaining <= 0) {
        setUploadError(`Maximum ${MAX_FILES} photos allowed.`);
        return;
      }

      const valid = list.slice(0, remaining).filter((f) => {
        if (!ACCEPTED.includes(f.type)) {
          setUploadError('Only JPEG, PNG, WebP, or HEIC images are accepted.');
          return false;
        }
        if (f.size > MAX_MB * 1024 * 1024) {
          setUploadError(`Images must be under ${MAX_MB}MB.`);
          return false;
        }
        return true;
      });

      if (valid.length === 0) return;
      setUploading(true);

      const uploaded: UploadedProof[] = [];
      for (const file of valid) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `returns/${returnId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: storageError } = await supabase.storage
          .from('return-proofs')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (storageError) {
          // Fallback: use a local preview only (for demo environments without bucket)
          uploaded.push({
            path,
            publicUrl: '',
            name: file.name,
            previewUrl: URL.createObjectURL(file),
          });
        } else {
          const { data: urlData } = supabase.storage
            .from('return-proofs')
            .getPublicUrl(path);
          uploaded.push({
            path,
            publicUrl: urlData.publicUrl,
            name: file.name,
            previewUrl: urlData.publicUrl || URL.createObjectURL(file),
          });
        }
      }

      onChange([...value, ...uploaded]);
      setUploading(false);
    },
    [value, onChange, returnId]
  );

  const remove = (path: string) => {
    onChange(value.filter((p) => p.path !== path));
    // Fire-and-forget removal from storage
    supabase.storage.from('return-proofs').remove([path]).catch(() => null);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider uppercase text-parmore-slate">
          Photo Proof {required && <span className="text-red-500">*</span>}
        </p>
        <span className="text-xs text-parmore-slate">
          {value.length}/{MAX_FILES}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-sm cursor-pointer transition-colors',
          dragging
            ? 'border-parmore-gold bg-parmore-gold/5'
            : uploading
            ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed'
            : value.length >= MAX_FILES
            ? 'border-zinc-200 bg-zinc-50 cursor-not-allowed opacity-60'
            : 'border-zinc-200 hover:border-parmore-black hover:bg-zinc-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          disabled={uploading || value.length >= MAX_FILES}
        />

        {uploading ? (
          <Loader2 className="h-8 w-8 text-parmore-slate animate-spin" />
        ) : (
          <Upload className="h-8 w-8 text-parmore-slate" strokeWidth={1.5} />
        )}
        <p className="text-sm text-parmore-slate text-center">
          {uploading
            ? 'Uploading…'
            : value.length >= MAX_FILES
            ? 'Maximum photos reached'
            : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-parmore-slate/60">
          JPEG, PNG, WebP or HEIC · max {MAX_MB}MB each
        </p>
      </div>

      {/* Preview thumbnails */}
      <AnimatePresence>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-4 gap-2 overflow-hidden"
          >
            {value.map((proof) => (
              <motion.div
                key={proof.path}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="relative aspect-square rounded-sm overflow-hidden bg-zinc-100 group"
              >
                {proof.previewUrl ? (
                  <img
                    src={proof.previewUrl}
                    alt={proof.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-zinc-300" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(proof.path); }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-parmore-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {(uploadError || error) && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {uploadError || error}
        </p>
      )}
    </div>
  );
}
