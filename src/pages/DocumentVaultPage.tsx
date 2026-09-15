import React, { useState, useRef } from 'react';
import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
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
  ArrowLeft,
} from 'lucide-react';
import { formatDate, getDaysRemaining, compressImageBase64 } from '../lib/utils';
import type { VehicleDocument, DocumentCategory } from '../types';

interface DocumentVaultPageProps {
  onBack: () => void;
}

export function DocumentVaultPage({ onBack }: DocumentVaultPageProps) {
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
    <div className="max-w-4xl mx-auto space-y-4 pb-32 sm:pb-20">
      {/* Top Back Navigation Bar & Add Document Action */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>

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

      <Card className="border-border">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">Offline Document Vault & Bills</CardTitle>
              <CardDescription className="text-xs">
                Secure local storage for RC, Insurance, PUC, Invoices & Photos ({documents.length})
              </CardDescription>
            </div>

            {/* Category Filter Chips */}
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
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
          {/* Upload Form (Expandable) */}
          {showUploadForm && (
            <form onSubmit={handleSaveDocument} className="p-4 sm:p-5 rounded-xl border border-border bg-muted/20 space-y-3.5 animate-in fade-in-50">
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
                  className="w-full border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 bg-background hover:bg-muted/40 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">
                    {selectedFile ? selectedFile.name : 'Tap to select photo or document scan'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Images are automatically compressed & encrypted into local IndexedDB
                  </p>
                </button>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadForm(false)}
                  className="text-xs h-10 sm:h-8 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUploading}
                  className="text-xs h-10 sm:h-8 w-full sm:w-auto min-w-[120px]"
                >
                  {isUploading ? 'Saving...' : 'Save Document'}
                </Button>
              </div>
            </form>
          )}

          {/* Document Grid */}
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-2">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto stroke-1" />
              <p className="font-medium text-foreground">No documents found</p>
              <p>Upload RC book photos, insurance policies, PUC, or mechanic bills.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDocuments.map(doc => {
                const daysInfo = doc.expiryDate ? getDaysRemaining(doc.expiryDate) : null;
                const isImage = doc.fileData.startsWith('data:image/');

                return (
                  <div
                    key={doc.id}
                    className="group relative rounded-xl border border-border bg-card overflow-hidden flex flex-col hover:border-foreground/40 transition-colors"
                  >
                    {/* Thumbnail / Image preview */}
                    <div
                      className="h-36 bg-muted/40 flex items-center justify-center overflow-hidden cursor-pointer relative touch-manipulation active:opacity-90"
                      onClick={() => setSelectedDocForPreview(doc)}
                    >
                      {isImage ? (
                        <img
                          src={doc.fileData}
                          alt={doc.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <FileText className="w-12 h-12 text-muted-foreground" />
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <span className="text-xs text-white font-medium flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-lg">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tap to Preview</span>
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-xs text-foreground truncate" title={doc.title}>
                            {doc.title}
                          </h4>
                          <Badge variant="outline" className="text-[9px] uppercase font-mono py-0 shrink-0">
                            {doc.category}
                          </Badge>
                        </div>

                        {doc.notes && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{doc.notes}</p>
                        )}
                      </div>

                      {/* Expiry Badge */}
                      {daysInfo && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Expires: {formatDate(doc.expiryDate)}</span>
                          <span
                            className={`ml-auto font-semibold px-1.5 py-0.5 rounded ${daysInfo.isOverdue
                                ? 'text-destructive bg-destructive/10'
                                : daysInfo.days <= 30
                                  ? 'text-amber-500 bg-amber-500/10'
                                  : 'text-muted-foreground bg-muted'
                              }`}
                          >
                            {daysInfo.label}
                          </span>
                        </div>
                      )}

                      {/* Actions footer */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDate(doc.createdAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDownload(doc)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Download Document"
                            aria-label="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(doc)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Delete Document"
                            aria-label="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Document Preview Lightbox */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-background border border-border rounded-xl flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-foreground" />
                <span className="text-xs font-semibold text-foreground">{selectedDocForPreview.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(selectedDocForPreview)}
                  className="h-7 text-xs gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedDocForPreview(null)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/20 max-h-[70vh]">
              {selectedDocForPreview.fileData.startsWith('data:image/') ? (
                <img
                  src={selectedDocForPreview.fileData}
                  alt={selectedDocForPreview.title}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <iframe
                  src={selectedDocForPreview.fileData}
                  title={selectedDocForPreview.title}
                  className="w-full h-[65vh] rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

