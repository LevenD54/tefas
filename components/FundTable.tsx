import React from 'react';
import { Fund, SortField, SortDirection } from '../types';
import { ArrowUpDown, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

interface FundTableProps {
  funds: Fund[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const FundTable: React.FC<FundTableProps> = ({ funds, sortField, sortDirection, onSort }) => {
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-blue-600 ml-1" /> 
      : <ChevronDown className="w-3 h-3 text-blue-600 ml-1" />;
  };

  const formatPercent = (val: number) => {
    const colorClass = val >= 0 ? 'text-teal-600' : 'text-red-500';
    return (
      <span className={`font-medium ${colorClass}`}>
        %{val.toFixed(2)}
      </span>
    );
  };

  const columns: { key: SortField, label: string, responsive?: boolean }[] = [
    { key: 'price', label: 'Son Fiyat' },
    { key: 'dailyReturn', label: 'Günlük' },
    { key: 'weeklyReturn', label: '1 Hafta' },
    { key: 'monthlyReturn', label: '1 Ay' },
    { key: 'threeMonthReturn', label: '3 Ay', responsive: true },
    { key: 'sixMonthReturn', label: '6 Ay', responsive: true },
    { key: 'ytdReturn', label: 'YBB', responsive: true },
    { key: 'yearlyReturn', label: '1 Yıl' },
    { key: 'threeYearReturn', label: '3 Yıl', responsive: true },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50/80 z-10 border-b border-gray-100">
                <div className="flex items-center cursor-pointer" onClick={() => onSort('code')}>
                  Fon
                  {getSortIcon('code')}
                </div>
              </th>
              {columns.map((col) => (
                <th 
                  key={col.key}
                  onClick={() => onSort(col.key)}
                  className={`px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none whitespace-nowrap ${col.responsive ? 'hidden md:table-cell' : ''}`}
                >
                  <div className="flex items-center justify-end">
                    {col.label}
                    {getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {funds.map((fund, idx) => (
              <tr key={fund.code} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white group-hover:bg-blue-50/30">
                  <div className="flex items-center">
                    <a 
                      href={`https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fund.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mr-3 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors"
                      title="TEFAS Detayını Gör"
                    >
                      {fund.code}
                    </a>
                    <div className="max-w-[150px] md:max-w-xs overflow-hidden">
                      <a 
                        href={`https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fund.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-gray-900 hover:text-blue-600 flex items-center gap-1"
                      >
                        {fund.code}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                      </a>
                      <div className="text-xs text-gray-500 truncate" title={fund.title}>{fund.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-right text-sm text-gray-900 font-semibold">
                  {fund.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </td>
                {columns.slice(1).map(col => (
                  <td key={col.key} className={`px-3 py-3 whitespace-nowrap text-right text-sm ${col.responsive ? 'hidden md:table-cell' : ''}`}>
                    {formatPercent(fund[col.key] as number)}
                  </td>
                ))}
              </tr>
            ))}
            {funds.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-gray-500">
                  Veri bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FundTable;