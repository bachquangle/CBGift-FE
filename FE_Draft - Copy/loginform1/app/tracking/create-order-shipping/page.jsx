"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const DOTNET_API_BASE_URL = 'https://localhost:7015/api';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
);

// Icon Components
const PackageIcon = () => <span className="text-lg">📦</span>;
const SearchIcon = () => <span className="text-lg">🔍</span>;
const UserIcon = () => <span className="text-lg">👤</span>;
const BoxIcon = () => <span className="text-lg">📫</span>;
const TagIcon = () => <span className="text-lg">🏷️</span>;
const CheckIcon = () => <span className="text-lg">✓</span>;

// Helper Functions
const getInputClass = (hasError) => {
  const baseClass = "w-full px-4 py-3 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  return hasError ? `${baseClass} border-destructive focus:ring-destructive` : "border-border " + baseClass;
};

const getButtonClass = () => "w-full inline-flex items-center justify-center rounded-lg text-base font-semibold h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all";

// Main Component
export default function CreateOrderShippingPage() {
  // Form State
  const [form, setForm] = useState({
    toName: '',
    toPhone: '',
    toAddress: '',
    weightInGrams: 100, // Cân nặng tổng của kiện hàng
    length: 10,
    width: 10,
    height: 10,
    price: 10000, // SỬA 1: Thêm 'price' (giá trị kiện hàng) vào state 'form'
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      itemName: '',
      quantity: 1,
      price: 10000, // Giá trị của sản phẩm này
      weightInGrams: 100 // Cân nặng của sản phẩm này
    }
  ]);

  const [errors, setErrors] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);
  const [createError, setCreateError] = useState(null);

  // Location State
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  // Fetch Provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch(`${DOTNET_API_BASE_URL}/Location/provinces`);
        if (!res.ok) throw new Error('Không thể tải Tỉnh/Thành');
        setProvinces(await res.json());
      } catch (err) {
        setCreateError(err.message);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch Districts
  useEffect(() => {
    if (!selectedProvince) return;
    const fetchDistricts = async () => {
      setDistricts([]);
      setWards([]);
      setSelectedDistrict('');
      setSelectedWard('');
      try {
        const res = await fetch(`${DOTNET_API_BASE_URL}/Location/districts/${selectedProvince}`);
        if (!res.ok) throw new Error('Không thể tải Quận/Huyện');
        setDistricts(await res.json());
      } catch (err) {
        setCreateError(err.message);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // Fetch Wards
  useEffect(() => {
    if (!selectedDistrict) return;
    const fetchWards = async () => {
      setWards([]);
      setSelectedWard('');
      try {
        const res = await fetch(`${DOTNET_API_BASE_URL}/Location/wards/${selectedDistrict}`);
        if (!res.ok) throw new Error('Không thể tải Phường/Xã');
        setWards(await res.json());
      } catch (err) {
        setCreateError(err.message);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      // SỬA 2: Thêm 'price' vào danh sách ép kiểu Number
      [name]: ['price', 'weightInGrams', 'length', 'width', 'height'].includes(name) ? Number(value) : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSelectChange = (setter, errorKey) => e => {
    setter(e.target.value);
    if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: null }));
  };

  const handleProductChange = (productId, fieldName, value) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? {
              ...product,
              [fieldName]: ['quantity', 'price', 'weightInGrams'].includes(fieldName)
                ? Number(value)
                : value
            }
          : product
      )
    );
  };

  const addProduct = () => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts(prev => [
      ...prev,
      {
        id: newId,
        itemName: '',
        quantity: 1,
        price: 10000,
        weightInGrams: 100
      }
    ]);
  };

  const removeProduct = (productId) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  // Validation
  const validateForm = () => {
    const errs = {};
    const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!form.toName) errs.toName = 'Tên người nhận là bắt buộc';
    if (!form.toPhone) errs.toPhone = 'SĐT người nhận là bắt buộc';
    else if (!phoneRegex.test(form.toPhone)) errs.toPhone = 'SĐT không hợp lệ';
    if (!selectedProvince) errs.province = 'Chọn Tỉnh/Thành';
    if (!selectedDistrict) errs.district = 'Chọn Quận/Huyện';
    if (!selectedWard) errs.ward = 'Chọn Phường/Xã';
    if (!form.toAddress) errs.toAddress = 'Địa chỉ bắt buộc';
    
    // Validation cho Kiện hàng (Package)
    if (form.weightInGrams < 1 || form.weightInGrams > 50000) errs.weightInGrams = 'Cân nặng kiện hàng phải từ 1 đến 50.000';
    if (form.price < 0) errs.price = 'Giá trị kiện hàng >= 0';
    ['length', 'width', 'height'].forEach(f => {
      if (form[f] < 1 || form[f] > 200) errs[f] = 'Kích thước kiện hàng từ 1 đến 200';
    });

    // Validation cho Sản phẩm (Products)
    products.forEach((product, idx) => {
      if (!product.itemName) errs[`product_${product.id}_itemName`] = 'Tên sản phẩm bắt buộc';
      if (product.quantity < 1) errs[`product_${product.id}_quantity`] = 'Số lượng >=1';
      if (product.price < 0) errs[`product_${product.id}_price`] = 'Giá >=0';
      if (product.weightInGrams < 1 || product.weightInGrams > 50000) errs[`product_${product.id}_weightInGrams`] = 'Cân nặng sản phẩm phải từ 1 đến 50.000';
    });

    return errs;
  };

  // Submit Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateResult(null);
    setCreateError(null);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsCreating(true);

    try {
      const provinceName = provinces.find(p => p.ProvinceID.toString() === selectedProvince)?.ProvinceName || '';
      const districtName = districts.find(d => d.DistrictID.toString() === selectedDistrict)?.DistrictName || '';
      const wardName = wards.find(w => w.WardCode === selectedWard)?.WardName || '';
      const fullAddress = `${form.toAddress}, ${wardName}, ${districtName}, ${provinceName}`;

      // SỬA 3: Xây dựng payload CHUẨN
      const payload = {
        // Thông tin người nhận
        toName: form.toName.trim(),
        toPhone: form.toPhone.trim(),
        toAddress: fullAddress.trim(),
        toDistrictId: parseInt(selectedDistrict),
        toWardCode: selectedWard,
        
        // Thông tin kiện hàng (từ form)
        weightInGrams: form.weightInGrams,
        length: form.length,
        width: form.width,
        height: form.height,
        items: products.map(p => ({
            name: p.itemName.trim(),
            quantity: p.quantity,
            price: p.price,
            weight: p.weightInGrams 
        }))
      };

      const response = await fetch(`${DOTNET_API_BASE_URL}/Shipping/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.errors) {
          const apiErrors = {};
          for (const key in data.errors) {
            const errorKey = key.charAt(0).toLowerCase() + key.slice(1);
            apiErrors[errorKey] = data.errors[key][0];
          }
          setErrors(apiErrors);
        } else {
          throw new Error(data.message || data.title || 'Lỗi khi tạo đơn');
        }
      } else {
        setCreateResult(data);
        // Reset form
        setForm({
          toName: '', toPhone: '', toAddress: '',
          weightInGrams: 100, length: 10, width: 10, height: 10, price: 10000
        });
        setProducts([
          {
            id: 1,
            itemName: '',
            quantity: 1,
            price: 10000,
            weightInGrams: 100
          }
        ]);
        setSelectedProvince('');
        setSelectedDistrict('');
        setSelectedWard('');
        setErrors({});
      }
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false); // Đảm bảo nút bấm được bật lại
    }
  };


  const numberInputProps = { min: 1, max: 200 };
  const weightProps = { min: 1, max: 50000 };
  const quantityProps = { min: 1 };
  const priceProps = { min: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="w-full px-4 py-6 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">GHN Express</h1>
              <p className="text-muted-foreground mt-1">Giải pháp vận chuyển nhanh chóng & đáng tin cậy</p>
            </div>
            <div className="text-5xl">📦</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-8 md:px-8 md:py-12">
        <form onSubmit={handleCreateSubmit} className="space-y-8">
          {/* Section 1: Recipient Info */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 bg-accent/10 border-b border-border px-6 py-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold">1</div>
              <h2 className="text-xl font-bold text-foreground">Thông tin người nhận</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <UserIcon /> Tên người nhận
                  </label>
                  <input
                    name="toName"
                    value={form.toName}
                    onChange={handleChange}
                    placeholder="VD: Nguyễn Văn A"
                    className={getInputClass(errors.toName)}
                  />
                  {errors.toName && <p className="text-sm text-destructive">{errors.toName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Số điện thoại</label>
                  <input
                    name="toPhone"
                    value={form.toPhone}
                    onChange={handleChange}
                    placeholder="VD: 0912345678"
                    className={getInputClass(errors.toPhone)}
                  />
                  {errors.toPhone && <p className="text-sm text-destructive">{errors.toPhone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Tỉnh/Thành phố</label>
                  <select
                    value={selectedProvince}
                    onChange={handleSelectChange(setSelectedProvince, 'province')}
                    className={getInputClass(errors.province)}
                  >
                    <option value="">-- Chọn --</option>
                    {provinces.map(p => (
                      <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                    ))}
                  </select>
                  {errors.province && <p className="text-sm text-destructive">{errors.province}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Quận/Huyện</label>
                  <select
                    value={selectedDistrict}
                    onChange={handleSelectChange(setSelectedDistrict, 'district')}
                    className={getInputClass(errors.district)}
                    disabled={!selectedProvince}
                  >
                    <option value="">-- Chọn --</option>
                    {districts.map(d => (
                      <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
                    ))}
                  </select>
                  {errors.district && <p className="text-sm text-destructive">{errors.district}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Phường/Xã</label>
                  <select
                    value={selectedWard}
                    onChange={handleSelectChange(setSelectedWard, 'ward')}
                    className={getInputClass(errors.ward)}
                    disabled={!selectedDistrict}
                  >
                    <option value="">-- Chọn --</option>
                    {wards.map(w => (
                      <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                    ))}
                  </select>
                  {errors.ward && <p className="text-sm text-destructive">{errors.ward}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Địa chỉ chi tiết (Số nhà, tên đường)</label>
                <input
                  name="toAddress"
                  value={form.toAddress}
                  onChange={handleChange}
                  placeholder="VD: 123 Đường Lê Lợi, Quận 1"
                  className={getInputClass(errors.toAddress)}
                />
                {errors.toAddress && <p className="text-sm text-destructive">{errors.toAddress}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Product Info */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 bg-accent/10 border-b border-border px-6 py-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold">2</div>
              <h2 className="text-xl font-bold text-foreground">Thông tin sản phẩm</h2>
            </div>
            <div className="p-6 space-y-6">
              {products.map((product, idx) => (
                <div key={product.id} className="pb-6 border-b border-border last:pb-0 last:border-0">
                  {products.length > 1 && (
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm font-semibold text-muted-foreground">Sản phẩm {idx + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                      >
                        ✕ Xóa sản phẩm
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <TagIcon /> Tên sản phẩm
                      </label>
                      <input
                        value={product.itemName}
                        onChange={(e) => handleProductChange(product.id, 'itemName', e.target.value)}
                        placeholder="VD: T-shirt, Sách, Điện thoại"
                        className={getInputClass(errors[`product_${product.id}_itemName`])}
                      />
                      {errors[`product_${product.id}_itemName`] && (
                        <p className="text-sm text-destructive">{errors[`product_${product.id}_itemName`]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Số lượng</label>
                      <input
                        type="number"
                        {...quantityProps}
                        value={product.quantity}
                        onChange={(e) => handleProductChange(product.id, 'quantity', e.target.value)}
                        className={getInputClass(errors[`product_${product.id}_quantity`])}
                      />
                      {errors[`product_${product.id}_quantity`] && (
                        <p className="text-sm text-destructive">{errors[`product_${product.id}_quantity`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Giá trị (VNĐ)</label>
                      <input
                        type="number"
                        {...priceProps}
                        value={product.price}
                        onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}
                        className={getInputClass(errors[`product_${product.id}_price`])}
                      />
                      {errors[`product_${product.id}_price`] && (
                        <p className="text-sm text-destructive">{errors[`product_${product.id}_price`]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">Cân nặng (gram)</label>
                      <input
                        type="number"
                        {...weightProps}
                        value={product.weightInGrams}
                        onChange={(e) => handleProductChange(product.id, 'weightInGrams', e.target.value)}
                        className={getInputClass(errors[`product_${product.id}_weightInGrams`])}
                      />
                      {errors[`product_${product.id}_weightInGrams`] && (
                        <p className="text-sm text-destructive">{errors[`product_${product.id}_weightInGrams`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addProduct}
                className="w-full mt-6 py-3 px-4 rounded-lg border-2 border-dashed border-border text-foreground font-semibold hover:bg-accent/5 transition-colors"
              >
                + Thêm sản phẩm
              </button>
            </div>
          </div>

          {/* Section 3: Package Info */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 bg-accent/10 border-b border-border px-6 py-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold">3</div>
              <h2 className="text-xl font-bold text-foreground">Thông tin kiện hàng</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Tổng Cân nặng (gram)</label>
                  <input
                    name="weightInGrams"
                    type="number"
                    {...weightProps}
                    value={form.weightInGrams}
                    onChange={handleChange}
                    className={getInputClass(errors.weightInGrams)}
                  />
                  {errors.weightInGrams && <p className="text-sm text-destructive">{errors.weightInGrams}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Tổng Giá trị hàng hóa (VNĐ)</label>
                  <input
                    name="price"
                    type="number"
                    {...priceProps}
                    value={form.price}
                    onChange={handleChange}
                    className={getInputClass(errors.price)}
                  />
                  {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Kích thước kiện hàng (cm)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {['length', 'width', 'height'].map(f => (
                    <div key={f} className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        {f === 'length' ? 'Dài' : f === 'width' ? 'Rộng' : 'Cao'}
                      </label>
                      <input
                        name={f}
                        type="number"
                        {...numberInputProps}
                        value={form[f]}
                        onChange={handleChange}
                        className={getInputClass(errors[f])}
                      />
                      {errors[f] && <p className="text-xs text-destructive">{errors[f]}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating}
            className={getButtonClass()}
          >
            {isCreating ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">Đang tạo đơn...</span>
              </>
            ) : (
              <>
                <CheckIcon />
                <span className="ml-2">Tạo Đơn Hàng</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {createError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
              <p className="text-destructive text-sm font-semibold">❌ {createError}</p>
            </div>
          )}

          {/* Success Message */}
          {createResult && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-700 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">✓</div>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">Tạo đơn hàng thành công!</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-green-200 dark:border-green-700">
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase">Mã đơn hàng</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">
                    {createResult.OrderCode || createResult.orderCode || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase">Phí vận chuyển</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">
                    {(createResult.TotalFee ?? createResult.totalFee ?? 0).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}