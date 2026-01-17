import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendLabel, icon }) => {
  const isPositive = trend >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{value}</h3>
        <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
          <span className="font-semibold">{Math.abs(trend).toFixed(2)}%</span>
          <span className="text-gray-400 ml-1 font-normal">{trendLabel}</span>
        </div>
      </div>
      <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;