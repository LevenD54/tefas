import React, { useState, useEffect, useMemo } from 'react';
import { Fund, FundType, SortField, SortDirection } from './types';
import { fetchFunds, getLastDbUpdate } from './services/tefasService';
import FundTable from './components/FundTable';
import StatCard from './components/StatCard';
import ComparisonChart from './components/ComparisonChart';
import { 
  PieChart, 
  TrendingUp, 
  Wallet, 
  RefreshCw, 
  Filter,
  AlertTriangle,
  WifiOff,
  Database
} from 'lucide-react';

const App: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'cache'>('api');
  const [selectedType, setSelectedType] = useState<FundType>(FundType.ALL);
  const [sortField, setSortField] = useState<SortField>('dailyReturn');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFunds(selectedType);
      
      if (result.data.length === 0) {
        setError("Veri kaynağı boş liste döndürdü. Seçili kriterlere uygun fon bulunamadı.");
        setFunds([]);
      } else {
        setFunds(result.data);
        setDataSource(result.source);
        if (result.source === 'api') {
           setLastUpdated(new Date());
        } else {
           setLastUpdated(getLastDbUpdate());
        }
      }
    } catch (err: any) {
      console.error("App Load Data Error:", err);
      // Even if fetch fails, check if we have old data in state?
      // No, service handles cache fallback. If we are here, everything failed.
      setError(err.message || "Veriler yüklenirken beklenmeyen bir hata oluştu.");
      setFunds([]); 
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
    if (!funds) return [];
    return [...funds].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
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

  // --- FULL SCREEN STATES ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-100 border-t-teal-600 mb-6"></div>
          <h2 className="text-xl font-bold text-gray-800">Veriler Yükleniyor</h2>
          <p className="text-sm text-gray-500 mt-2 text-center">
            TEFAS üzerinden güncel fon verileri çekiliyor...
          </p>
        </div>
      </div>
    );
  }

  // Critical Error State
  if (error && funds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 max-w-lg w-full text-center">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Veri Bağlantısı Hatası</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={loadData} className="px-5 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700">
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        
        {/* Soft Error / Source Banner */}
        {dataSource === 'cache' && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-center justify-between">
             <div className="flex items-center">
                <Database className="h-5 w-5 text-amber-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Çevrimdışı Veri Modu</p>
                  <p className="text-xs text-amber-700">
                    TEFAS bağlantısı kurulamadı. Daha önce kaydedilen veriler (Veritabanı) gösteriliyor.
                  </p>
                </div>
             </div>
             <button onClick={loadData} className="text-xs font-semibold text-amber-800 hover:underline">Bağlanmayı Dene</button>
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
             {lastUpdated ? `Son Güncelleme: ${lastUpdated.toLocaleTimeString()}` : ''}
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
          
          <FundTable 
            funds={sortedFunds} 
            sortField={sortField} 
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </div>
      </main>
    </div>
  );
};

export default App;