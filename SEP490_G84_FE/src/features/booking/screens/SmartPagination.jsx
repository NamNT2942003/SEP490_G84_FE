const SmartPagination = ({ currentPage, totalPages, totalElements, pageSize, onPageChange }) => {
    if (totalPages <= 1) return null;

    const startItem = currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

    // Smart page number generation: always show first, last, current ± 1, with ellipsis
    const getPages = () => {
        const pages = [];
        const add = (n) => { if (!pages.includes(n)) pages.push(n); };

        add(0); // first
        for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) add(i);
        add(totalPages - 1); // last

        pages.sort((a, b) => a - b);

        // Insert ellipsis markers
        const result = [];
        for (let i = 0; i < pages.length; i++) {
            if (i > 0 && pages[i] - pages[i - 1] > 1) result.push("...");
            result.push(pages[i]);
        }
        return result;
    };

    return (
        <>
            <style>{`
        .sp{margin-top:24px;background:#fff;border-radius:14px;padding:14px 20px;box-shadow:0 2px 8px rgba(0,0,0,.04);border:1px solid #eee;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
        .sp-info{font-size:.84rem;color:#888;font-weight:500}
        .sp-info b{color:#333;font-weight:700}
        .sp-nav{display:flex;align-items:center;gap:4px}
        .sp-btn{min-width:38px;height:38px;border:1.5px solid #e8e8e8;border-radius:10px;background:#fff;color:#555;font-size:.84rem;font-weight:600;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;padding:0 6px}
        .sp-btn:hover:not(:disabled):not(.sp-ell){border-color:#465c47;color:#465c47;background:#f8faf6;transform:translateY(-1px);box-shadow:0 2px 8px rgba(92,111,78,.12)}
        .sp-btn.active{background:linear-gradient(135deg,#465c47,#384a39);color:#fff;border-color:#465c47;box-shadow:0 3px 10px rgba(92,111,78,.25);transform:translateY(-1px)}
        .sp-btn:disabled{opacity:.35;cursor:not-allowed}
        .sp-ell{border:none;background:transparent;cursor:default;color:#bbb;font-size:1rem;min-width:28px}
        .sp-arrow{font-size:.78rem}
        .sp-jump{display:flex;align-items:center;gap:6px;font-size:.8rem;color:#888}
        .sp-jump input{width:50px;height:32px;border:1.5px solid #e8e8e8;border-radius:8px;text-align:center;font-size:.82rem;font-weight:600;color:#333}
        .sp-jump input:focus{border-color:#465c47;outline:none;box-shadow:0 0 0 2px rgba(92,111,78,.1)}
        .sp-jump button{height:32px;padding:0 12px;border:none;border-radius:8px;background:#465c47;color:#fff;font-size:.76rem;font-weight:700;cursor:pointer}
        .sp-jump button:hover{background:#384a39}
        @media(max-width:576px){.sp{flex-direction:column;text-align:center}.sp-nav{order:-1}}
      `}</style>
            <div className="sp">
                <div className="sp-info">
                    <i className="bi bi-list-ul me-1"></i>
                    Showing <b>{startItem}</b> – <b>{endItem}</b> of <b>{totalElements}</b> rooms
                </div>

                <div className="sp-nav">
                    {/* First page */}
                    <button className="sp-btn sp-arrow" onClick={() => onPageChange(0)} disabled={currentPage === 0} title="First page">
                        <i className="bi bi-chevron-double-left"></i>
                    </button>
                    {/* Previous */}
                    <button className="sp-btn sp-arrow" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0} title="Previous page">
                        <i className="bi bi-chevron-left"></i>
                    </button>

                    {getPages().map((p, i) =>
                        p === "..." ? (
                            <span key={`ell-${i}`} className="sp-btn sp-ell">…</span>
                        ) : (
                            <button
                                key={p}
                                className={`sp-btn ${p === currentPage ? "active" : ""}`}
                                onClick={() => onPageChange(p)}
                                title={`Page ${p + 1}`}
                            >
                                {p + 1}
                            </button>
                        )
                    )}

                    {/* Next */}
                    <button className="sp-btn sp-arrow" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} title="Next page">
                        <i className="bi bi-chevron-right"></i>
                    </button>
                    {/* Last */}
                    <button className="sp-btn sp-arrow" onClick={() => onPageChange(totalPages - 1)} disabled={currentPage === totalPages - 1} title="Last page">
                        <i className="bi bi-chevron-double-right"></i>
                    </button>
                </div>

                {totalPages > 5 && (
                    <div className="sp-jump">
                        Go to
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            placeholder="#"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const v = parseInt(e.target.value);
                                    if (v >= 1 && v <= totalPages) { onPageChange(v - 1); e.target.value = ""; }
                                }
                            }}
                        />
                    </div>
                )}
            </div>
        </>
    );
};

export default SmartPagination;