import { useState, useEffect, useRef } from 'react';
import { products } from '../services/api';
import { Camera, X, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const MAX_IMAGE_DIMENSION = 1200;
const IMAGE_QUALITY = 0.8;

const optimizeImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = mimeType === 'image/jpeg' ? IMAGE_QUALITY : undefined;
        resolve(canvas.toDataURL(mimeType, quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
};

export default function MobileAddProductModal({ isOpen, onClose, onProductCreated, userType = 'user' }) {
  const [form, setForm] = useState({
    name: '',
    price: '',
    cost: '',
    category: 'finished',
    unit: 'pcs',
    quantity: '0',
    visibleToCashier: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const resetForm = () => {
    setForm({
      name: '',
      price: '',
      cost: '',
      category: 'finished',
      unit: 'pcs',
      quantity: '0',
      visibleToCashier: true
    });
    setImageFile(null);
    setImagePreview('');
    setImageError('');
    setErrors({});
    setIsSubmitting(false);
    setIsImageLoading(false);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    setImageError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Image is too large. Maximum allowed size is 10 MB.`);
      return;
    }

    setIsImageLoading(true);
    try {
      const optimized = await optimizeImage(file);
      setImagePreview(optimized);
      setImageFile(optimized);
    } catch {
      setImageError('Failed to process image file');
    } finally {
      setIsImageLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (form.price === '' || form.price === null) {
      newErrors.price = 'Selling price is required';
    } else if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      newErrors.price = 'Enter a valid price';
    }
    if (form.cost !== '' && (!Number.isFinite(Number(form.cost)) || Number(form.cost) < 0)) {
      newErrors.cost = 'Enter a valid cost';
    }
    if (form.quantity !== '' && (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) < 0)) {
      newErrors.quantity = 'Enter a valid initial stock';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const parsedPrice = Number(form.price);
      const parsedCost = form.cost === '' ? null : Number(form.cost);
      const parsedQuantity = Number(form.quantity || 0);

      const productData = {
        name: form.name.trim(),
        price: parsedPrice,
        quantity: parsedQuantity,
        category: form.category,
        unit: form.unit,
        visibleToCashier: form.visibleToCashier,
        image: imageFile || undefined
      };

      if (parsedCost !== null) {
        productData.cost = parsedCost;
        productData.cost_per_unit = parsedCost;
      }

      const result = await products.create(productData);

      setToast({ type: 'success', message: 'Product added successfully' });

      window.dispatchEvent(new CustomEvent('productsSync', {
        detail: { products: [result], timestamp: Date.now() }
      }));
      window.dispatchEvent(new Event('productUpdated'));

      if (typeof onProductCreated === 'function') {
        onProductCreated(result);
      }
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (error) {
      const message =
        (error && error.message) ||
        (error && error.body && error.body.message) ||
        'Failed to add product. Please try again.';
      setToast({ type: 'error', message: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    'w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="relative w-full max-w-lg max-h-[92vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-20">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-gray-900">Add Product</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mx-4 mt-3 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="break-words">{toast.message}</span>
          </div>
        )}

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom) + 5rem)' }}>
          {/* Product Name */}
          <div>
            <label className={labelClass}>Product Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Coffee Beans"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              autoComplete="off"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Product Image */}
          <div>
            <label className={labelClass}>Product Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:border-primary-400 hover:bg-primary-50 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span className="text-base">{isImageLoading ? 'Processing image...' : 'Tap to add photo'}</span>
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
            {imagePreview && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('');
                    setImageFile(null);
                  }}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
            {imageError && <p className="mt-1 text-sm text-red-600">{imageError}</p>}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Selling Price (KSH) <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass}
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>
            <div>
              <label className={labelClass}>Cost Price (KSH)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00 (optional)"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className={inputClass}
              />
              {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost}</p>}
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                <option value="finished">Finished Product</option>
                <option value="raw">Raw Material</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className={inputClass}
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="L">Liters</option>
                <option value="g">Grams</option>
                <option value="ml">Milliliters</option>
              </select>
            </div>
          </div>

          {/* Initial Stock */}
          <div>
            <label className={labelClass}>Initial Stock</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className={inputClass}
            />
            {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
          </div>

          {/* Visible to cashier */}
          <label className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              checked={form.visibleToCashier}
              onChange={(e) => setForm({ ...form, visibleToCashier: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Visible to Cashier</span>
          </label>
        </form>

        {/* Footer actions */}
        <div className="bg-white border-t border-gray-200 p-4 flex gap-3" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-base hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isImageLoading}
            className="flex-[2] px-4 py-3.5 rounded-xl bg-slate-900 text-white font-semibold text-base hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
