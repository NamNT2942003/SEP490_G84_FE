import { useState, useEffect } from 'react';
import { checkInApi } from '@/features/manager_booking/api/checkInApi';

/**
 * Hook custom để tái sử dụng logic lấy danh sách các chi nhánh mà user hiện tại quản lý.
 */
export const useMyBranches = () => {
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchBranches = async () => {
            setIsLoading(true);
            try {
                const data = await checkInApi.getMyBranches();
                if (isMounted) {
                    setBranches(data || []);
                }
            } catch (err) {
                console.error('Lỗi khi lấy danh sách chi nhánh quản lý:', err);
                if (isMounted) setBranches([]);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchBranches();

        // Cleanup boolean helps avoid state updates on unmounted components
        return () => {
            isMounted = false;
        };
    }, []);

    return {
        branches,
        isLoading,
    };
};
