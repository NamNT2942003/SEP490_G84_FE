import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { COLORS } from '@/constants';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const YearlyRevenueChart = ({ data, onMonthClick }) => {
    if (!data || data.length === 0) return <div className="text-center p-5 text-muted">No data</div>;

    const formattedData = data.map(item => ({
        ...item,
        monthLabel: MONTH_NAMES[item.monthValue - 1] || item.monthLabel
    }));

    return (
        <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis dataKey="monthLabel" tick={{fill: COLORS.TEXT_DARK}} />
                    <YAxis tickFormatter={(value) => `${value / 1000000}M`} tick={{fill: COLORS.TEXT_DARK}} />
                    <Tooltip 
                        formatter={(value) => formatCurrency(value)} 
                        cursor={{fill: COLORS.SECONDARY}}
                    />
                    {/* Bắt sự kiện click, hiển thị tối thiểu 10px nếu revenue = 0 */}
                    <Bar 
                        dataKey="revenue" 
                        radius={[4, 4, 0, 0]} 
                        minPointSize={10} 
                        onClick={(entry) => {
                            // Xử lý an toàn: Lấy value trực tiếp hoặc bóc từ payload
                            const monthValue = entry.monthValue || entry.payload?.monthValue;
                            if (monthValue) {
                                onMonthClick(monthValue);
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS.PRIMARY} 
                                onMouseEnter={(e) => e.target.style.fill = COLORS.PRIMARY_HOVER}
                                onMouseLeave={(e) => e.target.style.fill = COLORS.PRIMARY}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default YearlyRevenueChart;