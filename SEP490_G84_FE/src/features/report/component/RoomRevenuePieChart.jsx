import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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

const RADIAN = Math.PI / 180;

const renderOuterLabel = ({ cx, cy, midAngle, outerRadius, percent, name, index }) => {
    if (percent < 0.04) return null;
    const OFFSET = 16;
    const sx = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const sy = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const mx = cx + (outerRadius + OFFSET) * Math.cos(-midAngle * RADIAN);
    const my = cy + (outerRadius + OFFSET) * Math.sin(-midAngle * RADIAN);
    const isRight = Math.cos(-midAngle * RADIAN) >= 0;
    const ex = mx + (isRight ? 1 : -1) * 14;
    const ey = my;
    const textAnchor = isRight ? 'start' : 'end';
    const color = PIE_COLORS[index % PIE_COLORS.length];

    return (
        <g key={`label-${index}`}>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={color} fill="none" strokeWidth={1.5} />
            <circle cx={ex} cy={ey} r={2.5} fill={color} />
            <text
                x={ex + (isRight ? 4 : -4)}
                y={ey}
                textAnchor={textAnchor}
                fill="#333"
                fontSize={11}
                fontWeight={600}
                dominantBaseline="central"
            >
                {name} ({(percent * 100).toFixed(0)}%)
            </text>
        </g>
    );
};

const RoomRevenuePieChart = ({ data }) => {
    if (!data || data.length === 0)
        return <div className="text-center p-4 text-muted">No revenue data to display</div>;

    const chartData = data
        .filter((item) => item.revenue > 0)
        .map((item) => ({ name: item.roomTypeName, value: Number(item.revenue) }));

    if (chartData.length === 0)
        return <div className="text-center p-4 text-muted">No revenue data to display</div>;

    const total = chartData.reduce((sum, d) => sum + d.value, 0);

    return (
        <div style={{ width: '100%' }}>
            <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 24, right: 70, bottom: 24, left: 70 }}>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={76}
                            paddingAngle={3}
                            dataKey="value"
                            labelLine={false}
                            label={renderOuterLabel}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value, name) => [formatCurrency(value), name]}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="d-flex flex-wrap justify-content-center gap-2 mt-1" style={{ rowGap: '6px' }}>
                {chartData.map((entry, index) => (
                    <div key={index} className="d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', color: '#444' }}>
                        <div style={{
                            width: '10px', height: '10px',
                            borderRadius: '50%',
                            backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                            flexShrink: 0,
                        }} />
                        <span>{entry.name}</span>
                        <span style={{ color: '#888' }}>({total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomRevenuePieChart;
