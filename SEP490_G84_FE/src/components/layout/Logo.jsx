const Logo = ({ size = "md", variant = "light" }) => {
  const sizes = {
    sm: { height: 40, fontSize: "0.75rem" },
    md: { height: 50, fontSize: "0.85rem" },
    lg: { height: 60, fontSize: "1rem" },
  };

  const currentSize = sizes[size] || sizes.md;
  const isLight = variant === "light";

  return (
    <div className="d-flex align-items-center gap-3">
      <img
        src="/logo.png"
        alt="AN NGUYEN Hotel Logo"
        style={{
          height: `${currentSize.height}px`,
          width: "auto",
          objectFit: "contain",
        }}
      />
      <div className={isLight ? "text-white" : "text-dark"}>
        <h4
          className="mb-0 fw-bold"
          style={{ fontSize: `${parseFloat(currentSize.fontSize) * 1.4}rem` }}
        >
          AN NGUYEN
        </h4>
        <small className="d-block" style={{ fontSize: currentSize.fontSize }}>
          HOTEL & SERVICED APARTMENT
        </small>
      </div>
    </div>
  );
};

export default Logo;
