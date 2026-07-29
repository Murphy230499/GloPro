import React from 'react';
import { X } from 'lucide-react';

export default function EmployeePayslipModal({ isOpen, onClose, employee, payPeriod, payDate }) {
  if (!isOpen || !employee) return null;

  const formatMoney = (amount) => {
    if (!amount) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  // Mock calculation mapping from our existing data to the payslip structure
  const serviceCom = employee.serviceCom || 0;
  const productCom = employee.productCom || 0;
  const tips = employee.tip || 0;
  const salary = employee.salary || 0;
  const treatmentCom = employee.treatmentCom || 0;
  const packageCom = employee.packageCom || 0;
  const serviceComboCom = employee.serviceComboCom || 0;
  const productComboCom = employee.productComboCom || 0;
  const prepaidCardCom = employee.prepaidCardCom || 0;
  const requestedCom = employee.requestedCom || 0;
  const overtimeCom = employee.overtimeCom || 0;
  const revenueCom = employee.revenueCom || 0;

  const bonus = employee.bonus || 0;
  const penalty = employee.penalty || 0;
  const totalPay = serviceCom + productCom + treatmentCom + packageCom + serviceComboCom + productComboCom + prepaidCardCom + requestedCom + overtimeCom + revenueCom + tips + salary + bonus - penalty;

  // Mock Tax values (percentage of total pay for demonstration)
  const federalTax = totalPay * 0.05;
  const socialSecurityTax = totalPay * 0.02;
  const medicareTax = totalPay * 0.01;
  const stateTax = totalPay * 0.015;
  const totalTaxes = federalTax + socialSecurityTax + medicareTax + stateTax;

  // Mock Contributions (Employer side usually, but shown on slip)
  const socialSecurityContrib = totalPay * 0.02;
  const medicareContrib = totalPay * 0.01;
  const futaContrib = totalPay * 0.005;
  const stateUnemploymentContrib = totalPay * 0.005;
  const totalContributions = socialSecurityContrib + medicareContrib + futaContrib + stateUnemploymentContrib;

  const netPay = totalPay - totalTaxes;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-50 w-full max-w-[900px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Chi tiết phiếu lương</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {/* Info Section */}
          <div className="border border-slate-100 rounded-xl p-5 bg-white shadow-sm flex flex-wrap gap-8 justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-800 mb-2">Cơ sở</p>
              <p className="text-sm font-normal text-slate-600">{employee.branch_name || 'Chi nhánh trung tâm'}</p>
              <p className="text-sm font-normal text-slate-600">Địa chỉ: {employee.branch_address || 'TP.HCM'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-800 mb-2">Nhân viên</p>
              <p className="text-sm font-normal text-slate-600">{employee.name || employee.full_name}</p>
              <p className="text-sm font-normal text-slate-600">Địa chỉ: {employee.address || 'Chưa cập nhật'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-normal text-slate-600"><span className="font-semibold text-slate-800">Kỳ lương:</span> {payPeriod}</p>
              <p className="text-sm font-normal text-slate-600"><span className="font-semibold text-slate-800">Ngày TT:</span> {payDate}</p>
              <p className="text-sm font-normal text-slate-600"><span className="font-semibold text-slate-800">Phương thức TT:</span> Tiền mặt</p>
            </div>
          </div>

          {/* Tables Container */}
          <div className="space-y-6">
            
            {/* Pay Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[#eff5ff] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5 text-sm font-semibold text-slate-700">Thu nhập</th>
                    <th className="py-3 px-5 text-sm font-semibold text-slate-700 text-right w-1/3">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Dịch vụ</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(serviceCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Sản phẩm</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(productCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Liệu trình</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(treatmentCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Gói DV</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(packageCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Combo DV</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(serviceComboCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Combo SP</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(productComboCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Thẻ TM</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(prepaidCardCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Khách yêu cầu</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(requestedCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Tăng ca</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(overtimeCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">HH Doanh thu</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(revenueCom)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Tiền Tip</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(tips)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Lương cơ bản</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(salary)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Thưởng</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(bonus)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Phạt</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right text-red-500">-{formatMoney(penalty)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#eff5ff] border-t border-slate-100">
                  <tr>
                    <td className="py-3 px-5 text-sm font-bold text-slate-800">Tổng cộng</td>
                    <td className="py-3 px-5 text-sm font-bold text-slate-800 text-right">{formatMoney(totalPay)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Taxes Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[#eff5ff] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5 text-sm font-semibold text-slate-700">Thuế giữ lại</th>
                    <th className="py-3 px-5 text-sm font-semibold text-slate-700 text-right w-1/3">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Thuế thu nhập liên bang</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(federalTax)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Bảo hiểm xã hội</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(socialSecurityTax)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Bảo hiểm y tế</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(medicareTax)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Thuế thu nhập cá nhân</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(stateTax)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#eff5ff] border-t border-slate-100">
                  <tr>
                    <td className="py-3 px-5 text-sm font-bold text-slate-800">Tổng cộng</td>
                    <td className="py-3 px-5 text-sm font-bold text-slate-800 text-right">{formatMoney(totalTaxes)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Contributions Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-[#eff5ff] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5 text-sm font-semibold text-slate-700">Đóng góp</th>
                    <th className="py-3 px-5 text-sm font-semibold text-slate-700 text-right w-1/3">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Bảo hiểm xã hội</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(socialSecurityContrib)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Bảo hiểm y tế</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(medicareContrib)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Bảo hiểm thất nghiệp liên bang</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(futaContrib)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600">Bảo hiểm thất nghiệp tiểu bang</td>
                    <td className="py-3.5 px-5 text-sm font-normal text-slate-600 text-right">{formatMoney(stateUnemploymentContrib)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#eff5ff] border-t border-slate-100">
                  <tr>
                    <td className="py-3 px-5 text-sm font-bold text-slate-800">Tổng cộng</td>
                    <td className="py-3 px-5 text-sm font-bold text-slate-800 text-right">{formatMoney(totalContributions)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Net Pay */}
            <div className="bg-[#eff5ff] rounded-xl px-6 py-4 flex justify-between items-center mt-6">
              <span className="text-sm font-semibold text-slate-800">Thực lãnh:</span>
              <span className="text-base font-bold text-slate-800">{formatMoney(netPay)}</span>
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
