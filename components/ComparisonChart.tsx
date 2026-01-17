import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Fund } from '../types';

interface ComparisonChartProps {
  funds: Fund[];
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ funds }) => {
  // Take top 7 funds by yearly return for the chart
  const data = [...funds]
    .sort((a, b) => b.yearlyReturn - a.yearlyReturn)
    .slice(0, 7)
    .map(f => ({
      name: f.code,
      return: f.yearlyReturn
    }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Yıllık En Çok Kazandıran Fonlar</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#6b7280' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fill: '#6b7280' }} 
            axisLine={false} 
            tickLine={false}
            unit="%" 
          />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Bar dataKey="return" name="Yıllık Getiri (%)" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.return > 0 ? '#2563eb' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;