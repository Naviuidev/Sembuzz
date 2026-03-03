import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SchoolAdminNavbar } from '../components/SchoolAdminNavbar';
import { SchoolAdminSidebar } from '../components/SchoolAdminSidebar';
import {
  categoriesService,
  type Category,
  type SubCategory,
  type CreateCategoryDto,
  type CreateSubCategoryDto,
  type UpdateCategoryDto,
  type UpdateSubCategoryDto,
} from '../services/categories.service';

export const SchoolAdminCategories = () => {
  const queryClient = useQueryClient();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingSubCategory, setIsCreatingSubCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'subcategory';
    item: Category | SubCategory | null;
    categoryName?: string;
  }>({
    isOpen: false,
    type: 'category',
    item: null,
  });

  const [categoryFormData, setCategoryFormData] = useState<CreateCategoryDto>({
    name: '',
    subcategories: [],
  });
  const [subCategoryFormData, setSubCategoryFormData] = useState<CreateSubCategoryDto>({
    name: '',
    categoryId: '',
  });
  const [editCategoryData, setEditCategoryData] = useState<UpdateCategoryDto>({
    name: '',
  });
  const [editSubCategoryData, setEditSubCategoryData] = useState<UpdateSubCategoryDto>({
    name: '',
  });
  const [newSubCategoryName, setNewSubCategoryName] = useState('');

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesService.getAll,
  });

  // Filter categories based on search query
  const filteredCategories =
    categories?.filter(
      (category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.subcategories.some((sub) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

  // Update selectedCategory when categories data changes
  useEffect(() => {
    if (selectedCategory && categories) {
      const updated = categories.find((c) => c.id === selectedCategory.id);
      if (updated) {
        setSelectedCategory(updated);
      }
    }
  }, [categories, selectedCategory]);

  const createCategoryMutation = useMutation({
    mutationFn: async (payload: CreateCategoryDto | { names: string[]; subcategories?: string[] }) => {
      if ('names' in payload && Array.isArray(payload.names)) {
        for (const name of payload.names) {
          await categoriesService.create({
            name: name.trim(),
            subcategories: payload.subcategories,
          });
        }
        return;
      }
      return categoriesService.create(payload as CreateCategoryDto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreatingCategory(false);
      setCategoryFormData({ name: '', subcategories: [] });
      setNewSubCategoryName('');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedCategory(null);
      setEditCategoryData({ name: '' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteModal({ isOpen: false, type: 'category', item: null });
      setSelectedCategory(null);
    },
  });

  const createSubCategoryMutation = useMutation({
    mutationFn: categoriesService.createSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreatingSubCategory(false);
      setSubCategoryFormData({ name: '', categoryId: '' });
    },
  });

  const updateSubCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubCategoryDto }) =>
      categoriesService.updateSubCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingSubCategoryId(null);
      setEditSubCategoryData({ name: '' });
      // Refresh selected category to show updated subcategories
      if (selectedCategory) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }
    },
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: categoriesService.deleteSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteModal({ isOpen: false, type: 'subcategory', item: null });
    },
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryFormData.name.trim();
    if (!trimmed) {
      alert('Please enter a category name');
      return;
    }
    const names = trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) {
      alert('Please enter at least one category name');
      return;
    }
    if (names.length === 1) {
      createCategoryMutation.mutate({
        name: names[0],
        subcategories: categoryFormData.subcategories,
      });
    } else {
      createCategoryMutation.mutate({
        names,
        subcategories: categoryFormData.subcategories,
      });
    }
  };

  const handleAddSubCategoryToForm = () => {
    if (newSubCategoryName.trim()) {
      setCategoryFormData({
        ...categoryFormData,
        subcategories: [...(categoryFormData.subcategories || []), newSubCategoryName.trim()],
      });
      setNewSubCategoryName('');
    }
  };

  const handleRemoveSubCategoryFromForm = (index: number) => {
    setCategoryFormData({
      ...categoryFormData,
      subcategories: categoryFormData.subcategories?.filter((_, i) => i !== index) || [],
    });
  };

  const handleCreateSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCategoryFormData.name.trim() || !subCategoryFormData.categoryId) {
      alert('Please fill in all fields');
      return;
    }
    createSubCategoryMutation.mutate(subCategoryFormData);
  };

  const handleCategoryCardClick = (category: Category) => {
    setSelectedCategory(category);
    setEditCategoryData({ name: category.name });
  };

  const handleUpdateCategory = (id: string) => {
    if (!editCategoryData.name?.trim()) {
      alert('Please enter a category name');
      return;
    }
    updateCategoryMutation.mutate({ id, data: editCategoryData });
  };

  const handleEditSubCategory = (subCategory: SubCategory) => {
    setEditingSubCategoryId(subCategory.id);
    setEditSubCategoryData({ name: subCategory.name });
  };

  const handleCloseEditScreen = () => {
    setSelectedCategory(null);
    setEditingSubCategoryId(null);
    setEditCategoryData({ name: '' });
    setEditSubCategoryData({ name: '' });
  };

  const handleUpdateSubCategory = (id: string) => {
    if (!editSubCategoryData.name?.trim()) {
      alert('Please enter a subcategory name');
      return;
    }
    updateSubCategoryMutation.mutate({ id, data: editSubCategoryData });
  };

  const handleDeleteClick = (type: 'category' | 'subcategory', item: Category | SubCategory, categoryName?: string) => {
    setDeleteModal({ isOpen: true, type, item, categoryName });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.item) {
      if (deleteModal.type === 'category') {
        deleteCategoryMutation.mutate(deleteModal.item.id);
      } else {
        deleteSubCategoryMutation.mutate(deleteModal.item.id);
      }
    }
  };

  const cancelEdit = () => {
    setEditingSubCategoryId(null);
    setEditSubCategoryData({ name: '' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <SchoolAdminNavbar />
      <div className="d-flex">
        <SchoolAdminSidebar />
        <div style={{ flex: 1, padding: '2rem' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 'normal',
                  color: '#1a1f2e',
                  margin: 0,
                  marginBottom: '0.5rem',
                }}
              >
                Categories & Sub Categories
              </h1>
              <p style={{ color: '#6c757d', fontSize: '1rem', margin: 0 }}>
                Manage your school categories and subcategories
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                onClick={() => setIsCreatingSubCategory(true)}
                className="btn"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #1a1f2e',
                  borderRadius: '50px',
                  padding: '0.5rem 1.5rem',
                  color: '#1a1f2e',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1f2e';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1a1f2e';
                }}
              >
                + Add SubCategory
              </button>
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="btn"
                style={{
                  backgroundColor: '#1a1f2e',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '0.5rem 1.5rem',
                  color: '#fff',
                  fontWeight: '500',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.color = '#1a1f2e';
                  e.currentTarget.style.border = '1px solid #1a1f2e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1f2e';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.border = 'none';
                }}
              >
                + Add Category
              </button>
            </div>
          </div>

          {/* Delete Confirmation Modal — higher z-index so it appears on top of Edit Category modal */}
          {deleteModal.isOpen && deleteModal.item && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10050,
              }}
              onClick={() => {
                setDeleteModal({ isOpen: false, type: 'category', item: null });
                setSelectedCategory(null);
              }}
            >
              <div
                className="card border-0 shadow-lg"
                style={{
                  borderRadius: '0px',
                  minWidth: '400px',
                  maxWidth: '500px',
                  width: '90%',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-4">
                  <h3
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'normal',
                      color: '#1a1f2e',
                      marginBottom: '1rem',
                    }}
                  >
                    Confirm Delete
                  </h3>
                  <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                    Are you sure you want to delete <strong>{deleteModal.item.name}</strong>
                    {deleteModal.type === 'subcategory' && deleteModal.categoryName && (
                      <> (under {deleteModal.categoryName})</>
                    )}
                    ? This action cannot be undone.
                    {deleteModal.type === 'category' && ' All subcategories will also be deleted.'}
                  </p>
                  <div className="d-flex justify-content-end gap-3">
                    <button
                      onClick={() => {
                        setDeleteModal({ isOpen: false, type: 'category', item: null });
                        setSelectedCategory(null);
                      }}
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={
                        deleteCategoryMutation.isPending || deleteSubCategoryMutation.isPending
                      }
                      className="btn"
                      style={{
                        backgroundColor: '#dc3545',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        transition: 'all 0.3s',
                        opacity:
                          deleteCategoryMutation.isPending || deleteSubCategoryMutation.isPending
                            ? 0.7
                            : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!deleteCategoryMutation.isPending && !deleteSubCategoryMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#c82333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!deleteCategoryMutation.isPending && !deleteSubCategoryMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#dc3545';
                        }
                      }}
                    >
                      {deleteCategoryMutation.isPending || deleteSubCategoryMutation.isPending
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Category Form */}
          {isCreatingCategory && (
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px' }}>
              <div className="card-body p-4">
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'normal',
                    color: '#1a1f2e',
                    marginBottom: '1.5rem',
                  }}
                >
                  Create New Category
                </h2>
                <form onSubmit={handleCreateCategory}>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                      Category Name *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      placeholder="e.g., Academics, Sports or c1, c2, c3 for multiple"
                      style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                      SubCategories (Optional)
                    </label>
                    <div className="d-flex gap-2 mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={newSubCategoryName}
                        onChange={(e) => setNewSubCategoryName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubCategoryToForm();
                          }
                        }}
                        placeholder="Enter subcategory name"
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddSubCategoryToForm}
                        className="btn"
                        style={{
                          backgroundColor: '#1a1f2e',
                          border: 'none',
                          borderRadius: '50px',
                          padding: '0.5rem 1.5rem',
                          color: '#fff',
                          fontWeight: '500',
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {categoryFormData.subcategories && categoryFormData.subcategories.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {categoryFormData.subcategories.map((sub, index) => (
                          <span
                            key={index}
                            className="d-flex align-items-center gap-2"
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#e7f3ff',
                              borderRadius: '50px',
                              border: '1px solid #dee2e6',
                            }}
                          >
                            {sub}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubCategoryFromForm(index)}
                              className="btn p-0"
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#dc3545',
                                padding: 0,
                                lineHeight: 1,
                              }}
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      You can add subcategories now or add them later
                    </small>
                  </div>

                  <div className="d-flex justify-content-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setCategoryFormData({ name: '', subcategories: [] });
                        setNewSubCategoryName('');
                      }}
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createCategoryMutation.isPending}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        opacity: createCategoryMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      {createCategoryMutation.isPending ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
                {createCategoryMutation.isError && (
                  <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                    {(createCategoryMutation.error as any)?.response?.data?.message ||
                      'Failed to create category. Please try again.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create SubCategory Form */}
          {isCreatingSubCategory && (
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '0px' }}>
              <div className="card-body p-4">
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'normal',
                    color: '#1a1f2e',
                    marginBottom: '1.5rem',
                  }}
                >
                  Create New SubCategory
                </h2>
                <form onSubmit={handleCreateSubCategory}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        Select Category *
                      </label>
                      <select
                        className="form-select"
                        required
                        value={subCategoryFormData.categoryId}
                        onChange={(e) =>
                          setSubCategoryFormData({ ...subCategoryFormData, categoryId: e.target.value })
                        }
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      >
                        <option value="">Select a category</option>
                        {categories?.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontWeight: '500', color: '#1a1f2e' }}>
                        SubCategory Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={subCategoryFormData.name}
                        onChange={(e) =>
                          setSubCategoryFormData({ ...subCategoryFormData, name: e.target.value })
                        }
                        placeholder="e.g., Mathematics, Football"
                        style={{ borderRadius: '0px', padding: '0.75rem 1rem' }}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingSubCategory(false);
                        setSubCategoryFormData({ name: '', categoryId: '' });
                      }}
                      className="btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createSubCategoryMutation.isPending}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        opacity: createSubCategoryMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      {createSubCategoryMutation.isPending ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
                {createSubCategoryMutation.isError && (
                  <div className="alert alert-danger mt-3" style={{ borderRadius: '0px' }}>
                    {(createSubCategoryMutation.error as any)?.response?.data?.message ||
                      'Failed to create subcategory. Please try again.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Bar */}
          {!selectedCategory && (
            <div className="mb-4" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
              <div style={{ position: 'relative' }}>
                <i
                  className="bi bi-search"
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6c757d',
                    fontSize: '1.1rem',
                  }}
                ></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Categories or Subcategories"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    borderRadius: '50px',
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    fontSize: '1rem',
                    border: '1px solid #dee2e6',
                  }}
                />
              </div>
            </div>
          )}

          {/* Edit/Delete Popup — hidden while delete confirmation is open so only one popup shows */}
          {selectedCategory && !deleteModal.isOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
              }}
              onClick={handleCloseEditScreen}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  position: 'relative',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleCloseEditScreen}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: '#1a1f2e',
                    border: 'none',
                    fontSize: '1rem',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    lineHeight: 1,
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1f2e';
                  }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>

                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1a1f2e',
                    marginBottom: '1.5rem',
                    marginTop: 0,
                    paddingRight: '3rem',
                  }}
                >
                  Edit Category
                </h3>

                {/* Category Edit Form */}
                <div className="mb-4">
                  <label
                    className="form-label"
                    style={{
                      fontWeight: '500',
                      color: '#1a1f2e',
                      marginBottom: '0.5rem',
                      display: 'block',
                    }}
                  >
                    Category Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCategoryData.name || ''}
                    onChange={(e) => setEditCategoryData({ name: e.target.value })}
                    style={{
                      borderRadius: '0px',
                      padding: '0.75rem 1rem',
                      fontSize: '1rem',
                      border: '1px solid #dee2e6',
                      width: '100%',
                      marginBottom: '1.5rem',
                    }}
                  />
                </div>

                {/* SubCategories List */}
                <div className="mb-4">
                  <label
                    className="form-label"
                    style={{
                      fontWeight: '500',
                      color: '#1a1f2e',
                      marginBottom: '0.5rem',
                      display: 'block',
                    }}
                  >
                    SubCategories ({selectedCategory.subcategories.length})
                  </label>
                  {selectedCategory.subcategories.length > 0 ? (
                    <div
                      style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '1rem',
                        maxHeight: '300px',
                        overflowY: 'auto',
                      }}
                    >
                      {selectedCategory.subcategories.map((subCategory) => (
                        <div
                          key={subCategory.id}
                          className="d-flex justify-content-between align-items-center mb-2"
                          style={{
                            padding: '0.75rem',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6',
                          }}
                        >
                          {editingSubCategoryId === subCategory.id ? (
                            <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                              <input
                                type="text"
                                className="form-control"
                                value={editSubCategoryData.name || ''}
                                onChange={(e) => setEditSubCategoryData({ name: e.target.value })}
                                style={{
                                  borderRadius: '0px',
                                  padding: '0.5rem 0.75rem',
                                  maxWidth: '300px',
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateSubCategory(subCategory.id)}
                                disabled={updateSubCategoryMutation.isPending}
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: '#1a1f2e',
                                  border: 'none',
                                  borderRadius: '0px',
                                  color: '#fff',
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.875rem',
                                  opacity: updateSubCategoryMutation.isPending ? 0.7 : 1,
                                }}
                              >
                                {updateSubCategoryMutation.isPending ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '0px',
                                  color: '#1a1f2e',
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.875rem',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span style={{ color: '#1a1f2e', fontWeight: '400' }}>
                                {subCategory.name}
                              </span>
                              <div className="d-flex gap-2">
                                <button
                                  onClick={() => handleEditSubCategory(subCategory)}
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #1a1f2e',
                                    borderRadius: '0px',
                                    color: '#1a1f2e',
                                    padding: '0.5rem',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s',
                                  }}
                                  title="Edit"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1a1f2e';
                                    e.currentTarget.style.color = '#fff';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#1a1f2e';
                                  }}
                                >
                                  <i className="bi bi-pencil" style={{ fontSize: '0.875rem' }}></i>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteClick('subcategory', subCategory, selectedCategory.name)
                                  }
                                  disabled={deleteSubCategoryMutation.isPending}
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: '#dc3545',
                                    border: 'none',
                                    borderRadius: '0px',
                                    color: '#fff',
                                    padding: '0.5rem',
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: deleteSubCategoryMutation.isPending ? 0.7 : 1,
                                    transition: 'all 0.3s',
                                  }}
                                  title="Delete"
                                  onMouseEnter={(e) => {
                                    if (!deleteSubCategoryMutation.isPending) {
                                      e.currentTarget.style.backgroundColor = '#c82333';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!deleteSubCategoryMutation.isPending) {
                                      e.currentTarget.style.backgroundColor = '#dc3545';
                                    }
                                  }}
                                >
                                  <i className="bi bi-trash" style={{ fontSize: '0.875rem' }}></i>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6c757d', fontStyle: 'italic', margin: 0 }}>
                      No subcategories yet.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-between align-items-center pt-4" style={{ borderTop: '1px solid #dee2e6' }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick('category', selectedCategory)}
                    disabled={deleteCategoryMutation.isPending}
                    style={{
                      backgroundColor: '#dc3545',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.5rem 1.5rem',
                      color: '#fff',
                      fontWeight: '500',
                      transition: 'all 0.3s',
                      opacity: deleteCategoryMutation.isPending ? 0.7 : 1,
                      cursor: deleteCategoryMutation.isPending ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!deleteCategoryMutation.isPending) {
                        e.currentTarget.style.backgroundColor = '#c82333';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!deleteCategoryMutation.isPending) {
                        e.currentTarget.style.backgroundColor = '#dc3545';
                      }
                    }}
                  >
                    {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete Category'}
                  </button>
                  <div className="d-flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseEditScreen}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#1a1f2e',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCategory(selectedCategory.id)}
                      disabled={updateCategoryMutation.isPending}
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        cursor: updateCategoryMutation.isPending ? 'not-allowed' : 'pointer',
                        opacity: updateCategoryMutation.isPending ? 0.7 : 1,
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        if (!updateCategoryMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#fff';
                          e.currentTarget.style.color = '#1a1f2e';
                          e.currentTarget.style.border = '1px solid #1a1f2e';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!updateCategoryMutation.isPending) {
                          e.currentTarget.style.backgroundColor = '#1a1f2e';
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.border = 'none';
                        }
                      }}
                    >
                      {updateCategoryMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories Cards Grid */}
          {!selectedCategory && (
            <div className="row justify-content-center g-3 mb-4">
              {isLoading ? (
                <div className="col-12 text-center py-5">
                  <p style={{ color: '#6c757d' }}>Loading categories...</p>
                </div>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <div key={category.id} className="col-md-3 col-sm-6">
                    <div
                      onClick={() => handleCategoryCardClick(category)}
                      onMouseEnter={(e) => {
                        setHoveredCategoryId(category.id);
                        e.currentTarget.style.backgroundColor = 'rgb(26 31 46 / 5%)';
                      }}
                      onMouseLeave={(e) => {
                        setHoveredCategoryId(null);
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                      style={{
                        border: '1px solid rgb(26, 31, 46)',
                        borderRadius: '4px',
                        padding: '1.5rem',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: '0.3s',
                        textAlign: 'center',
                        minHeight: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1a1f2e !important',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          color: '#1a1f2e',
                          fontWeight: '500',
                          fontSize: '1rem',
                        }}
                      >
                        {category.name}
                      </span>

                      {/* Tooltip */}
                      {hoveredCategoryId === category.id && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '0.75rem',
                            padding: '1.25rem',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            zIndex: 1000,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                            minWidth: '280px',
                            maxWidth: '320px',
                          }}
                        >
                          {/* Tooltip Pointer */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-8px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: 0,
                              height: 0,
                              borderLeft: '8px solid transparent',
                              borderRight: '8px solid transparent',
                              borderTop: '8px solid #fff',
                            }}
                          />

                          {/* Title */}
                          <div
                            style={{
                              fontWeight: '600',
                              color: '#1a1f2e',
                              fontSize: '1rem',
                              marginBottom: '0.75rem',
                            }}
                          >
                            {category.name}
                          </div>

                          {/* Body Text */}
                          <div
                            style={{
                              color: '#6c757d',
                              fontSize: '0.875rem',
                              lineHeight: '1.5',
                              marginBottom: '1rem',
                            }}
                          >
                            <div style={{ marginBottom: '0.5rem' }}>
                              {category.subcategories.length} subcategor
                              {category.subcategories.length !== 1 ? 'ies' : 'y'}
                            </div>
                            {category.subcategories.length > 0 && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <strong style={{ color: '#1a1f2e', fontSize: '0.75rem' }}>
                                  Subcategories:
                                </strong>
                                <div
                                  style={{
                                    marginTop: '0.25rem',
                                    fontSize: '0.75rem',
                                    color: '#6c757d',
                                  }}
                                >
                                  {category.subcategories.map((sub, index) => (
                                    <span key={sub.id}>
                                      {sub.name}
                                      {index < category.subcategories.length - 1 && ', '}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center py-5">
                  <p style={{ color: '#6c757d' }}>
                    {searchQuery
                      ? 'No categories found matching your search.'
                      : 'No categories available.'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setIsCreatingCategory(true)}
                      className="btn"
                      style={{
                        backgroundColor: '#1a1f2e',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.5rem 1.5rem',
                        color: '#fff',
                        fontWeight: '500',
                        marginTop: '1rem',
                      }}
                    >
                      Create Your First Category
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
