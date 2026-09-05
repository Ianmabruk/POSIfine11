import { useState, useEffect } from 'react';
import { wholesaleProducts } from '../../services/api';

export default function WholesaleProductFormModal({ open, onClose, product, onSaved }) {
  if (!open) return null;
  const isEdit = !!product;
  const [form, setForm] = useState(_blank());

  useEffect(() => {
    setForm({
      ..._blank(),
      ...(product || {}),
      price: product?.price ?? '', cost: product?.cost ?? '',
      availableQuantity: product?.availableQuantity ?? 0,
      minOrderQuantity: product?.minOrderQuantity ?? 1,
      isActive: product?.isActive ?? true,
    });
  }, [product]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    try {
      if (isEdit) await wholesaleProducts.update(product.id, form);
      else await wholesaleProducts.create(form);
      onSaved(isEdit ? { ...product, ...form } : null);
      onClose();
    } catch (e) { alert(e.message || 'Failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold mb-4">{isEdit ? 'Edit' : 'Add'} Wholesale Product</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <F label="Name" name="name" val={form.name} set={setField} />
          <F label="SKU" name="sku" val={form.sku} set={setField} />
          <F label="Category" name="category" val={form.category} set={setField} />
          <F label="Unit" name="unit" val={form.unit} set={setField} />
          <F label="Price" type="number" name="price" val={form.price} set={setField} />
          <F label="Cost" type="number" name="cost" val={form.cost} set={setField} />
          <F label="Available Qty" type="number" name="availableQuantity" val={form.availableQuantity} set={setField} />
          <F label="Min Order Qty" type="number" name="minOrderQuantity" val={form.minOrderQuantity} set={setField} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description || ''} onChange={(e) => setField('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={3} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
          <button onClick={submit} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}

function _blank() {
  return { name: '', description: '', sku: '', category: '', unit: 'pcs',
    price: '', cost: '', availableQuantity: 0, minOrderQuantity: 1, image: '', isActive: true };
}
function F({ label, name, val, set, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={val ?? ''}
        onChange={(e) => set(name, type === 'number' ? e.target.value : e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
    </div>
  );
}
