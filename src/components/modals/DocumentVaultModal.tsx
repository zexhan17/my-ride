import React, { useState, useRef } from 'react';
import { useVehicle } from '../../context/VehicleContext';
import { useToast } from '../ui/Toast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Eye,
  Calendar,
  AlertTriangle,
  Plus,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { formatDate, getDaysRemaining, compressImageBase64 } from '../../lib/utils';
import type { VehicleDocument, DocumentCategory } from '../../types';

interface DocumentVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentVaultModal({ isOpen, onClose }: DocumentVaultModalProps) {
  const { activeVehicle, documents, addDocument, deleteDocument } = useVehicle();
  const { success, error } = useToast();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<VehicleDocument | null>(null);

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('rc');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeVehicle) return null;

  const filteredDocuments = documents.filter(doc => {
    if (activeCategory === 'all') return true;
    return doc.category === activeCategory;
  });

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      error('Please select an image or document file.');
      return;
    }
    if (!title.trim()) {
      error('Please enter a document title.');
      return;
    }

    try {
      setIsUploading(true);
      const base64Data = await compressImageBase64(selectedFile);

      await addDocument({
        vehicleId: activeVehicle.id,
        title: title.trim(),
        category,
        fileData: base64Data,
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'application/octet-stream',
        fileSize: selectedFile.size,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
      });

      success(`Document "${title}" saved to offline vault!`);
      // Reset form
      setShowUploadForm(false);
      setTitle('');
      setCategory('rc');
      setExpiryDate('');
      setNotes('');
      setSelectedFile(null);
    } catch (err: any) {
      error('Failed to save document', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: VehicleDocument) => {
    if (window.confirm(`Delete document "${doc.title}"?`)) {
      await deleteDocument(doc.id);
      success('Document removed from vault.');
    }
  };

  const handleDownload = (doc: VehicleDocument) => {
    const a = document.createElement('a');
    a.href = doc.fileData;
    a.download = doc.fileName || `${doc.title}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="Offline Document Vault & Bills"
        description={`Secure local documents, insurance, PUC, and receipts for ${activeVehicle.name}`}
        maxWidth="3xl"
      >
        <div className="space-y-4">
          {/* Top Category Filter & Add Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'rc', label: 'RC' },
                { id: 'insurance', label: 'Insurance' },
                { id: 'puc', label: 'PUC' },
                { id: 'invoice', label: 'Invoices' },
                { id: 'photo', label: 'Photos' },
                { id: 'other', label: 'Other' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${activeCategory === cat.id
                      ? 'bg-foreground text-background font-semibold'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant={showUploadForm ? 'secondary' : 'default'}
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="gap-1.5 text-xs shrink-0 h-8"
            >
              {showUploadForm ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document / Bill</span>
                </>
              )}
            </Button>
          </div>

          {/* Upload Form (Expandable) */}
          {showUploadForm && (
            <form onSubmit={handleSaveDocument} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Upload New Document or Invoice Scan
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Document Title *</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Royal Enfield RC Book / Bill"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
                  <Select
                    value={category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as DocumentCategory)}
                    className="h-9 text-xs sm:text-sm"
                  >
                    <option value="rc">RC (Registration Certificate)</option>
                    <option value="insurance">Insurance Policy</option>
                    <option value="puc">PUC (Pollution Certificate)</option>
                    <option value="invoice">Service / Parts Invoice</option>
                    <option value="warranty">Warranty Card</option>
                    <option value="photo">Vehicle Photo</option>
                    <option value="other">Other</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Expiry / Renewal Date (Optional)</label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Notes (Optional)</label>
                  <Input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Policy number, agency or details"
                  />
                </div>
              </div>

              {/* File input */}
              <div className="space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFilePick}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border border-dashed border-border rounded-lg text-center hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    {selectedFile ? selectedFile.name : 'Click to choose image or PDF'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Photos are automatically compressed to stay fast offline
                  </span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUploading || !selectedFile}
                  className="text-xs font-semibold gap-1.5 h-8"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Compressing & Saving...' : 'Save to Vault'}</span>
                </Button>
              </div>
            </form>
          )}

          {/* Documents Grid */}
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-foreground">No documents in vault</p>
              <p className="text-xs text-muted-foreground">
                Upload your RC, Insurance policy, PUC, or repair receipts for offline storage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
              {filteredDocuments.map(doc => {
                const expiry = doc.expiryDate ? getDaysRemaining(doc.expiryDate) : null;
                const isImage = doc.fileData.startsWith('data:image/');

                return (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Thumbnail / Icon */}
                      <div
                        onClick={() => setSelectedDocForPreview(doc)}
                        className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {isImage ? (
                          <img src={doc.fileData} alt={doc.title} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-6 h-6 text-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-foreground truncate" title={doc.title}>
                            {doc.title}
                          </h4>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono py-0 px-1">
                            {doc.category}
                          </Badge>
                        </div>

                        {doc.expiryDate && expiry && (
                          <div className="flex items-center gap-1 mt-1 text-[11px]">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className={expiry.isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                              {expiry.label} ({formatDate(doc.expiryDate)})
                            </span>
                          </div>
                        )}

                        {doc.notes && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={doc.notes}>
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {Math.round(doc.fileSize / 1024)} KB
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelectedDocForPreview(doc)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Preview document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(doc)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(doc)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Delete from vault"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Dialog>

      {/* Fullscreen Preview Modal */}
      {selectedDocForPreview && (
        <Dialog
          isOpen={!!selectedDocForPreview}
          onClose={() => setSelectedDocForPreview(null)}
          title={selectedDocForPreview.title}
          description={`Uploaded on ${formatDate(selectedDocForPreview.createdAt)}`}
          maxWidth="3xl"
        >
          <div className="space-y-4">
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/40 rounded-lg p-2">
              {selectedDocForPreview.fileData.startsWith('data:image/') ? (
                <img
                  src={selectedDocForPreview.fileData}
                  alt={selectedDocForPreview.title}
                  className="max-h-[65vh] w-auto object-contain rounded-md"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-foreground mx-auto" />
                  <p className="text-sm font-semibold text-foreground">{selectedDocForPreview.fileName}</p>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(selectedDocForPreview)}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Document</span>
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Category: <strong className="text-foreground uppercase">{selectedDocForPreview.category}</strong>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(selectedDocForPreview)}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to Device</span>
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
