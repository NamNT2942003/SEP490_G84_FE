import { useState } from "react";
import DateRangePicker from "./DateRangePicker";

const SearchForm = ({ onSearch, loading }) => {
  const formatYmdLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const today = formatYmdLocal(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrow = formatYmdLocal(tomorrowDate);

  const [searchParams, setSearchParams] = useState({
    checkIn: today,
    checkOut: tomorrow,
    adults: 1,
    children: 0,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]:
        name === "adults" || name === "children" ? parseInt(value) : value,
    }));
  };

  const handleDateChange = ({ checkIn, checkOut }) => {
    setSearchParams((prev) => ({
      ...prev,
      checkIn: checkIn || prev.checkIn,
      checkOut: checkOut || prev.checkOut,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchParams.checkIn || !searchParams.checkOut) {
      alert("Please select both check-in and check-out dates");
      return;
    }
    onSearch(searchParams);
  };

  return (
    <div className="search-form-hero mb-4">
      <div className="card shadow-sm border-0">
        <div className="card-body py-3">
          <form onSubmit={handleSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-lg-5 col-md-6">
                <label className="form-label small text-uppercase fw-bold">Check-in & Check-out</label>
                <DateRangePicker checkIn={searchParams.checkIn} checkOut={searchParams.checkOut} onDateChange={handleDateChange} />
              </div>

              <div className="col-lg-2 col-md-3">
                <label className="form-label small text-uppercase fw-bold">Adults</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><i className="bi bi-person"></i></span>
                  <select className="form-select" name="adults" value={searchParams.adults} onChange={handleInputChange}>
                    {[1,2,3,4,5,6].map(num => (<option key={num} value={num}>{num} Adult{num>1?'s':''}</option>))}
                  </select>
                </div>
              </div>

              <div className="col-lg-2 col-md-3">
                <label className="form-label small text-uppercase fw-bold">Children</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><i className="bi bi-emoji-smile"></i></span>
                  <select className="form-select" name="children" value={searchParams.children} onChange={handleInputChange}>
                    {[0,1,2,3,4].map(num => (<option key={num} value={num}>{num} {num===1?'Child':'Children'}</option>))}
                  </select>
                </div>
              </div>

              <div className="col-lg-3 col-md-12 d-grid">
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ backgroundColor: '#5C6F4E', borderColor: '#5C6F4E' }}>
                  <i className="bi bi-search me-2"></i>{loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;
