import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  EyeOff,
  Trash2,
  Search,
  Filter,
  Check,
  Clock,
  ShieldCheck,
  Image as ImageIcon,
  ThumbsUp,
} from 'lucide-react';
import {
  useGetReviewsQuery,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation,
  useGetProductsQuery,
} from '../../store/api/ecommerceApi';
import { ProductReview } from '../../types';

export const ReviewModerator: React.FC = () => {
  const { data: reviews = [], isLoading, refetch } = useGetReviewsQuery();
  const { data: products = [] } = useGetProductsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateReviewStatusMutation();
  const [deleteReviewMutation, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Pending' | 'Rejected' | 'Hidden'>('All');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Map product details to reviews
  const reviewsWithProducts = useMemo(() => {
    return reviews.map((r) => {
      const prod = products.find((p) => p.id === r.productId);
      return {
        ...r,
        productName: prod?.name || 'Vedaaya Kurti',
        productImage: prod?.images?.[0]?.url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=100&q=80',
        productSlug: prod?.slug || '',
      };
    });
  }, [reviews, products]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviewsWithProducts.filter((r) => {
      const matchSearch =
        r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.title && r.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'All' ? true : (r.status || 'Approved') === statusFilter;
      const matchRating = ratingFilter === 'all' ? true : r.rating === ratingFilter;

      return matchSearch && matchStatus && matchRating;
    });
  }, [reviewsWithProducts, searchQuery, statusFilter, ratingFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'Pending').length;
    const approved = reviews.filter((r) => (r.status || 'Approved') === 'Approved').length;
    const rejected = reviews.filter((r) => r.status === 'Rejected' || r.status === 'Hidden').length;
    const avgRating = total > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / total).toFixed(1) : '5.0';

    return { total, pending, approved, rejected, avgRating };
  }, [reviews]);

  const handleStatusChange = async (id: string, newStatus: 'Approved' | 'Pending' | 'Rejected' | 'Hidden') => {
    await updateStatus({ id, status: newStatus });
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this customer review?')) {
      await deleteReviewMutation(id);
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900">Review & Rating Moderation</h1>
            <span className="bg-[#7B2435]/10 text-[#7B2435] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {reviews.length} Customer Reviews
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Moderate customer feedback, approve verified buyer testimonials, filter spam, and manage UGC media.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#FAF6F0] p-3 rounded-2xl border border-[#EADBDA]">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase">Store Average</p>
            <p className="text-base font-bold text-neutral-900">{stats.avgRating} / 5.0</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Total Reviews</p>
            <p className="text-lg font-bold text-neutral-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-amber-700 font-medium">Pending Moderation</p>
            <p className="text-lg font-bold text-amber-900">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-emerald-700 font-medium">Approved & Visible</p>
            <p className="text-lg font-bold text-emerald-900">{stats.approved}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center font-bold">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Rejected / Hidden</p>
            <p className="text-lg font-bold text-neutral-700">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="input-reviews-search"
            type="text"
            placeholder="Search reviews by customer, product, comment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#7B2435]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            {(['All', 'Pending', 'Approved', 'Rejected', 'Hidden'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Rating Dropdown */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-700 font-medium"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-neutral-200">
          <p className="text-neutral-500 text-sm animate-pulse">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-neutral-200">
          <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No reviews found</h3>
          <p className="text-xs text-neutral-500 mt-1">Try relaxing your search keywords or status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const isApproved = (rev.status || 'Approved') === 'Approved';
            const isPending = rev.status === 'Pending';
            const isRejected = rev.status === 'Rejected';
            const isHidden = rev.status === 'Hidden';

            return (
              <div
                key={rev.id}
                id={`review-card-${rev.id}`}
                className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-300 transition-colors flex flex-col md:flex-row gap-5 justify-between"
              >
                {/* Left Content */}
                <div className="flex-1 space-y-3">
                  {/* Header Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.productImage}
                        alt={rev.productName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-cover border border-neutral-200"
                      />
                      <div>
                        <p className="font-bold text-sm text-neutral-900">{rev.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-neutral-600 font-semibold">{rev.userName}</span>
                          {rev.isVerifiedBuyer && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> Verified Buyer
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-400">
                            {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isPending
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                      }`}
                    >
                      {rev.status || 'Approved'}
                    </span>
                  </div>

                  {/* Rating Stars & Title */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-neutral-200 text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.title && <p className="font-bold text-xs text-neutral-900">{rev.title}</p>}
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-neutral-700 leading-relaxed bg-[#FAF6F0]/60 p-3 rounded-xl border border-[#EADBDA]/60">
                    "{rev.comment}"
                  </p>

                  {/* Customer UGC Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-neutral-500 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" /> Customer Photos:
                      </span>
                      {rev.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Customer feedback photo"
                          referrerPolicy="no-referrer"
                          onClick={() => setSelectedPhoto(img)}
                          className="w-10 h-10 rounded-lg object-cover border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </div>
                  )}

                  {/* Likes Count */}
                  {(rev.helpfulCount ?? 0) > 0 && (
                    <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-neutral-400" />
                      {rev.helpfulCount} people found this helpful
                    </p>
                  )}
                </div>

                {/* Right Action Controls */}
                <div className="flex md:flex-col justify-end items-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-neutral-100 pt-3 md:pt-0 md:pl-5">
                  {!isApproved && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'Approved')}
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}

                  {!isRejected && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'Rejected')}
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}

                  {!isHidden && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'Hidden')}
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Image Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <img
              src={selectedPhoto}
              alt="Customer photo enlarged"
              referrerPolicy="no-referrer"
              className="w-full h-auto rounded-xl object-contain max-h-[70vh]"
            />
            <p className="text-center text-xs text-neutral-500 mt-2">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
};
