import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import KeypadNumpad from './KeypadNumpad';
import SearchBar from './SearchBar';
import { useMessageModal } from '../hooks/useMessageModal';
import GroupFormModal from './GroupFormModal';

const SubProductManager = () => {
  const [subProducts, setSubProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showAddSubProduct, setShowAddSubProduct] = useState(false);
  const [showEditSubProduct, setShowEditSubProduct] = useState(false);
  const [currentSubProduct, setCurrentSubProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    subProductId: null,
    subProductName: ''
  });
  const [deleteGroupConfirmation, setDeleteGroupConfirmation] = useState({
    isOpen: false,
    groupId: null,
    groupName: ''
  });
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    is_visible: 0
  });
  const { messageModal, showError, showWarning, closeModal } = useMessageModal();

  // Form state for sub-product data
  const [subProductForm, setSubProductForm] = useState({
    group_id: '',
    product_id: '',
    name: '',
    button_name: '',
    production_name: '',
    price: '',
    vat_takeout: '',
    vat_eat_in: '',
    barcode: '',
    category_id: '',
    addition_type: '',
    display_index: '',
    in_web_shop: false,
    printer1: '',
    printer2: '',
    printer3: '',
    image: '',
    color: '#3b82f6',
    price_vat_inc: ''
  });

  // State for file inputs
  const [imageFile, setImageFile] = useState(null);
  
  // Keypad states
  const [activeField, setActiveField] = useState(null);
  const [showKeypad, setShowKeypad] = useState(true);
  
  // Track if user has manually edited button_name or production_name
  const [hasEditedButtonOrProduction, setHasEditedButtonOrProduction] = useState(false);

  const fetchSubProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/sub-products');
      const result = await response.json();
      setSubProducts(result.data || []);
    } catch (error) {
      console.error('Error fetching sub-products:', error);
      showError('Failed to fetch sub-products. Please check your connection.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/groups');
      const result = await response.json();
      setGroups(result.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    fetchSubProducts();
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setSubProductForm((prevForm) => {
      // Only sync fields if adding a new sub-product (not editing)
      // and user hasn't edited button_name or production_name manually
      if (name === "name" && !currentSubProduct && !hasEditedButtonOrProduction) {
        return {
          ...prevForm,
          name: newValue,
          button_name: newValue,
          production_name: newValue,
        };
      }

      // If user edits button_name or production_name manually, stop syncing
      if (name === "button_name" || name === "production_name") {
        setHasEditedButtonOrProduction(true);
      }

      return {
        ...prevForm,
        [name]: newValue,
      };
    });

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  // Handle file input changes separately
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    // Store file name for display purposes
    if (file) {
      setSubProductForm({
        ...subProductForm,
        image: file.name
      });
    } else {
      setSubProductForm({
        ...subProductForm,
        image: ''
      });
    }
  };

  // Keypad functions
  const handleKeypadInput = (input) => {
    if (activeField) {
      setSubProductForm(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setSubProductForm(prev => ({
        ...prev,
        [activeField]: prev[activeField].toString().slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setSubProductForm(prev => ({
        ...prev,
        [activeField]: ""
      }));
    }
  };

  const handleKeypadEnter = () => {
    // Keep keypad visible, just blur the active field
    setActiveField(null);
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const resetForm = () => {
    setSubProductForm({
      group_id: '',
      product_id: '',
      name: '',
      button_name: '',
      production_name: '',
      price: '',
      vat_takeout: '',
      vat_eat_in: '',
      barcode: '',
      category_id: '',
      addition_type: '',
      display_index: '',
      in_web_shop: false,
      printer1: '',
      printer2: '',
      printer3: '',
      image: '',
      color: '#3b82f6',
      price_vat_inc: ''
    });
    setImageFile(null);
    setFieldErrors({});
    setHasEditedButtonOrProduction(false);
  };

  const handleAddSubProduct = async () => {
    // Validate required fields
    const errors = {};
    if (!subProductForm.name) {
      errors.name = 'Sub-Product name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      // Create FormData object to handle file uploads
      const formData = new FormData();

      // Append all sub-product data to FormData
      if (subProductForm.group_id) {
        formData.append('group_id', parseInt(subProductForm.group_id));
      }
      if (subProductForm.product_id) {
        formData.append('product_id', parseInt(subProductForm.product_id));
      }
      formData.append('name', subProductForm.name);
      formData.append('button_name', subProductForm.button_name || '');
      formData.append('production_name', subProductForm.production_name || '');
      formData.append('price', parseFloat(subProductForm.price) || 0);
      formData.append('vat_takeout', parseFloat(subProductForm.vat_takeout) || 0);
      formData.append('vat_eat_in', parseFloat(subProductForm.vat_eat_in) || 0);
      formData.append('barcode', subProductForm.barcode || '');
      formData.append('category_id', subProductForm.category_id ? parseInt(subProductForm.category_id) : '');
      formData.append('addition_type', subProductForm.addition_type || '');
      formData.append('display_index', parseInt(subProductForm.display_index) || 0);
      formData.append('in_web_shop', subProductForm.in_web_shop ? 1 : 0);
      formData.append('printer1', subProductForm.printer1 || '');
      formData.append('printer2', subProductForm.printer2 || '');
      formData.append('printer3', subProductForm.printer3 || '');
      formData.append('color', subProductForm.color || '#3b82f6');
      formData.append('price_vat_inc', parseFloat(subProductForm.price_vat_inc) || 0);

      // Append image file if selected
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch('http://localhost:5000/api/sub-products', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchSubProducts();
        resetForm();
        setShowAddSubProduct(false);
      } else {
        const errorResult = await response.json();
        showError(errorResult.error || 'Failed to create sub-product');
      }
    } catch (error) {
      console.error('Error creating sub-product:', error);
      showError('Failed to create sub-product. Please try again.');
    }
  };

  const handleEditSubProduct = (subProduct) => {
    setCurrentSubProduct(subProduct);
    setSubProductForm({
      group_id: subProduct.group_id || '',
      product_id: subProduct.product_id || '',
      name: subProduct.name || '',
      button_name: subProduct.button_name || '',
      production_name: subProduct.production_name || '',
      price: subProduct.price || '',
      vat_takeout: subProduct.vat_takeout || '',
      vat_eat_in: subProduct.vat_eat_in || '',
      barcode: subProduct.barcode || '',
      category_id: subProduct.category_id || '',
      addition_type: subProduct.addition_type || '',
      display_index: subProduct.display_index || '',
      in_web_shop: subProduct.in_web_shop === 1,
      printer1: subProduct.printer1 || '',
      printer2: subProduct.printer2 || '',
      printer3: subProduct.printer3 || '',
      image: subProduct.image || '',
      color: subProduct.color || '#3b82f6',
      price_vat_inc: subProduct.price_vat_inc || ''
    });
    setImageFile(null);
    setHasEditedButtonOrProduction(false);
    setShowEditSubProduct(true);
  };

  const handleUpdateSubProduct = async () => {
    // Validate required fields
    const errors = {};
    if (!subProductForm.name) {
      errors.name = 'Sub-Product name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      const formData = new FormData();

      if (subProductForm.group_id) {
        formData.append('group_id', parseInt(subProductForm.group_id));
      }
      if (subProductForm.product_id) {
        formData.append('product_id', parseInt(subProductForm.product_id));
      }
      formData.append('name', subProductForm.name);
      formData.append('button_name', subProductForm.button_name || '');
      formData.append('production_name', subProductForm.production_name || '');
      formData.append('price', parseFloat(subProductForm.price) || 0);
      formData.append('vat_takeout', parseFloat(subProductForm.vat_takeout) || 0);
      formData.append('vat_eat_in', parseFloat(subProductForm.vat_eat_in) || 0);
      formData.append('barcode', subProductForm.barcode || '');
      formData.append('category_id', subProductForm.category_id ? parseInt(subProductForm.category_id) : '');
      formData.append('addition_type', subProductForm.addition_type || '');
      formData.append('display_index', parseInt(subProductForm.display_index) || 0);
      formData.append('in_web_shop', subProductForm.in_web_shop ? 1 : 0);
      formData.append('printer1', subProductForm.printer1 || '');
      formData.append('printer2', subProductForm.printer2 || '');
      formData.append('printer3', subProductForm.printer3 || '');
      formData.append('color', subProductForm.color || '#3b82f6');
      formData.append('price_vat_inc', parseFloat(subProductForm.price_vat_inc) || 0);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`http://localhost:5000/api/sub-products/${currentSubProduct.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        await fetchSubProducts();
        resetForm();
        setShowEditSubProduct(false);
        setCurrentSubProduct(null);
      } else {
        const errorResult = await response.json();
        showError(errorResult.error || 'Failed to update sub-product');
      }
    } catch (error) {
      console.error('Error updating sub-product:', error);
      showError('Failed to update sub-product. Please try again.');
    }
  };

  const handleDeleteSubProduct = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/sub-products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSubProducts();
        closeDeleteConfirmation();
      } else {
        const errorResult = await response.json();
        closeDeleteConfirmation();
        showWarning(errorResult.error || 'Failed to delete sub-product', 'Cannot Delete Sub-Product');
      }
    } catch (error) {
      console.error('Error deleting sub-product:', error);
      closeDeleteConfirmation();
      showError('Failed to delete sub-product. Please try again.');
    }
  };

  const openDeleteConfirmation = (subProduct) => {
    setDeleteConfirmation({
      isOpen: true,
      subProductId: subProduct.id,
      subProductName: subProduct.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      subProductId: null,
      subProductName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.subProductId) {
      handleDeleteSubProduct(deleteConfirmation.subProductId);
    }
  };

  // const getProductName = (productId) => {
  //   const product = products.find(p => p.id === productId);
  //   return product ? product.name : 'Unknown';
  // };

  // const getCategoryName = (categoryId) => {
  //   const category = categories.find(cat => cat.id === categoryId);
  //   return category ? category.name : 'Unknown';
  // };

  const handleAddGroup = async (groupForm) => {
    if (!groupForm.name) {
      return;
    }

    try {
      const url = editingGroup
        ? `http://localhost:5000/api/groups/${editingGroup.id}`
        : 'http://localhost:5000/api/groups';

      const response = await fetch(url, {
        method: editingGroup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm)
      });

      if (response.ok) {
        fetchGroups();
        setShowAddGroup(false);
        setEditingGroup(null);
        setGroupForm({ name: '', is_visible: 0 });
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to save group');
      }
    } catch (error) {
      console.error('Error saving group:', error);
      showError('Error saving group. Please try again.');
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name || '',
      is_visible: Number(group.is_visible) || 0
    });
    setShowAddGroup(true);
  };

  const handleDeleteGroup = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchGroups();
        closeDeleteGroupConfirmation();
        if (selectedGroup?.id === id) {
          setSelectedGroup(null);
        }
      } else {
        const error = await response.json();
        closeDeleteGroupConfirmation();
        showWarning(error.error || 'Failed to delete group', 'Cannot Delete Group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      closeDeleteGroupConfirmation();
      showError('Error deleting group. Please try again.');
    }
  };

  const openDeleteGroupConfirmation = (group) => {
    setDeleteGroupConfirmation({
      isOpen: true,
      groupId: group.id,
      groupName: group.name
    });
  };

  const closeDeleteGroupConfirmation = () => {
    setDeleteGroupConfirmation({
      isOpen: false,
      groupId: null,
      groupName: ''
    });
  };

  const confirmDeleteGroup = () => {
    if (deleteGroupConfirmation.groupId) {
      handleDeleteGroup(deleteGroupConfirmation.groupId);
    }
  };

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSubProducts = selectedGroup
    ? subProducts.filter(sp => 
        sp.group_id === selectedGroup.id &&
        (!searchQuery || sp.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="overflow-y-auto scrollbar-custom mt-1">
      {/* Header with Action Buttons */}
      <div className="flex gap-2 bg-pos-bg-secondary rounded-lg py-2 px-1">
        <button
          onClick={() => {
            resetForm();
            setEditingGroup(null);
            setGroupForm({ name: '', is_visible: 0 });
            setShowAddGroup(true);
          }}
          className="btn-primary"
        >
          Add Group
        </button>
        <button
          onClick={() => {
            if (selectedGroup) {
              handleEditGroup(selectedGroup);
            }
          }}
          disabled={!selectedGroup}
          className={`btn-primary ${!selectedGroup
            ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            : ""
            }`}
        >
          Edit Group
        </button>
        <button
          onClick={() => {
            if (selectedGroup) {
              openDeleteGroupConfirmation(selectedGroup);
            }
          }}
          disabled={!selectedGroup}
          className={`btn-primary ${!selectedGroup
            ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            : ""
            }`}
        >
          Delete Group
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (selectedGroup) {
                resetForm();
                setSubProductForm({ ...subProductForm, group_id: selectedGroup.id });
                setShowAddSubProduct(true);
              }
            }}
            disabled={!selectedGroup}
            className={`btn-primary ${!selectedGroup
              ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              : ""
              }`}
          >
            Add Subproduct
          </button>
        </div>
        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search groups, subproducts..."
        />
      </div>

      {/* Main Content Area */}
      <div className="flex gap-2 mt-4">
        {/* Left Sidebar - Groups */}
        <div className="flex-1 max-w-[11rem]">
          <h3 className="text-base font-medium text-pos-text-primary mb-2">
            Groups
          </h3>
          {loading ? (
            <div className="text-pos-text-muted text-lg p-4 text-center">
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="h-[500px] text-pos-text-muted text-sm border border-pos-border-secondary bg-pos-bg-secondary rounded-lg p-2 overflow-y-auto scrollbar-custom">
              No groups found.
            </div>
          ) : (
            <div className="h-[500px] min-w-[160px] max-w-[200px] border border-pos-border-secondary p-2 overflow-y-auto scrollbar-custom bg-pos-bg-secondary rounded-lg">
              {groups.filter(group =>
                !searchQuery || group.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(group => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`flex text-lg mt-1 mb-2 cursor-pointer transition-all duration-300 rounded-lg border border-pos-border-primary px-2 py-2 ${selectedGroup?.id === group.id
                    ? 'bg-pos-bg-primary shadow-lg'
                    : 'hover:bg-black/10 hover:shadow-md hover:scale-[1.02]'
                    }`}
                >
                  <div className="px-1 py-1 flex-1">
                    {group.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Content - Sub Products */}
        <div className="flex-[2] max-w-[26rem] min-w-[320px]">
          <h3 className="text-base font-medium text-pos-text-primary mb-2">
            Sub Products
          </h3>
          {!selectedGroup ? (
            <div className="h-[500px] text-pos-text-muted text-lg border border-pos-border-secondary bg-pos-bg-secondary p-2 rounded-lg text-pos-error">
              Select a group to view sub-products
            </div>
          ) : filteredSubProducts.length === 0 ? (
            <div className="h-[500px] text-pos-text-muted text-lg border border-pos-border-secondary p-2 rounded-lg bg-pos-bg-secondary text-pos-error">
              No sub-products
            </div>
          ) : (
            <div className="h-[500px] min-w-[320px] border border-pos-border-secondary p-2 text-lg overflow-y-auto scrollbar-custom rounded-lg bg-pos-bg-secondary">
              {filteredSubProducts.map((subProduct) => (
                <div
                  key={subProduct.id}
                  className={`flex justify-between border border-pos-border-primary items-center text-lg mt-1 mb-2 cursor-pointer transition-all duration-300 rounded-lg px-3 py-2 ${
                    'hover:bg-black/10 hover:shadow-md hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex-1">
                    {subProduct.name || "Unnamed Sub-Product"}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditSubProduct(subProduct)}
                      className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded-xl transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteConfirmation(subProduct)}
                      className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded-xl transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Sub-Product Modal */}
      {showAddSubProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowAddSubProduct(false)}>
          <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-3 py-2 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-pos-text-primary">Add New Sub Product</h3>
              <button
                onClick={() => setShowAddSubProduct(false)}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-3 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">
                    Group Name
                  </label>
                  <select
                    name="group_id"
                    value={subProductForm.group_id}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">
                    Sub Product Name <span className="text-pos-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={subProductForm.name}
                    onChange={handleInputChange}
                    onFocus={() => handleFieldFocus('name')}
                    className={`w-full bg-pos-bg-primary border ${fieldErrors.name ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="Enter sub-product name"
                  />
                  {fieldErrors.name && <p className="text-pos-error text-xs mt-1">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">Button Name</label>
                  <input
                    type="text"
                    name="button_name"
                    value={subProductForm.button_name}
                    onChange={handleInputChange}
                    onFocus={() => handleFieldFocus('button_name')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'button_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="Display name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">Production Name</label>
                  <input
                    type="text"
                    name="production_name"
                    value={subProductForm.production_name}
                    onChange={handleInputChange}
                    onFocus={() => handleFieldFocus('production_name')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'production_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="Name for production"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">Price vat inc</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={subProductForm.price}
                    onChange={handleInputChange}
                    onFocus={() => handleFieldFocus('price')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'price' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">VAT Takeout (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vat_takeout"
                    value={subProductForm.vat_takeout}
                    onChange={handleInputChange}
                    onFocus={() => handleFieldFocus('vat_takeout')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'vat_takeout' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">VAT Eat-in (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vat_eat_in"
                    value={subProductForm.vat_eat_in}
                    onChange={handleInputChange}
                    onFocus={() => handleFieldFocus('vat_eat_in')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'vat_eat_in' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    value={subProductForm.barcode}
                    onChange={handleInputChange}
                    onFocus={() => handleFieldFocus('barcode')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'barcode' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="Product barcode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">Addition Type</label>
                  <input
                    type="text"
                    name="addition_type"
                    value={subProductForm.addition_type}
                    onChange={handleInputChange}
                    onFocus={() => handleFieldFocus('addition_type')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'addition_type' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="Addition type"
                  />
                </div>
              {/* </div> */}

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-1 text-sm focus:outline-none focus:border-pos-info transition-colors file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm file:bg-pos-interactive-primary file:text-pos-text-primary hover:file:bg-pos-interactive-hover file:cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted">Color</label>
                  <input
                    type="color"
                    name="color"
                    value={subProductForm.color}
                    onChange={handleInputChange}
                    className="w-full h-10 bg-pos-bg-primary border border-pos-border-secondary cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Keypad Section */}
              {showKeypad && (
                <div className="">
                  <div className="mb-1 text-sm text-pos-text-muted text-center">
                    Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
                    <KeypadNumpad
                      onInput={handleKeypadInput}
                      onEnter={handleKeypadEnter}
                      onBackspace={handleKeypadBackspace}
                      onClear={handleKeypadClear}
                      defaultMode="keypad"
                      showDecimal={['price', 'vat_takeout', 'vat_eat_in'].includes(activeField)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-1 flex items-center justify-between gap-3">
              {/* Keypad Toggle Button */}
              <button
                type="button"
                onClick={() => setShowKeypad(!showKeypad)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  showKeypad
                    ? 'bg-pos-info text-white'
                    : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
                }`}>
                {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddSubProduct(false)}
                  className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubProduct}
                  className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Edit Sub-Product Modal */}
      {
        showEditSubProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowEditSubProduct(false)}>
            <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[500px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-xl font-semibold text-pos-text-primary">Edit Sub Product</h3>
                <button
                  onClick={() => setShowEditSubProduct(false)}
                  className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-3 gap-4 mb-4">

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">
                      Group Name
                    </label>
                    <select
                      name="group_id"
                      value={subProductForm.group_id}
                      onChange={handleInputChange}
                      className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2 text-sm focus:outline-none focus:border-pos-info transition-colors"
                    >
                      <option value="">Select Group</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">
                      Sub Product Name <span className="text-pos-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={subProductForm.name}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('name')}
                      className={`w-full bg-pos-bg-primary border ${fieldErrors.name ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      placeholder="Enter sub-product name"
                    />
                    {fieldErrors.name && <p className="text-pos-error text-xs mt-1">{fieldErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Button Name</label>
                    <input
                      type="text"
                      name="button_name"
                      value={subProductForm.button_name}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('button_name')}
                      className={`w-full bg-pos-bg-primary border ${activeField === 'button_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      placeholder="Display name"
                    />
                  </div>
                     <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Production Name</label>
                    <input
                      type="text"
                      name="production_name"
                      value={subProductForm.production_name}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('production_name')}
                      className={`w-full bg-pos-bg-primary border ${activeField === 'production_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      placeholder="Name for production"
                    />
                  </div>
                {/* </div>

                <div className="grid grid-cols-3 gap-4 mb-4"> */}
                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={subProductForm.price}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('price')}
                      className={`w-full bg-pos-bg-primary border ${activeField === 'price' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">VAT Takeout (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="vat_takeout"
                      value={subProductForm.vat_takeout}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('vat_takeout')}
                      className={`w-full bg-pos-bg-primary border ${activeField === 'vat_takeout' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">VAT Eat-in (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="vat_eat_in"
                      value={subProductForm.vat_eat_in}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('vat_eat_in')}
                      className={`w-full bg-pos-bg-primary border ${activeField === 'vat_eat_in' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      placeholder="0.00"
                    />
                  </div>
                {/* </div> */}

                {/* <div className="grid grid-cols-3 gap-4 mb-4"> */}
               

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={subProductForm.barcode}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('barcode')}
                      className={`w-full bg-pos-bg-primary border ${activeField === 'barcode' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      placeholder="Product barcode"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Addition Type</label>
                    <input
                      type="text"
                      name="addition_type"
                      value={subProductForm.addition_type}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('addition_type')}
                      className={`w-full bg-pos-bg-primary border ${activeField === 'addition_type' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      placeholder="Addition type"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Image</label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-1 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm file:bg-pos-interactive-primary file:text-pos-text-primary hover:file:bg-pos-interactive-hover file:cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Color</label>
                    <input
                      type="color"
                      name="color"
                      value={subProductForm.color}
                      onChange={handleInputChange}
                      className="w-full h-10 bg-pos-bg-primary border border-pos-border-secondary rounded-xl cursor-pointer"
                    />
                  </div>
                </div>
                
                {/* Keypad Section */}
                {showKeypad && (
                  <div className="px-4 py-2 flex-1 flex flex-col items-center justify-center" style={{"marginTop":"-1rem"}}>
                    <div className="mb-1 text-sm text-pos-text-muted text-center">
                      Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
                      <KeypadNumpad
                        onInput={handleKeypadInput}
                        onEnter={handleKeypadEnter}
                        onBackspace={handleKeypadBackspace}
                        onClear={handleKeypadClear}
                        defaultMode="keypad"
                        showDecimal={['price', 'vat_takeout', 'vat_eat_in'].includes(activeField)}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-between gap-3">
                {/* Keypad Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowKeypad(!showKeypad)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    showKeypad
                      ? 'bg-pos-info text-white'
                      : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
                  }`}>
                  {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditSubProduct(false)}
                    className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSubProduct}
                    className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <GroupFormModal
        isOpen={showAddGroup}
        onClose={() => {
          setShowAddGroup(false);
          setEditingGroup(null);
        }}
        onSubmit={handleAddGroup}
        group={editingGroup}
      />

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Sub Product"
        message={`Are you sure you want to delete "${deleteConfirmation.subProductName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmationModal
        isOpen={deleteGroupConfirmation.isOpen}
        onClose={closeDeleteGroupConfirmation}
        onConfirm={confirmDeleteGroup}
        title="Delete Group"
        message={`Are you sure you want to delete "${deleteGroupConfirmation.groupName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeModal}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </div>
  );
};

export default SubProductManager;
