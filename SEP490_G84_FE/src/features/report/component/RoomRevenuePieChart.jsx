import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { COLORS } from '@/constants';

const PIE_COLORS = [
    COLORS.PRIMARY,
    '#e07b39',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f59e0b',
];

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US').format(value) + ' VND';

const RoomRevenuePieChart = ({ data }) => {
    if (!data || data.length === 0)
        return <div className="text-center p-4 text-muted">No revenue data to display</div>;

    const chartData = data
        .filter((item) => item.revenue > 0)
        .map((item) => ({ name: item.roomTypeName, value: Number(item.revenue) }));

    if (chartData.length === 0)
        return <div className="text-center p-4 text-muted">No revenue data to display</div>;

    const RADIAN = Math.PI / 180;
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null; // Don't render label if too small
        const r = innerRadius + (outerRadius - innerRadius) * 0.55;
        const x = cx + r * Math.cos(-midAngle * RADIAN);
        const y = cy + r * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="46%"
                        innerRadius={70}
                        outerRadius={115}
                        paddingAngle={4}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomLabel}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value, name) => [formatCurrency(value), name]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" iconSize={10} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RoomRevenuePieChart;
