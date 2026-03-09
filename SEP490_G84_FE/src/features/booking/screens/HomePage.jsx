import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  useScrollAnimation,
  useStaggerAnimation,
} from "../../../hooks/useScrollAnimation.js";
import "./css/HomePage.css";
const HERO_SLIDES = [
  {
    image:
      "https://scontent.fhan7-1.fna.fbcdn.net/v/t39.30808-6/641447135_1357900659693199_1668576787501991307_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_ohc=KrSKZ-eHrXMQ7kNvwFzkG3T&_nc_oc=AdlBd8H4zQr6YNifcAQWpV9C-qzw3CoJUVCdgNYGGYBpeUBtyOFK2wK0m0Zv42vjlQs&_nc_zt=23&_nc_ht=scontent.fhan7-1.fna&_nc_gid=ETQeIxmxImE_iNhr5V7Ypw&_nc_ss=8&oh=00_AfsDAbJu2prg3aQj-RPg0JhZvTe3ou8k6AeR80EuCHGEfg&oe=69A89CD8",
    title: "Experience Elegance",
    subtitle: "Where luxury meets the warmth of home",
  },
  {
    image:
      "https://scontent.fhan7-1.fna.fbcdn.net/v/t39.30808-6/641205524_1360500162766582_2740954552604800354_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_ohc=eUK2zhBAZnMQ7kNvwE4XAIO&_nc_oc=AdkUR0OOuX66ikaRD7JNgf6vwzsSHWYR77ysrHTmMQ_9NEIbfLYSqcS6HQsyJwhlQSQ&_nc_zt=23&_nc_ht=scontent.fhan7-1.fna&_nc_gid=mevxhX8tMDF6tOHod1MEeA&_nc_ss=8&oh=00_AfuPv2DhkvYbt6mVc8WWFSIw5abBJ6EY3VYfb_rOa0XQkQ&oe=69A893D6",
    title: "Exquisite Accommodations",
    subtitle: "Private retreats with world-class modern amenities",
  },
  {
    image:
      "https://scontent.fhan7-1.fna.fbcdn.net/v/t39.30808-6/643521088_1361414576008474_5933161240845747647_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=W_uiJ4HdAt4Q7kNvwHx03Yt&_nc_oc=AdlOynCK693024hHFnbEjTzBYWETH4TxOM7xiC3D01WJtl4_WART_dS6lH-nMu2ZsOc&_nc_zt=23&_nc_ht=scontent.fhan7-1.fna&_nc_gid=8Y8dDaj3UrpNWBFtXaFZiA&_nc_ss=8&oh=00_AfvNVuevleg9vyhtk8JTEfdCorluTaoX1cL-hQCOaorwUg&oe=69A8AC20",
    title: "Impeccable Service",
    subtitle: "Dedicated professionals at your service around the clock",
  },
];

const BRANCHES = [
  {
    id: 1,
    name: "AN NGUYEN Boutique",
    type: "Luxury Hotel",
    typeIcon: "bi-building",
    address: "10 Hang Giay Street, Hoan Kiem, Hanoi",
    phone: "024-3826-1234",
    image:
      "https://pix8.agoda.net/hotelImages/42087654/-1/ddb056b1f8acce677cc78b4c7edb16a2.jpg?ce=0&s=600x",
    secondaryImage:
      "https://pix8.agoda.net/hotelImages/42087654/-1/e56c0aa2a90d79671cfe06ee39f7ec29.jpg?ce=0&s=600x",
    description:
      "Our flagship 5-star hotel in the heart of Hanoi, offering world-class amenities, impeccable service, and stunning views of Hoan Kiem Lake. The perfect blend of modern luxury and Vietnamese heritage.",
    experience: "10+",
    experienceText: "Years of Excellence",
    roomTypes: [
      {
        name: "Deluxe Single Room",
        maxGuests: "2 Adults, 1 Child",
        price: "$32/night",
      },
      {
        name: "Deluxe Double Room",
        maxGuests: "2 Adults, 2 Children",
        price: "$48/night",
      },
      {
        name: "Executive Suite",
        maxGuests: "4 Adults, 2 Children",
        price: "$100/night",
      },
      {
        name: "Standard Room",
        maxGuests: "2 Adults, 1 Child",
        price: "$24/night",
      },
      {
        name: "Family Room",
        maxGuests: "4 Adults, 3 Children",
        price: "$72/night",
      },
    ],
    amenities: [
      "Infinity Pool",
      "Spa & Wellness Center",
      "Fine Dining Restaurant",
      "24/7 Concierge",
      "Airport Transfer",
      "Business Center",
    ],
  },
  {
    id: 2,
    name: "AN NGUYEN Buiding",
    type: " Homestay",
    typeIcon: "bi-house-heart",
    address: "59 Nguyen Khac Hieu Street",
    phone: "024 3266 9969",
    image:
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/102911438.jpg?k=bce39595f42fc74fe3239419f7c8038373da283fa4e5651c3e5f3a7f34ddfa7e&o=",
    secondaryImage:
      "https://cf.bstatic.com/xdata/images/hotel/max1024x768/102911228.jpg?k=44fb2c343c41a241eb53eb5536ebdf9016958b83dbb7097f11301124446537b3&o=",
    description:
      "Escape to the misty mountains of Sapa. Our charming homestay offers authentic local experiences, breathtaking terraced rice field views, and warm hospitality in the heart of nature.",
    experience: "5+",
    experienceText: "Years of Hospitality",
    roomTypes: [
      {
        name: "Studio Superior",
        maxGuests: "2 Adults",
        price: "$45/night",
      },
      {
        name: "One Bedroom Apartment",
        maxGuests: "2 Adults, 2 Children",
        price: "$65/night",
      },
      {
        name: "Two Bedroom Apartment",
        maxGuests: "3 Adults",
        price: "$85/night",
      },
       {
        name: "Standard Studio Apartment",
        maxGuests: "4 Adults",
        price: "$85/night",
      },
      {
        name: "Honeymoon Suite ",
        maxGuests: "2 Adults",
        price: "$100/night",
      },
      {
        name: "Family Room Overlooking the lake",
        maxGuests: "4 Adults, 2 Children",
        price: "$120/night",
      }

    ],
    amenities: [
      "Free WiFi",
      "Airport shuttle service (free)",
      "Family room",
      "Non-smoking room",
      "24-hour reception",
      "Rooftop / patio",
      "Garden",
      "Room service",
      "Elevator",
      "Laundry",

    ],
  },
  {
    id: 3,
    name: "AN NGUYEN Lakeside residence",
    type: "Truc Bach Homestay",
    typeIcon: "bi-sun",
    address: "45 Truc Bach Street, Ba Dinh District, Hanoi",
    phone: "024 3266 9969",
    image:
      "https://scontent.fhan7-1.fna.fbcdn.net/v/t39.30808-6/643521088_1361414576008474_5933161240845747647_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=W_uiJ4HdAt4Q7kNvwHx03Yt&_nc_oc=AdlOynCK693024hHFnbEjTzBYWETH4TxOM7xiC3D01WJtl4_WART_dS6lH-nMu2ZsOc&_nc_zt=23&_nc_ht=scontent.fhan7-1.fna&_nc_gid=QJF8yrG-jRPGsjHVgVbiow&_nc_ss=8&oh=00_Afsa5UKvyk723BXOcOxo4IZwK-peEuUOJI18tIDvbjVC1w&oe=69A8AC20",
    secondaryImage:
      "https://scontent.fhan7-1.fna.fbcdn.net/v/t39.30808-6/641670957_1361414609341804_535800936866752484_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_ohc=brfbbU0cNu4Q7kNvwFOdFM9&_nc_oc=AdmJuXLJtHwvNPI-X8cLFd7U0RWKqD7OIdxfMS3WLs_yDz3_1ODacQ4p_xN48Ak5VRM&_nc_zt=23&_nc_ht=scontent.fhan7-1.fna&_nc_gid=VZBKo0h6IKl5Co8-oRd96A&_nc_ss=8&oh=00_AfuAzJmNQ-iLBcx918s6YfBYTLktzfCAhWYc_XVMgbs4wQ&oe=69A896A4",
    description:
      "Wake up to pristine beaches and crystal-clear waters. Our beachfront villa offers a tropical paradise with private access to the beach, stunning sunsets, and island adventures.",
    experience: "3+",
    experienceText: "Years of Paradise",
    roomTypes: [
      { name: "Ocean View Room", maxGuests: "2 Adults", price: "$55/night" },
      {
        name: "Beach Bungalow",
        maxGuests: "2 Adults, 1 Child",
        price: "$75/night",
      },
      {
        name: "Private Pool Villa",
        maxGuests: "4 Adults, 2 Children",
        price: "$150/night",
      },
    ],
    amenities: [
      "Laundry service",
      "Daily room cleaning",
      "Sunset Bar",
      "Luggage storage",
      "Air conditioner in the common area",
      "Customer service staff",
    ],
  },
];

const ROOM_TYPES = [
  {
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
    name: "Deluxe Room",
    description:
      "Luxurious room with panoramic city views, premium furnishings, and a plush King-size bed.",
    size: "35m²",
    guests: "2 Adults",
    price: "120",
  },
  {
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d955e2f17?auto=format&fit=crop&w=800&q=80",
    name: "Superior Suite",
    description:
      "Spacious suite with a separate living area, soaking tub, and private balcony.",
    size: "55m²",
    guests: "2 Adults, 1 Child",
    price: "250",
  },
  {
    image:
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
    name: "Presidential Suite",
    description:
      "Exquisite presidential suite with a private dining room, grand living space, and butler service.",
    size: "85m²",
    guests: "4 Adults, 2 Children",
    price: "580",
  },
];

const AMENITIES = [
  {
    icon: "bi-water",
    title: "Infinity Pool",
    description:
      "Outdoor pool with breathtaking panoramic views of the city skyline",
  },
  {
    icon: "bi-flower1",
    title: "Spa & Wellness",
    description: "Relaxing spa treatments with premium wellness therapies",
  },
  {
    icon: "bi-cup-hot",
    title: "Fine Dining & Bar",
    description: "Asian & European cuisine crafted by award-winning chefs",
  },
  {
    icon: "bi-car-front",
    title: "Airport Transfer",
    description:
      "Complimentary VIP limousine service from the airport to your room",
  },
  {
    icon: "bi-wifi",
    title: "High-Speed Wi-Fi",
    description: "Complimentary ultra-fast internet throughout the premises",
  },
  {
    icon: "bi-shield-check",
    title: "24/7 Security",
    description:
      "State-of-the-art security systems ensuring your utmost safety",
  },
];

const GALLERY_IMAGES = [
  {
    src: "https://scontent.fhan7-1.fna.fbcdn.net/v/t39.30808-6/642277844_1361414689341796_7514751098715205149_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=7b2446&_nc_ohc=n_8RWGZFXEsQ7kNvwFITOsw&_nc_oc=AdkZ-aPhOTnfVux0zfBQZ-nxjdDABvbh1zNOZQrthHmNnT81nrgNJQRPp9X8zjAQoC0&_nc_zt=23&_nc_ht=scontent.fhan7-1.fna&_nc_gid=xY5g_vIvJYTNH_csX28BUA&_nc_ss=8&oh=00_AfsMKaZI7vD3fQw5-tvk-IDbD4jVX82bW0Qkj5v7ZnGw9g&oe=69A9ACAE",
    alt: "Hotel Lobby",
    span: "tall",
  },
  {
    src: "https://scontent.fhan7-1.fna.fbcdn.net/v/t39.30808-6/643521088_1361414576008474_5933161240845747647_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=W_uiJ4HdAt4Q7kNvwHx03Yt&_nc_oc=AdlOynCK693024hHFnbEjTzBYWETH4TxOM7xiC3D01WJtl4_WART_dS6lH-nMu2ZsOc&_nc_zt=23&_nc_ht=scontent.fhan7-1.fna&_nc_gid=0eLq7Niicq0k3qwFw6Uu4g&_nc_ss=8&oh=00_Aft1ny1jou2_mSWX1xw6ax3hpZIuLTtJDlrT1rTzEBg9QA&oe=69A98D20",
    alt: "Swimming Pool",
    span: "wide",
  },
  {
    src: "https://scontent.fhan7-1.fna.fbcdn.net/v/t39.30808-6/642277844_1361414689341796_7514751098715205149_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=7b2446&_nc_ohc=n_8RWGZFXEsQ7kNvwFITOsw&_nc_oc=AdkZ-aPhOTnfVux0zfBQZ-nxjdDABvbh1zNOZQrthHmNnT81nrgNJQRPp9X8zjAQoC0&_nc_zt=23&_nc_ht=scontent.fhan7-1.fna&_nc_gid=0I1V0a7m608PJo1T3rhUew&_nc_ss=8&oh=00_Afvw2DB4nWQ_7pbotmUD5Tfbv0zlETsY7pvpNd-Ymz4Gsg&oe=69A9ACAE",
    alt: "Restaurant",
    span: "normal",
  },
  {
    src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
    alt: "Hotel Exterior",
    span: "normal",
  },
  {
    src: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80",
    alt: "Bedroom",
    span: "wide",
  },
  {
    src: "https://images.unsplash.com/photo-1615460549969-36fa19521a4f?auto=format&fit=crop&w=600&q=80",
    alt: "Spa",
    span: "tall",
  },
];

const TESTIMONIALS = [
  {
    name: "Sophia Laurent",
    role: "Entrepreneur",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=100&q=80",
    text: "Outstanding service, wonderfully attentive staff, and immaculately kept rooms. I will absolutely return!",
    rating: 5,
  },
  {
    name: "James Whitfield",
    role: "Travel Blogger",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    text: "One of the finest hotels I have ever stayed in. Stunning views, exquisite dining, and a serene atmosphere.",
    rating: 5,
  },
  {
    name: "Elena Rossi",
    role: "Architect",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    text: "The interior design is truly magnificent — every corner is a work of art. An unforgettable experience!",
    rating: 5,
  },
];

const STATS = [
  { number: "500+", label: "Luxury Rooms" },
  { number: "15K+", label: "Delighted Guests" },
  { number: "4.9", label: "Average Rating" },
  { number: "24/7", label: "Concierge Service" },
];

const SectionHeading = ({ subtitle, title, description, light = false }) => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`section-heading text-center mb-5 ${isVisible ? "animate-fade-up" : "pre-animate"}`}
    >
      <span className={`section-subtitle ${light ? "text-white-50" : ""}`}>
        {subtitle}
      </span>
      <h2
        className={`section-title ${light ? "text-white" : ""}`}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {description && (
        <p className={`section-desc ${light ? "text-white-50" : ""}`}>
          {description}
        </p>
      )}
    </div>
  );
};

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      setIsTransitioning(false);
    }, 600);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="hero-section">
      <div className="hero-slides">
        {HERO_SLIDES.map((s, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide ? "active" : ""}`}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}
      </div>
      <div className="hero-overlay" />

      <div className="hero-content">
        <div
          className={`hero-text-container ${isTransitioning ? "fade-out" : "fade-in"}`}
        >
          <div className="hero-badge">An Nguyen - Hotel & Serviced Apartment</div>
          <h1 className="hero-title">{slide.title}</h1>
          <p className="hero-subtitle">{slide.subtitle}</p>
          <div className="hero-actions">
            <Link to="/search" className="hero-btn hero-btn-primary">
              <i className="bi bi-search me-2"></i>
              Find Your Room
            </Link>
            <a href="#about" className="hero-btn hero-btn-outline">
              <i className="bi bi-play-circle me-2"></i>
              Discover More
            </a>
          </div>
        </div>

        <div className="hero-indicators">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentSlide(idx);
                  setIsTransitioning(false);
                }, 600);
              }}
              className={`hero-indicator ${idx === currentSlide ? "active" : ""}`}
            />
          ))}
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <div className="scroll-mouse">
          <div className="scroll-wheel" />
        </div>
        <span>Scroll Down</span>
      </div>
    </section>
  );
};

const BranchesSection = () => {
  const [currentBranch, setCurrentBranch] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredBranch, setHoveredBranch] = useState(null);
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation();

  const nextBranch = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentBranch((prev) => (prev + 1) % BRANCHES.length);
      setIsTransitioning(false);
    }, 400);
  }, []);

  const prevBranch = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentBranch(
        (prev) => (prev - 1 + BRANCHES.length) % BRANCHES.length,
      );
      setIsTransitioning(false);
    }, 400);
  }, []);

  const goToBranch = (index) => {
    if (index === currentBranch) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentBranch(index);
      setIsTransitioning(false);
    }, 400);
  };

  const branch = BRANCHES[currentBranch];

  return (
    <section id="branches" className="section-padding branches-section">
      <div className="container">
        <SectionHeading
          subtitle="Our Locations"
          title='Discover <span class="text-accent">AN NGUYEN</span> Properties'
          description="From luxury hotels to charming homestays, find your perfect retreat across Vietnam"
        />

        <div
          ref={sectionRef}
          className={`branches-carousel ${sectionVisible ? "animate-fade-up" : "pre-animate"}`}
        >
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div
                className={`branch-images ${isTransitioning ? "fade-out" : "fade-in"}`}
              >
                <div className="branch-img-main">
                  <img src={branch.image} alt={branch.name} loading="lazy" />
                  <div className="branch-type-badge">
                    <i className={`bi ${branch.typeIcon}`}></i>
                    <span>{branch.type}</span>
                  </div>
                </div>
                <div className="branch-img-secondary">
                  <img
                    src={branch.secondaryImage}
                    alt={`${branch.name} Interior`}
                    loading="lazy"
                  />
                </div>
                <div className="branch-experience-badge">
                  <span className="exp-number">{branch.experience}</span>
                  <span className="exp-text">{branch.experienceText}</span>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div
                className={`branch-content ${isTransitioning ? "fade-out" : "fade-in"}`}
              >
                <div className="branch-header">
                  <span className="branch-location">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    {branch.address}
                  </span>
                  <h2 className="branch-name">{branch.name}</h2>
                  <p className="branch-phone">
                    <i className="bi bi-telephone me-2"></i>
                    {branch.phone}
                  </p>
                </div>

                <p className="branch-description">{branch.description}</p>

                {/* Room Types on Hover */}
                <div
                  className="branch-services-trigger"
                  onMouseEnter={() => setHoveredBranch(currentBranch)}
                  onMouseLeave={() => setHoveredBranch(null)}
                >
                  <div className="services-trigger-header">
                    <i className="bi bi-door-open me-2"></i>
                    <span>Room Types & Pricing</span>
                    <i className="bi bi-chevron-down ms-auto"></i>
                  </div>
                  <div
                    className={`branch-services-dropdown ${hoveredBranch === currentBranch ? "show" : ""}`}
                  >
                    {branch.roomTypes.map((room, idx) => (
                      <div key={idx} className="service-item">
                        <div className="service-info">
                          <span className="service-name">{room.name}</span>
                          <span className="service-guests">
                            <i className="bi bi-people me-1"></i>
                            {room.maxGuests}
                          </span>
                        </div>
                        <span className="service-price">{room.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="branch-amenities">
                  <h6>
                    <i className="bi bi-stars me-2"></i>Featured Amenities
                  </h6>
                  <div className="amenities-grid">
                    {branch.amenities.map((amenity, idx) => (
                      <span key={idx} className="amenity-tag">
                        <i className="bi bi-check-circle me-1"></i>
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="branch-actions">
                  <Link to="/search" className="btn-explore">
                    Explore Rooms <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                  <Link to="/about" className="btn-learn-more">
                    Learn More <i className="bi bi-info-circle ms-2"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="branches-controls">
            <div className="branch-indicators">
              {BRANCHES.map((b, idx) => (
                <button
                  key={idx}
                  onClick={() => goToBranch(idx)}
                  className={`branch-indicator ${idx === currentBranch ? "active" : ""}`}
                >
                  <span className="indicator-dot"></span>
                  <span className="indicator-label">{b.type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  const { containerRef, visibleItems } = useStaggerAnimation(STATS.length, 200);

  return (
    <section className="stats-section">
      <div className="stats-overlay" />
      <div className="container position-relative" ref={containerRef}>
        <div className="row">
          {STATS.map((stat, i) => (
            <div key={i} className="col-6 col-md-3">
              <div
                className={`stat-item ${visibleItems.includes(i) ? "animate-zoom-in" : "pre-animate-scale"}`}
              >
                <span className="stat-number">{stat.number}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const RoomsSection = () => {
  const { containerRef, visibleItems } = useStaggerAnimation(
    ROOM_TYPES.length,
    200,
  );

  return (
    <section className="section-padding rooms-section">
      <div className="container">
        <SectionHeading
          subtitle="Rooms & Suites"
          title='The <span class="text-accent">Perfect</span> Choice for You'
          description="Each room is designed with a distinctive style, delivering an unforgettable retreat"
        />

        <div className="row g-4" ref={containerRef}>
          {ROOM_TYPES.map((room, i) => (
            <div key={i} className="col-lg-4 col-md-6">
              <div
                className={`room-card ${visibleItems.includes(i) ? "animate-fade-up" : "pre-animate"}`}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="room-card-img">
                  <img src={room.image} alt={room.name} loading="lazy" />
                  <div className="room-card-overlay">
                    <Link to="/search" className="room-card-btn">
                      Book Now
                    </Link>
                  </div>
                  <div className="room-card-badge">{room.size}</div>
                </div>
                <div className="room-card-body">
                  <h4 className="room-card-title">{room.name}</h4>
                  <p className="room-card-desc">{room.description}</p>
                  <div className="room-card-meta">
                    <span>
                      <i className="bi bi-people me-1"></i>
                      {room.guests}
                    </span>
                    <span>
                      <i className="bi bi-arrows-angle-expand me-1"></i>
                      {room.size}
                    </span>
                  </div>
                  <div className="room-card-footer">
                    <div className="room-card-price">
                      <span className="price-amount">
                        <small>$</small>
                        {room.price}
                      </span>
                      <span className="price-unit">/ night</span>
                    </div>
                    <Link to="/search" className="room-card-link">
                      Details <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-5">
          <Link to="/search" className="btn-explore-rooms">
            View All Rooms <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

const AmenitiesSection = () => {
  const { containerRef, visibleItems } = useStaggerAnimation(
    AMENITIES.length,
    120,
  );

  return (
    <section className="section-padding amenities-section">
      <div className="container">
        <SectionHeading
          subtitle="Amenities"
          title='World-Class <span class="text-accent">Facilities</span>'
          description="Premium amenities designed to deliver the most exquisite holiday experience"
          light
        />

        <div className="row g-4" ref={containerRef}>
          {AMENITIES.map((amenity, i) => (
            <div key={i} className="col-lg-4 col-md-6">
              <div
                className={`amenity-card ${visibleItems.includes(i) ? "animate-fade-up" : "pre-animate"}`}
              >
                <div className="amenity-icon">
                  <i className={`bi ${amenity.icon}`}></i>
                </div>
                <h5 className="amenity-title">{amenity.title}</h5>
                <p className="amenity-desc">{amenity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const GallerySection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="section-padding gallery-section">
      <div className="container">
        <SectionHeading
          subtitle="Gallery"
          title='Discover Our <span class="text-accent">Spaces</span>'
          description="The finest moments captured at AN NGUYEN Hotel & Serviced Apartment"
        />

        <div
          ref={ref}
          className={`gallery-grid ${isVisible ? "gallery-visible" : ""}`}
        >
          {GALLERY_IMAGES.map((img, i) => (
            <div key={i} className={`gallery-item gallery-${img.span}`}>
              <img src={img.src} alt={img.alt} loading="lazy" />
              <div className="gallery-hover">
                <i className="bi bi-zoom-in"></i>
                <span>{img.alt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const { containerRef, visibleItems } = useStaggerAnimation(
    TESTIMONIALS.length,
    250,
  );

  return (
    <section className="section-padding testimonials-section">
      <div className="container">
        <SectionHeading
          subtitle="Testimonials"
          title='What Our <span class="text-accent">Guests</span> Say'
          description="Guest satisfaction is the true measure of our excellence"
        />

        <div className="row g-4" ref={containerRef}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="col-lg-4 col-md-6">
              <div
                className={`testimonial-card ${visibleItems.includes(i) ? "animate-fade-up" : "pre-animate"}`}
              >
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, s) => (
                    <i key={s} className="bi bi-star-fill"></i>
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <img src={t.avatar} alt={t.name} loading="lazy" />
                  <div>
                    <h6>{t.name}</h6>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CtaSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="cta-section">
      <div className="cta-overlay" />
      <div className="container position-relative">
        <div
          ref={ref}
          className={`cta-content ${isVisible ? "animate-zoom-in" : "pre-animate-scale"}`}
        >
          <h2>Ready for Your Dream Getaway?</h2>
          <p>
            Book today and enjoy up to <strong>30%</strong> off your first stay
          </p>
          <div className="cta-actions">
            <Link to="/search" className="cta-btn cta-btn-primary">
              <i className="bi bi-calendar-check me-2"></i>
              Book Now
            </Link>
            <a href="tel:+84123456789" className="cta-btn cta-btn-outline">
              <i className="bi bi-telephone me-2"></i>
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

const HomePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="homepage">
      <HeroSection />
      <BranchesSection />
      <StatsSection />
      <RoomsSection />
      <AmenitiesSection />
      <GallerySection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  );
};

export default HomePage;
