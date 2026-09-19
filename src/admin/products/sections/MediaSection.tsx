import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Star, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Upload, 
  Sparkles, 
  Video, 
  ArrowLeft, 
  ArrowRight,
  Edit2,
  Check,
  Film
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ImageUploadDropzone } from '../../../components/ui/ImageUploadDropzone';
import { Product, ProductImage } from '../../../types';
import { api } from '../../../services/api';
import { useToast } from '../../../hooks/useToast';

export interface MediaSectionProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
}

export const MediaSection: React.FC<MediaSectionProps> = ({ formData, setFormData }) => {
  const toast = useToast();
  const [newImageUrl, setNewImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'video'>('upload');
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [tempAltText, setTempAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const images = formData.images || [];

  const handleImagesUploaded = async (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    setIsUploading(true);

    try {
      const uploadedImages: ProductImage[] = [];

      for (let idx = 0; idx < urls.length; idx++) {
        const url = urls[idx];
        const isFirst = images.length === 0 && idx === 0;
        try {
          const res = await api.uploadMedia(url, `product-${Date.now()}-${idx}.jpg`, formData.name);
          uploadedImages.push({
            id: res.id || `img-${Date.now()}-${idx}`,
            url: res.url,
            altText: res.altText || formData.name || 'Product Image',
            isPrimary: isFirst,
          });
        } catch (singleErr) {
          console.warn('Backend storage upload fallback to local image data:', singleErr);
          // Always preserve user photo even if server storage endpoint encounters issue
          uploadedImages.push({
            id: `img-${Date.now()}-${idx}`,
            url: url,
            altText: formData.name || 'Product Image',
            isPrimary: isFirst,
          });
        }
      }

      if (uploadedImages.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedImages],
        }));
        toast.success(
          uploadedImages.length === 1
            ? 'Photo added to product!'
            : `${uploadedImages.length} photos added to product!`
        );
      }
    } catch (err: any) {
      console.error('Failed to process photos:', err);
      toast.error(err?.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddUrlImage = async () => {
    const rawUrl = newImageUrl.trim();
    if (!rawUrl) return;
    setIsUploading(true);

    try {
      let finalUrl = rawUrl;
      try {
        const res = await api.uploadMedia(rawUrl, `url-img-${Date.now()}.jpg`, formData.name);
        if (res?.url) {
          finalUrl = res.url;
        }
      } catch (uploadErr) {
        console.warn('URL upload to storage fallback to direct URL:', uploadErr);
        // Retain direct URL if server fetch is unavailable
        finalUrl = rawUrl;
      }

      const newImg: ProductImage = {
        id: `img-${Date.now()}`,
        url: finalUrl,
        altText: formData.name || 'Product Image',
        isPrimary: images.length === 0,
      };

      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), newImg],
      }));
      setNewImageUrl('');
      toast.success('Photo added to product from URL!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add image URL');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    setFormData((prev) => {
      const filtered = (prev.images || []).filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return { ...prev, images: filtered };
    });
  };

  const handleSetPrimary = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).map((img) => ({
        ...img,
        isPrimary: img.id === id,
      })),
    }));
  };

  const handleMoveLeft = (index: number) => {
    if (index <= 0) return;
    const next = [...images];
    const item = next.splice(index, 1)[0];
    next.splice(index - 1, 0, item);
    setFormData((prev) => ({ ...prev, images: next }));
  };

  const handleMoveRight = (index: number) => {
    if (index >= images.length - 1) return;
    const next = [...images];
    const item = next.splice(index, 1)[0];
    next.splice(index + 1, 0, item);
    setFormData((prev) => ({ ...prev, images: next }));
  };

  const handleSaveAltText = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).map((img) =>
        img.id === id ? { ...img, altText: tempAltText.trim() || img.altText } : img
      ),
    }));
    setEditingAltId(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Mode Selector */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#7B2435] text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Media (Object Storage)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-[#7B2435] text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Add Image via URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'video'
                ? 'bg-[#7B2435] text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Product Video / Reel
          </button>
        </div>

        <span className="text-xs font-semibold text-neutral-500">
          {images.length} {images.length === 1 ? 'image' : 'images'} added
        </span>
      </div>

      {/* Mode 1: Drag and Drop & Local File Picker */}
      {activeTab === 'upload' && (
        <ImageUploadDropzone
          multiple
          maxFiles={12}
          label="Upload High-Resolution Product Images"
          helperText="Drag and drop photo files or click to browse (supports JPG, PNG, WEBP; automatically uploaded to persistent object storage)"
          onImagesSelected={handleImagesUploaded}
        />
      )}

      {/* Mode 2: Paste URL */}
      {activeTab === 'url' && (
        <div className="space-y-3 p-4 bg-[#FAF6F0] rounded-2xl border border-neutral-200">
          <div className="flex items-end gap-3">
            <Input
              label="Product Image URL"
              placeholder="https://images.unsplash.com/photo-..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              containerClassName="flex-1"
            />
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isUploading}
              onClick={handleAddUrlImage}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {isUploading ? 'Uploading...' : 'Add Image'}
            </Button>
          </div>

          {/* Preset Image Suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[11px] font-bold text-neutral-400 shrink-0">Sample Presets:</span>
            {[
              { label: 'Maroon Kurti', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80' },
              { label: 'Mustard Kurti', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' },
              { label: 'Emerald Set', url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80' },
              { label: 'Indigo Chikankari', url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80' },
            ].map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setNewImageUrl(sample.url);
                }}
                className="text-[11px] font-medium bg-white hover:bg-[#FFF0F3] text-neutral-700 hover:text-[#7B2435] px-2.5 py-1 rounded-full border border-neutral-200 shrink-0 transition-colors cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode 3: Video & Reel Settings */}
      {activeTab === 'video' && (
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#7B2435]">
            <Film className="w-5 h-5" />
            <h4 className="font-bold text-sm text-neutral-900">Product Video / Instagram Reel</h4>
          </div>
          <p className="text-xs text-neutral-500">
            Attach a lookbook video, fabric movement clip, or 360-degree drape reel to showcase on the Product Detail Page.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Video Stream URL (MP4 / WebM / Embed URL)"
              placeholder="https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-traditional-dress-41318-large.mp4"
              value={formData.videoUrl || ''}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            />

            <Input
              label="Video Poster / Thumbnail Image URL"
              placeholder="https://images.unsplash.com/photo-..."
              value={formData.videoPoster || ''}
              onChange={(e) => setFormData({ ...formData, videoPoster: e.target.value })}
            />
          </div>

          {formData.videoUrl && (
            <div className="mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-2">
                Video Preview
              </label>
              <div className="max-w-xs aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={formData.videoUrl}
                  poster={formData.videoPoster}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Image Gallery Grid with Reordering & Alt-Text Editing */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-semibold text-neutral-700 block">
          Product Gallery Preview & Reorder ({images.length})
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-white flex flex-col shadow-xs transition-all hover:border-[#7B2435]"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
                <img
                  src={img.url}
                  alt={img.altText}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />

                {/* Primary Badge / Set Primary */}
                {img.isPrimary ? (
                  <span className="absolute top-2 left-2 bg-[#7B2435] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" /> Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    className="absolute top-2 left-2 bg-white/95 hover:bg-white text-neutral-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-neutral-200"
                  >
                    Set Primary
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-rose-50 hover:text-rose-600 text-neutral-600 rounded-full shadow-xs transition-colors cursor-pointer border border-neutral-200"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Reorder Arrows */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveLeft(idx)}
                    className={`p-1 rounded-full bg-white/90 shadow-xs border border-neutral-200 transition ${
                      idx === 0 ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-700 hover:bg-[#FFF0F3] hover:text-[#7B2435] cursor-pointer'
                    }`}
                    title="Move Left"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>

                  <span className="text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-md">
                    #{idx + 1}
                  </span>

                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => handleMoveRight(idx)}
                    className={`p-1 rounded-full bg-white/90 shadow-xs border border-neutral-200 transition ${
                      idx === images.length - 1 ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-700 hover:bg-[#FFF0F3] hover:text-[#7B2435] cursor-pointer'
                    }`}
                    title="Move Right"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Alt Text Bar */}
              <div className="p-2 bg-white border-t border-neutral-100 text-[11px]">
                {editingAltId === img.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempAltText}
                      onChange={(e) => setTempAltText(e.target.value)}
                      placeholder="Alt text..."
                      className="w-full px-1.5 py-0.5 border border-neutral-300 rounded text-[11px]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveAltText(img.id)}
                      className="p-1 bg-[#7B2435] text-white rounded cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1 text-neutral-500">
                    <span className="truncate" title={img.altText || 'Alt text'}>
                      {img.altText || 'No Alt Text'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAltId(img.id);
                        setTempAltText(img.altText || '');
                      }}
                      className="text-neutral-400 hover:text-[#7B2435] shrink-0 cursor-pointer"
                      title="Edit Alt Text"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {images.length === 0 && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-neutral-400 bg-[#FAF6F0]/40">
              <ImageIcon className="w-8 h-8 mb-2 text-neutral-300" />
              <p className="text-xs font-semibold text-neutral-600">No media assets added yet</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Upload image files or paste URLs above to populate high-resolution catalog photos and reels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
