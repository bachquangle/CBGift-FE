"use client";

const SellerInfoTab = ({ seller }) => {
  
  // [SỬA] Thêm hàm helper để tính toán an toàn
  const getDebtRatio = () => {
    if (!seller.totalSales || seller.totalSales === 0) {
      return 0; // Tránh chia cho 0
    }
    return (seller.totalDebt / seller.totalSales) * 100;
  };

  // Hàm format tiền tệ hhhhhhhhhh
  const formatCurrency = (value) => {
    if (value === 0) return "0";
    if (!value) return "-";
    if (value < 1_000_000) {
      return new Intl.NumberFormat("vi-VN").format(value);
    }
    return (value / 1_000_000).toFixed(1) + "M";
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Thông tin cơ bản
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase">
                Mã Seller
              </label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {seller.id}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase">
                Tên Seller
              </label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {seller.name}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase">
                Địa chỉ
              </label>
              <p className="text-gray-900 mt-1">{seller.address}</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase">
                Email
              </label>
             <p className="text-gray-900 mt-1">{seller.email || "N/A"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase">
                Phone
              </label>
              <p className="text-gray-900 mt-1">{seller.phone || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Thống kê
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 mb-1 font-semibold">
              Tổng doanh số
            </p>
            <p className="text-2xl font-bold text-green-600">
               {formatCurrency(seller.totalSales)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-xs text-gray-600 mb-1 font-semibold">
              Tổng công nợ
            </p>
            <p className="text-2xl font-bold text-red-600">
             {formatCurrency(seller.totalDebt)}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-1 font-semibold">Tỷ lệ nợ</p>
            <p className="text-2xl font-bold text-blue-600">
               {getDebtRatio().toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerInfoTab;
