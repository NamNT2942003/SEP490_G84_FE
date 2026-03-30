import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const CHART_COLORS = [
    '#5396ff',
    '#f39c12',
    '#198754',
    '#6f42c1',
    '#e07b39',
    '#14b8a6',
];

const formatShort = (value) =>
    value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)}M`
        : value >= 1_000
        ? `${(value / 1_000).toFixed(0)}K`
        : String(value);

const formatFull = (value) =>
    new Intl.NumberFormat('en-US').format(value) + ' VND';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#fff',
                border: 'none',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                padding: '10px 14px',
                minWidth: '160px',
            }}>
                <p style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.85rem', color: '#333' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: payload[0]?.fill || '#555' }}>
                    {formatFull(payload[0]?.value)}
                </p>
            </div>
        );
    }
    return null;
};

const RevenueChart = ({ data }) => {
    if (!data || data.length === 0)
        return <div className="text-center p-5 text-muted">No data for this month</div>;

    return (
        <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 28, right: 20, left: 20, bottom: 5 }} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebebeb" />
                    <XAxis
                        dataKey="roomTypeName"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#555', fontSize: '0.82rem', fontWeight: 500 }}
                    />
                    <YAxis
                        tickFormatter={(v) => `${v / 1_000_000}M`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: '0.78rem' }}
                        width={40}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        <LabelList
                            dataKey="revenue"
                            position="top"
                            formatter={formatShort}
                            style={{ fill: '#555', fontSize: '0.75rem', fontWeight: 600 }}
                        />
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;