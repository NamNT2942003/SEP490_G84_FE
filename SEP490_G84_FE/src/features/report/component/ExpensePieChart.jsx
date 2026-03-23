import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { COLORS } from '@/constants';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Danh sách màu sắc cho các miếng bánh (Pie slices)
const PIE_COLORS = [COLORS.PRIMARY, '#6b8e23', '#8fbc8f', '#bc8f8f', '#deb887', '#556b2f'];

const ExpensePieChart = ({ data }) => {
    // Chuyển đổi data từ monthlyDetail sang định dạng PieChart cần (loại bỏ các mục "Chưa có")
    const chartData = data
        .filter(item => item.amount > 0)
        .map(item => ({
            name: item.category,
            value: item.amount
        }));

    if (chartData.length === 0) return <div className="text-center p-4 text-muted">No expense data to display chart</div>;

    return (
        <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80} // Tạo hình Donut cho hiện đại
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpensePieChart;