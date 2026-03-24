import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { COLORS } from '@/constants'; // Import file constants

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(value);
};

const RevenueChart = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-center p-5 text-muted">No data for this month</div>;

    return (
        <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="roomTypeName" tick={{fill: COLORS.TEXT_DARK}} />
                    <YAxis tickFormatter={(value) => `${value / 1000000}M`} tick={{fill: COLORS.TEXT_DARK}} />
                    <Tooltip 
                        formatter={(value) => formatCurrency(value)} 
                        cursor={{fill: COLORS.SECONDARY}}
                    />
                    {/* Đổi màu biểu đồ thành màu Primary của dự án */}
                    <Bar dataKey="revenue" fill={COLORS.PRIMARY} radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.PRIMARY} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;