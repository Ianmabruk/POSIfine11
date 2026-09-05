import { useState, useEffect } from 'react';
import { wholesaleProducts } from '../../services/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import ProductFormModal from '../../components/network/WholesaleProductFormModal';

export default function WholesaleProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await wholesaleProducts.getAll(); setProducts(r.products || []); }
    catch (e) { console.error(e); setProducts([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (p) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    try { await wholesaleProducts.delete(p.id); setProducts(products.filter((x) => x.id !== p.id)); }
    catch (e) { alert(e.message || 'Failed'); }
  };

  const onSaved = (p) => {
    setProducts(p ? [...products.filter((x) => x.id !== p.id), p] : products);
    // if created, p is the new one; if null refresh
    if (!p) load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Wholesale Products</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search products..." className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
      </div>

      {loading ? <div className="space-y-2">[loading]</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2">Name</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Stock</th><th className="px-3 py-2">Min Order</th><th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">{p.name}</td><td className="px-3 py-2">{p.sku}</td>
                  <td className="px-3 py-2">KES {p.price}</td><td className="px-3 py-2">{p.availableQuantity}</td>
                  <td className="px-3 py-2">{p.minOrderQuantity}</td>
                  <td className="px-3 py-2">{p.isActive ? 'Active' : 'Draft'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-1 text-gray-600 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => remove(p)} className="p-1 text-gray-600 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormModal open={showForm} onClose={() => setShowForm(false)} product={editing} onSaved={onSaved} />
    </div>
  );
}
