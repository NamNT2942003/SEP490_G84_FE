import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "@/services/apiClient";
import "@/features/booking/screens/SearchRoom.css";

const BranchRulesPage = () => {
    const { branchId } = useParams();
    const navigate = useNavigate();

    const [rules, setRules] = useState([]);
    const [branchInfo, setBranchInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRulesAndBranch = async () => {
            try {
                // Fetch branch info and rules in parallel
                const branchRes = await apiClient.get(`/branches/${branchId}`);
                const rulesRes = await apiClient.get(`/branches/${branchId}/rules`);

                if (branchRes.data?.data) {
                    setBranchInfo(branchRes.data.data);
                } else if (branchRes.data) {
                    setBranchInfo(branchRes.data);
                }

                if (rulesRes.data?.data) {
                    setRules(rulesRes.data.data);
                } else if (Array.isArray(rulesRes.data)) {
                    setRules(rulesRes.data);
                } else if (Array.isArray(rulesRes)) {
                    setRules(rulesRes);
                }
            } catch (err) {
                console.error("Failed to load hotel rules or branch info", err);
            } finally {
                setLoading(false);
            }
        };

        if (branchId) {
            fetchRulesAndBranch();
        }
    }, [branchId]);

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="container py-5" style={{ maxWidth: '900px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-4">
                <div>
                    <h2 className="fw-bold mb-1">Quy tắc chung</h2>
                    <p className="text-muted mb-0">
                        {branchInfo?.branchName || "Chỗ nghỉ này"} nhận yêu cầu đặc biệt - gửi yêu cầu trong bước kế tiếp!
                    </p>
                </div>
                <button
                    className="btn px-4 py-2 fw-bold text-white rounded-3 shadow-sm"
                    style={{ backgroundColor: '#1877F2', borderColor: '#1877F2', fontSize: '0.9rem' }}
                    onClick={handleBack}
                >
                    Quay lại tìm phòng
                </button>
            </div>

            <div className="card shadow-sm border rounded-3 overflow-hidden mb-5 bg-white">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="p-5 text-center text-muted">
                            <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                            Đang tải thông tin quy tắc...
                        </div>
                    ) : rules.length > 0 ? (
                        <div className="list-group list-group-flush">
                            {rules.map((rule, idx) => (
                                <div key={idx} className="list-group-item d-flex flex-wrap p-4 align-items-start border-bottom">
                                    <div style={{ flex: '0 0 250px', fontWeight: 'bold' }} className="d-flex align-items-start text-dark">
                                        <i className="bi bi-arrow-return-right me-3 mt-1 text-secondary"></i>
                                        {rule.ruleName}
                                    </div>
                                    <div style={{ flex: '1', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#444' }} className="mt-1 mt-md-0 fw-medium">
                                        {rule.ruleDesc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-5 text-center text-muted">
                            <i className="bi bi-info-circle text-secondary fs-4 d-block mb-3"></i>
                            <span className="fw-medium">Chỗ nghỉ này chưa cập nhật quy tắc chung.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BranchRulesPage;
