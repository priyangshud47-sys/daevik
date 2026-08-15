'use client';

import { useState, useEffect, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  product_file_url: string | null;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // New product form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('149');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products?type=file');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !file) {
      setToast({ message: 'Name, price, and file are required.', type: 'error' });
      return;
    }
    
    setSaving(true);
    let productFileUrl = null;

    try {
      // 1. Upload File
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      
      const uploadText = await uploadRes.text();
      let uploadData;
      try {
        uploadData = JSON.parse(uploadText);
      } catch (e) {
        throw new Error(`Upload failed (Status ${uploadRes.status}): ${uploadText.slice(0, 100)}...`);
      }
      
      if (!uploadRes.ok) {
        if (uploadData.error === 'BUCKET_NOT_FOUND') {
          throw new Error('Supabase Storage bucket "product-files" not found. Please create a public bucket named "product-files" in your Supabase dashboard.');
        }
        throw new Error(uploadData.error || 'Failed to upload file');
      }
      
      productFileUrl = uploadData.url;

      // 2. Create Product in Database (ensure slug is unique for files)
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const slug = `${baseSlug}-file-${Date.now()}`;
      
      const productRes = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          price: parseFloat(price),
          description,
          product_file_url: productFileUrl,
          tag: 'digital_file',
        }),
      });

      if (!productRes.ok) {
        const productText = await productRes.text();
        try {
          const errorData = JSON.parse(productText);
          throw new Error(errorData.error || 'Failed to create product');
        } catch (e) {
           throw new Error(e instanceof Error && e.message.includes('Failed to create product') ? e.message : `Database save failed (Status ${productRes.status}): ${productText.slice(0, 100)}...`);
        }
      }

      setToast({ message: 'Product created successfully!', type: 'success' });
      setShowAddModal(false);
      setName('');
      setPrice('149');
      setDescription('');
      setFile(null);
      fetchProducts();

    } catch (error: unknown) {
      setToast({ message: error instanceof Error ? error.message : 'Something went wrong', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setDescription(product.description || '');
    setFile(null); // Optional to update file
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('149');
    setDescription('');
    setFile(null);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name || !price) {
      setToast({ message: 'Name and price are required.', type: 'error' });
      return;
    }

    setSaving(true);
    let productFileUrl = editingProduct.product_file_url;

    try {
      // 1. Upload File (Optional)
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload new file');
        const uploadData = await uploadRes.json();
        productFileUrl = uploadData.url;
      }

      // 2. Update Product
      const productRes = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          description,
          product_file_url: productFileUrl,
        }),
      });

      if (!productRes.ok) throw new Error('Failed to update product');

      setToast({ message: 'Product updated successfully!', type: 'success' });
      closeEditModal();
      fetchProducts();
    } catch (error: unknown) {
      setToast({ message: error instanceof Error ? error.message : 'Something went wrong', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete product');
      
      setToast({ message: 'Product deleted successfully!', type: 'success' });
      setProductToDelete(null);
      fetchProducts();
    } catch (error: unknown) {
      setToast({ message: error instanceof Error ? error.message : 'Something went wrong', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading Products...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>Products</h1>
          <p className="text-secondary">Manage your digital products and file uploads</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Product
        </button>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {products.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price</th>
                <th>File Attached</th>
                <th style={{ textAlign: 'right' }}>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-muted" style={{ fontFamily: 'monospace' }}>/{product.slug}</div>
                  </td>
                  <td className="font-semibold">₹{Number(product.price).toLocaleString('en-IN')}</td>
                  <td>
                    {product.product_file_url ? (
                      <a href={product.product_file_url} target="_blank" rel="noopener noreferrer" className="badge badge-success" style={{ textDecoration: 'none' }}>
                        View File
                      </a>
                    ) : (
                      <span className="badge badge-neutral">No File</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{new Date(product.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(product)}>
                        Edit
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => setProductToDelete(product)}
                        style={{ color: 'var(--color-danger)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-12">
          <h3 className="text-lg font-bold mb-2">No Products Found</h3>
          <p className="text-secondary mb-6">Click "Add Product" to upload your first digital file.</p>
          <button className="btn btn-primary mx-auto" onClick={() => setShowAddModal(true)}>
            Add Product
          </button>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
            <h2 className="text-xl font-bold mb-2">Add New Product</h2>
            <p className="text-secondary mb-6">Create a new product and upload the digital file (PDF, ZIP, etc).</p>
            
            <form onSubmit={handleAddProduct} className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-sm font-semibold mb-1 block">Product Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Zero Investment Ebook"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Price (₹)</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Description (Optional)</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Upload File (PDF, ZIP, Media)</label>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => {
                    setShowAddModal(false);
                    setName('');
                    setPrice('149');
                    setDescription('');
                    setFile(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Uploading...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }}>
            <h2 className="text-xl font-bold mb-2">Edit Product</h2>
            <p className="text-secondary mb-6">Update details for {editingProduct.name}.</p>
            
            <form onSubmit={handleEditProduct} className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-sm font-semibold mb-1 block">Product Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Price (₹)</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Description (Optional)</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Replace File (Optional)</label>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
                <p className="text-xs text-muted mt-1">Leave empty to keep the existing file.</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px', textAlign: 'center' }}>
            <h2 className="text-xl font-bold mb-2">Delete Product</h2>
            <p className="text-secondary mb-6">Are you sure you want to delete <strong>{productToDelete.name}</strong>? This action cannot be undone.</p>
            
            <div className="flex justify-center gap-3">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => setProductToDelete(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={handleDeleteProduct}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
