import React, { useState, useEffect, useMemo } from 'react';
import { Fund, FundType, SortField, SortDirection } from './types';
import { fetchFunds } from './services/tefasService';
import FundTable from './components/FundTable';
import StatCard from './components/StatCard';
import ComparisonChart from './components/ComparisonChart';
import { 
  PieChart, 
  TrendingUp, 
  Wallet, 
  RefreshCw, 
  Filter,
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<FundType>(FundType.ALL);
  const [sortField, setSortField] = useState<SortField>('dailyReturn');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFunds(selectedType);
      if (data.length === 0) {
        setError("Veri çekildi ancak liste boş döndü. Filtreleri kontrol edin.");
      } else {
        setFunds(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
      setError("TEFAS verileri çekilemedi. CORS politikası veya erişim engeli olabilir.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedFunds = useMemo(() => {
    return [...funds].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Numeric sort
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    });
  }, [funds, sortField, sortDirection]);

  // Statistics
  const bestPerformer = useMemo(() => {
    if (funds.length === 0) return null;
    return [...funds].sort((a, b) => b.dailyReturn - a.dailyReturn)[0];
  }, [funds]);

  const avgReturn = useMemo(() => {
    if (funds.length === 0) return 0;
    const total = funds.reduce((acc, curr) => acc + curr.yearlyReturn, 0);
    return total / funds.length;
  }, [funds]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-teal-600 p-2 rounded-lg">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">TEFAS Analiz</h1>
                <p className="text-xs text-gray-500">Canlı Veri Takibi</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={loadData}
                className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all"
                title="Verileri Yenile"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Bağlantı Hatası</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-1 font-mono text-xs bg-red-100 p-1 rounded inline-block">
                    Not: Tarayıcı tabanlı erişim CORS engeline takılabilir.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={loadData}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Tekrar Dene
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <div className="px-3 py-2 border-r border-gray-100">
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
            {Object.values(FundType).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  selectedType === type
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400">
             {lastUpdated ? `Son Güncelleme: ${lastUpdated.toLocaleTimeString()}` : 'Veri bekleniyor...'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Günün En İyisi" 
            value={bestPerformer ? bestPerformer.code : '-'} 
            trend={bestPerformer ? bestPerformer.dailyReturn : 0}
            trendLabel="Günlük Getiri"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatCard 
            title="Ortalama Yıllık Getiri" 
            value={funds.length > 0 ? `%${avgReturn.toFixed(1)}` : '-'} 
            trend={funds.length > 0 ? 1 : 0}
            trendLabel="Sektör Ortalaması"
            icon={<Wallet className="w-6 h-6" />}
          />
          <StatCard 
            title="Listelenen Fon" 
            value={funds.length.toString()} 
            trend={0}
            trendLabel="Aktif Fon"
            icon={<PieChart className="w-6 h-6" />}
          />
        </div>

        {/* Chart Section */}
        {funds.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-3">
              <ComparisonChart funds={funds} />
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Fon Listesi</h2>
            <div className="text-sm text-gray-500">
              {sortedFunds.length} fon sıralanıyor
            </div>
          </div>
          
          {loading ? (
             <div className="bg-white rounded-xl shadow-sm p-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
             </div>
          ) : (
            <FundTable 
              funds={sortedFunds} 
              sortField={sortField} 
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;