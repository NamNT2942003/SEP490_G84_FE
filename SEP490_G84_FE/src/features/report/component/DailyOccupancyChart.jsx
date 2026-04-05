import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const d = payload[0]?.payload;
        return (
            <div style={{
                background: '#fff',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                padding: '12px 16px',
                minWidth: '180px',
            }}>
                <p style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.85rem', color: '#333' }}>
                    {label}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                        display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)'
                    }}/>
                    <span style={{ fontSize: '0.82rem', color: '#555' }}>
                        Occupancy: <strong style={{ color: '#333' }}>{d?.occupancyRate}%</strong>
                    </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 4, paddingLeft: 18 }}>
                    Sold: {d?.soldRooms} rooms &nbsp;|&nbsp; Available: {d?.availableRooms} rooms
                </div>
            </div>
        );
    }
    return null;
};

const DailyOccupancyChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="text-center p-4 text-muted">No occupancy data available</div>;
    }

    // Format data for chart
    const chartData = data.map(item => ({
        ...item,
        dayLabel: new Date(item.date).getDate().toString(),
        fullDate: new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
    }));

    // Calculate average for reference line
    const avg = data.reduce((sum, d) => sum + d.occupancyRate, 0) / data.length;

    return (
        <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#667eea" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="dayLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: '0.72rem' }}
                        interval={data.length > 20 ? 1 : 0}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: '0.75rem' }}
                        width={45}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                        y={Math.round(avg * 100) / 100}
                        stroke="#e74c3c"
                        strokeDasharray="6 4"
                        strokeWidth={1.5}
                        label={{
                            value: `Avg: ${Math.round(avg * 10) / 10}%`,
                            position: 'insideTopRight',
                            fill: '#e74c3c',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="occupancyRate"
                        stroke="#667eea"
                        strokeWidth={2.5}
                        fill="url(#occupancyGradient)"
                        dot={{ r: 2.5, fill: '#667eea', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#764ba2', stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DailyOccupancyChart;
