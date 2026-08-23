'use client';

import { useToast } from '@/components/ToastProvider';
import { useState, useEffect, useCallback } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string | null;
  product_file_url: string | null;
  image_url: string | null;
  status: string;
  sales_count?: number;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // New product form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('149');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

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






  const handleDuplicate = async (product: Product) => {
    setSaving(true);
    try {
      const newSlug = `${product.slug}-copy-${Date.now()}`;
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${product.name} (Copy)`,
          slug: newSlug,
          price: product.price,
          description: product.description,
          product_file_url: product.product_file_url,
          image_url: product.image_url,
          tag: 'digital_file',
          status: 'live',
        }),
      });
      if (!res.ok) throw new Error('Failed to duplicate');
      showToast('Product duplicated', 'success');
      fetchProducts();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAction = async (action: 'delete') => {
    if (selectedIds.size === 0) return;
    if (action === 'delete' && !confirm('Are you sure you want to delete selected products?')) return;
    
    setSaving(true);
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        const prod = products.find(p => p.id === id);
        if (!prod) continue;
        if (action === 'delete') {
          await fetch(`/api/admin/products/${prod.slug}`, { method: 'DELETE' });
        }
      }
      showToast('Bulk action completed', 'success');
      setSelectedIds(new Set());
      fetchProducts();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !file) {
      showToast('Name, price, and file are required.', 'error');
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

      let productImageUrl = null;
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        imageFormData.append('bucket', 'product-images');
        
        const imgUploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: imageFormData,
        });
        
        if (imgUploadRes.ok) {
          const imgUploadData = await imgUploadRes.json();
          productImageUrl = imgUploadData.url;
        }
      }

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
          image_url: productImageUrl,
          tag: 'digital_file',
          status: 'live',
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

      showToast('Product created successfully!', 'success');
      setShowAddModal(false);
      setName('');
      setPrice('149');
      setDescription('');
      setFile(null);
      setImageFile(null);
      fetchProducts();

    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Something went wrong', 'error');
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
    setImageFile(null);
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice('149');
    setDescription('');
    setFile(null);
    setImageFile(null);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !name || !price) {
      showToast('Name and price are required.', 'error');
      return;
    }

    setSaving(true);
    let productFileUrl = editingProduct.product_file_url;

    try {
      // 1. Upload File (Optional)
      let productImageUrl = editingProduct.image_url;

      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        imageFormData.append('bucket', 'product-images');
        
        const imgUploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: imageFormData,
        });
        
        if (imgUploadRes.ok) {
          const imgUploadData = await imgUploadRes.json();
          productImageUrl = imgUploadData.url;
        }
      }

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
      const productRes = await fetch(`/api/admin/products/${editingProduct.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          description,
          product_file_url: productFileUrl,
          image_url: productImageUrl,
        }),
      });

      if (!productRes.ok) throw new Error('Failed to update product');

      showToast('Product updated successfully!', 'success');
      closeEditModal();
      fetchProducts();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productToDelete.slug}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete product');
      
      showToast('Product deleted successfully!', 'success');
      setProductToDelete(null);
      fetchProducts();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Something went wrong', 'error');
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

      <div className="flex justify-between items-center mb-4 gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input max-w-sm"
          style={{ width: '300px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
        />
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <span className="text-sm self-center mr-2">{selectedIds.size} selected</span>
            <button className="btn btn-sm btn-ghost text-red-500" onClick={() => handleBulkAction('delete')} disabled={saving} style={{ color: 'var(--color-danger)' }}>Delete</button>
          </div>
        )}
      </div>

      

      {filteredProducts.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filteredProducts.map(p => p.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                  />
                </th>
                <th>Product</th>
                <th>Sales</th>
                <th>Price</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(product.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(product.id);
                        else newSet.delete(product.id);
                        setSelectedIds(newSet);
                      }}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg-warm)', flexShrink: 0, overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)' }}>
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {product.name}
                        </div>
                        <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>/{product.slug}</div>
                      </div>
                    </div>
                  </td>

                  <td>{product.sales_count || 0}</td>
                  <td className="font-semibold">₹{Number(product.price).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(product)} disabled={saving}>
                        Duplicate
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(product)} disabled={saving}>
                        Edit
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
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px', backgroundColor: 'var(--color-bg-card)' }}>
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
                <label className="text-sm font-semibold mb-1 block">Product Image (Thumbnail)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }} 
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
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px', backgroundColor: 'var(--color-bg-card)' }}>
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
                <label className="text-sm font-semibold mb-3 block">Product Image</label>
                {editingProduct.image_url && (
                  <div className="mb-3">
                    <img src={editingProduct.image_url} alt="Thumbnail" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }} 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '16px' }}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-3 block">Product File</label>
                
                {editingProduct.product_file_url && (
                  <div className="mb-3 p-3 rounded-md flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium">Current File</span>
                      <a 
                        href={`/api/admin/download?url=${encodeURIComponent(editingProduct.product_file_url)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs truncate"
                        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                      >
                        {editingProduct.product_file_url.split('/').pop()?.split('?')[0] || 'View File'}
                      </a>
                    </div>
                    <span className="badge badge-success text-xs">Attached</span>
                  </div>
                )}

                <label className="text-sm font-semibold mb-1 block">
                  {editingProduct.product_file_url ? 'Replace File (Optional)' : 'Upload File'}
                </label>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
                {editingProduct.product_file_url && (
                  <p className="text-xs text-muted mt-1">Leave empty to keep the existing file.</p>
                )}
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
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone and the associated digital file will be permanently removed.`}
        requireMatch="DELETE"
        confirmText={saving ? "Deleting..." : "Yes, Delete"}
        onConfirm={handleDeleteProduct}
        onCancel={() => {
          setProductToDelete(null);
          setShowDeleteConfirm(false);
        }}
      />
    </div>
  );
}
