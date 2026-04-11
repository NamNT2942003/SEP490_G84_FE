import React, { useState } from 'react';
import RevenueChart from './RevenueChart';
import RevenueTable from './RevenueTable';
import RoomRevenuePieChart from './RoomRevenuePieChart';
import DailyOccupancyChart from './DailyOccupancyChart';
import OtaBreakdownModal from './OtaBreakdownModal';
import { COLORS } from '@/constants';

const MonthlyRevenueDashboard = ({ monthlyData, branchId, month, year }) => {
    const [viewMode, setViewMode] = useState('chart');
    const [showOtaModal, setShowOtaModal] = useState(false);
    const formatCurrency = (value) => new Intl.NumberFormat('en-US').format(value || 0);

    return (
        <div className="animate__animated animate__fadeInRight px-3 pb-4">
            {/* KPI Cards */}
            <div className="row mb-3 g-3">
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 h-100 rounded-3 p-2">
                        <div className="card-body py-2">
                            <h6 className="text-muted" style={{fontSize: '0.85rem'}}>Total Revenue</h6>
                            <h5 className="text-danger fw-bold mb-1">{formatCurrency(monthlyData.totalRevenue)}</h5>
                            <div style={{fontSize: '0.72rem', lineHeight: '1.5'}}>
                                <span className="text-success fw-bold">Direct: {formatCurrency(monthlyData.directRevenue || 0)}</span>
                                {(monthlyData.otaRevenue > 0) && (
                                    <span
                                        className="ms-2"
                                        onClick={() => setShowOtaModal(true)}
                                        style={{ color: '#e07b39', fontWeight: 600, cursor: 'pointer',
                                                 borderBottom: '1px dashed #e07b39' }}
                                        title="Click to see OTA channel breakdown"
                                    >
                                        OTA: {formatCurrency(monthlyData.otaRevenue)}
                                        <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '0.55rem' }} />
                                    </span>
                                )}
                                {(monthlyData.cancellationRevenue > 0) && (
                                    <span className="ms-2" style={{color: '#dc3545', fontWeight: 600}}>
                                        <i className="bi bi-x-circle-fill me-1" style={{ fontSize: '0.6rem' }} />
                                        Cancel Fee: {formatCurrency(monthlyData.cancellationRevenue)}
                                    </span>
                                )}
                            </div>
                            {(monthlyData.otaRevenue > 0) && (
                                <div className="text-muted mt-1 lh-sm" style={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                                    <i className="bi bi-info-circle me-1" />
                                    Note: OTA amounts are estimates before commission.
                                </div>
                            )}
                            <small className={monthlyData.momGrowth >= 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                                Last month: {monthlyData.momGrowth > 0 ? '+' : ''}{monthlyData.momGrowth}%
                            </small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 h-100 rounded-3 p-2">
                        <div className="card-body py-2">
                            <h6 className="text-muted" style={{fontSize: '0.85rem'}}>Occupancy Rate</h6>
                            <h5 className="fw-bold mb-1" style={{color: COLORS.PRIMARY}}>{monthlyData.occupancyRate}%</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 h-100 rounded-3 p-2">
                        <div className="card-body py-2">
                            <h6 className="text-muted" style={{fontSize: '0.85rem'}}>Average Daily Rate (ADR)</h6>
                            <h5 className="fw-bold mb-1" style={{color: COLORS.PRIMARY}}>{formatCurrency(monthlyData.adr)}</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 h-100 rounded-3 p-2">
                        <div className="card-body py-2">
                            <h6 className="text-muted" style={{fontSize: '0.85rem'}}>Total Guests</h6>
                            <h5 className="fw-bold mb-1" style={{color: COLORS.PRIMARY}}>{monthlyData.totalStandardGuests} <span className="fs-6 text-muted fw-normal">guests</span></h5>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Occupancy Line Chart */}
            {monthlyData.dailyOccupancy && monthlyData.dailyOccupancy.length > 0 && (
                <div className="row mb-3">
                    <div className="col-12">
                        <div className="card shadow-sm border-0 rounded-3">
                            <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
                                <h6 className="card-title mb-0 fw-bold text-dark">
                                    <i className="bi bi-graph-up me-2" style={{ color: '#667eea' }}></i>
                                    Daily Occupancy Rate
                                </h6>
                                <p className="text-muted small mb-0">Room occupancy percentage for each day of the month</p>
                            </div>
                            <div className="card-body pt-2">
                                <DailyOccupancyChart data={monthlyData.dailyOccupancy} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart / Table section + Pie Chart side by side */}
            <div className="row g-4 mt-0">
                {/* Bar chart / table toggle */}
                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 rounded-3 h-100">
                        <div className="card-header bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                            <h6 className="card-title mb-0 fw-bold text-dark">
                                {viewMode === 'chart' ? 'Revenue by Room Type' : 'Detailed Table'}
                            </h6>
                            <div className="btn-group">
                                <button 
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: viewMode === 'chart' ? COLORS.PRIMARY : 'transparent',
                                        color: viewMode === 'chart' ? COLORS.TEXT_LIGHT : COLORS.PRIMARY,
                                        borderColor: COLORS.PRIMARY
                                    }}
                                    onClick={() => setViewMode('chart')}
                                >
                                    View Chart
                                </button>
                                <button 
                                    className="btn btn-sm"
                                    style={{
                                        backgroundColor: viewMode === 'table' ? COLORS.PRIMARY : 'transparent',
                                        color: viewMode === 'table' ? COLORS.TEXT_LIGHT : COLORS.PRIMARY,
                                        borderColor: COLORS.PRIMARY
                                    }}
                                    onClick={() => setViewMode('table')}
                                >
                                    View Excel Table
                                </button>
                            </div>
                        </div>
                        <div className="card-body mt-2">
                            {viewMode === 'chart' ? (
                                <RevenueChart data={monthlyData.roomRevenues} />
                            ) : (
                                <RevenueTable roomData={monthlyData.roomRevenues} summary={monthlyData} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Pie Chart — Revenue Share by Room Type */}
                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 rounded-3 h-100">
                        <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
                            <h6 className="card-title mb-0 fw-bold text-dark">Revenue Share (%)</h6>
                            <p className="text-muted small mb-0">Contribution by room type</p>
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center p-2">
                            <RoomRevenuePieChart data={monthlyData.roomRevenues} />
                        </div>
                    </div>
                </div>
            </div>

            <OtaBreakdownModal
                show={showOtaModal}
                onClose={() => setShowOtaModal(false)}
                branchId={branchId}
                mode="monthly"
                month={month}
                year={year}
            />
        </div>
    );
};

export default MonthlyRevenueDashboard;
