import React, { useState } from 'react';
import { X, Star, Upload, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Product } from '../../types';

interface WriteReviewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  product,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const { user, loginWithGoogle } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [fit, setFit] = useState<'True to Size' | 'Runs Small' | 'Runs Large'>('True to Size');
  const [sizePurchased, setSizePurchased] = useState('XL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      loginWithGoogle();
      return;
    }
    if (!comment.trim()) return;

    setIsSubmitting(true);
    await api.addReview({
      productId: product.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      rating,
      title: title.trim() || 'Wonderful ethnic wear',
      comment: `${comment.trim()} (Fit feedback: ${fit})`,
      variantInfo: `${product.variants[0]?.color || 'Default'} / ${sizePurchased}`,
      isVerifiedPurchase: true,
    });

    setIsSubmitting(false);
    onReviewSubmitted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#F0E6E1] animate-fade-in overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E6E1] mb-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-900">
              Write a Verified Customer Review
            </h3>
            <p className="text-xs text-neutral-500 truncate max-w-xs">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-neutral-300 hover:text-amber-400 transition"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-neutral-700 ml-2">
                {rating === 5 ? 'Exceptional (5/5)' : `${rating}/5 Stars`}
              </span>
            </div>
          </div>

          {/* Size purchased & Fit Feedback */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Size Purchased
              </label>
              <select
                value={sizePurchased}
                onChange={(e) => setSizePurchased(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-[#7B2435]"
              >
                {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                How Was The Fit?
              </label>
              <select
                value={fit}
                onChange={(e) => setFit(e.target.value as any)}
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-[#7B2435]"
              >
                <option value="True to Size">True to Size (Perfect)</option>
                <option value="Runs Small">Runs a little small</option>
                <option value="Runs Large">Runs a little loose</option>
              </select>
            </div>
          </div>

          {/* Review Headline */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Review Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gorgeous fabric, received so many compliments!"
              className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-xs text-neutral-800 focus:outline-none focus:border-[#7B2435]"
            />
          </div>

          {/* Detailed Comment */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-1">
              Detailed Feedback *
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about fabric quality, embroidery finish, wash durability, and comfort..."
              className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl p-3.5 text-xs text-neutral-800 focus:outline-none focus:border-[#7B2435]"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#7B2435] hover:bg-[#621c2a] text-white font-bold text-xs rounded-full transition shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Posting Review...' : 'Submit Verified Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
