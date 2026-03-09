import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  useScrollAnimation,
  useStaggerAnimation,
} from "../../../hooks/useScrollAnimation.js";
import "./css/AboutPage.css";

const TEAM_MEMBERS = [
  {
    name: "Nguyen Van An",
    role: "Founder & CEO",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    description:
      "With over 20 years of experience in the hospitality industry, Mr. An founded AN NGUYEN with a vision.",
  },
  {
    name: "Tran Thi Mai",
    role: "Chief Operations Officer",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    description:
      "Ms. Mai oversees all operational aspects across our properties, ensuring consistent excellence in service delivery and guest satisfaction.",
  },
  {
    name: "Le Minh Duc",
    role: "Head of Design",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    description:
      "Mr. Duc brings each property to life with his unique blend of modern aesthetics and traditional Vietnamese design elements.",
  },
];

const MILESTONES = [
  {
    year: "2014",
    title: "The Beginning",
    description:
      "AN NGUYEN was founded with the opening of our flagship hotel in the heart of Hanoi's Hoan Kiem District.",
  },
  {
    year: "2017",
    title: "Mountain Expansion",
    description:
      "Opened our Sapa Retreat, bringing the AN NGUYEN experience to the stunning mountains of northern Vietnam.",
  },
  {
    year: "2020",
    title: "Island Paradise",
    description:
      "Launched our Phu Quoc Villa, offering beachfront luxury on Vietnam's most beautiful island.",
  },
  {
    year: "2024",
    title: "Excellence Recognized",
    description:
      "Received the prestigious Vietnam Tourism Excellence Award, honoring our commitment to exceptional hospitality.",
  },
];

const VALUES = [
  {
    icon: "bi-heart",
    title: "Heartfelt Hospitality",
    description:
      "We believe every guest deserves to feel not just welcomed, but truly valued and cared for.",
  },
  {
    icon: "bi-tree",
    title: "Sustainable Luxury",
    description:
      "Committed to preserving Vietnam's natural beauty through eco-friendly practices without compromising comfort.",
  },
  {
    icon: "bi-people",
    title: "Community First",
    description:
      "Supporting local artisans, farmers, and communities to create authentic experiences for our guests.",
  },
  {
    icon: "bi-star",
    title: "Pursuit of Excellence",
    description:
      "Continuously elevating our standards to exceed expectations in every aspect of the guest experience.",
  },
];

const HeroSection = () => {
  return (
    <section className="about-hero">
      <div className="about-hero-overlay" />
      <div className="about-hero-content">
        <span className="hero-badge">★ SINCE 2014 ★</span>
        <h1 className="about-hero-title">Our Story</h1>
        <p className="about-hero-subtitle">
          A journey of passion, heritage, and exceptional hospitality
        </p>
      </div>
    </section>
  );
};

const StorySection = () => {
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation();
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation();

  return (
    <section className="section-padding story-section">
      <div className="container">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            <div
              ref={leftRef}
              className={`story-images ${leftVisible ? "animate-slide-right" : "pre-animate-left"}`}
            >
              <div className="story-img-main">
                <img
                  src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=700&q=80"
                  alt="AN NGUYEN Hotel Lobby"
                  loading="lazy"
                />
              </div>
              <div className="story-img-secondary">
                <img
                  src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=400&q=80"
                  alt="Hotel Detail"
                  loading="lazy"
                />
              </div>
              <div className="story-badge">
                <span className="badge-number">10+</span>
                <span className="badge-text">Years of Excellence</span>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div
              ref={rightRef}
              className={`story-content ${rightVisible ? "animate-slide-left" : "pre-animate-right"}`}
            >
              <span className="section-subtitle">Who We Are</span>
              <h2 className="section-title">
                Crafting <span className="text-accent">Unforgettable</span>
                <br />
                Experiences
              </h2>
              <p className="story-text">
                Born from a deep love for Vietnamese culture and a passion for
                hospitality, AN NGUYEN represents the perfect harmony between
                traditional warmth and modern luxury. What began as a single
                boutique hotel in Hanoi has blossomed into a collection of
                unique properties across Vietnam's most captivating
                destinations.
              </p>
              <p className="story-text">
                Each AN NGUYEN property tells its own story — from the elegant
                refinement of our Hanoi hotel to the mountain serenity of our
                Sapa retreat, and the tropical paradise of our Phu Quoc villa.
                Yet they all share a common thread: an unwavering commitment to
                making every guest feel like family.
              </p>
              <p className="story-text">
                Our team of dedicated professionals works tirelessly to
                anticipate your needs, crafting personalized experiences that
                transform ordinary stays into cherished memories. We don't just
                provide accommodation — we create moments that last a lifetime.
              </p>
              <div className="story-signature">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=80&q=80"
                  alt="Founder"
                />
                <div>
                  <h6>Nguyen Van An</h6>
                  <span>Founder & CEO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ValuesSection = () => {
  const { containerRef, visibleItems } = useStaggerAnimation(
    VALUES.length,
    150,
  );

  return (
    <section className="section-padding values-section">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-subtitle">Our Values</span>
          <h2 className="section-title">
            The <span className="text-accent">Principles</span> That Guide Us
          </h2>
          <p className="section-desc">
            These core values shape every decision we make and every experience
            we create
          </p>
        </div>

        <div className="row g-4" ref={containerRef}>
          {VALUES.map((value, i) => (
            <div key={i} className="col-lg-3 col-md-6">
              <div
                className={`value-card ${visibleItems.includes(i) ? "animate-fade-up" : "pre-animate"}`}
              >
                <div className="value-icon">
                  <i className={`bi ${value.icon}`}></i>
                </div>
                <h4 className="value-title">{value.title}</h4>
                <p className="value-desc">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MilestonesSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="section-padding milestones-section">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-subtitle text-white-50">Our Journey</span>
          <h2 className="section-title text-white">
            A Decade of <span className="text-accent">Excellence</span>
          </h2>
        </div>

        <div
          ref={ref}
          className={`milestones-timeline ${isVisible ? "animate-fade-up" : "pre-animate"}`}
        >
          {MILESTONES.map((milestone, i) => (
            <div key={i} className="milestone-item">
              <div className="milestone-year">{milestone.year}</div>
              <div className="milestone-content">
                <h4>{milestone.title}</h4>
                <p>{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TeamSection = () => {
  const { containerRef, visibleItems } = useStaggerAnimation(
    TEAM_MEMBERS.length,
    200,
  );

  return (
    <section className="section-padding team-section">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-subtitle">Leadership</span>
          <h2 className="section-title">
            Meet Our <span className="text-accent">Team</span>
          </h2>
          <p className="section-desc">
            The passionate individuals behind AN NGUYEN's success
          </p>
        </div>

        <div className="row g-4 justify-content-center" ref={containerRef}>
          {TEAM_MEMBERS.map((member, i) => (
            <div key={i} className="col-lg-4 col-md-6">
              <div
                className={`team-card ${visibleItems.includes(i) ? "animate-fade-up" : "pre-animate"}`}
              >
                <div className="team-image">
                  <img src={member.image} alt={member.name} loading="lazy" />
                </div>
                <div className="team-info">
                  <h4 className="team-name">{member.name}</h4>
                  <span className="team-role">{member.role}</span>
                  <p className="team-desc">{member.description}</p>
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
    <section className="about-cta-section">
      <div className="about-cta-overlay" />
      <div className="container position-relative">
        <div
          ref={ref}
          className={`about-cta-content ${isVisible ? "animate-zoom-in" : "pre-animate-scale"}`}
        >
          <h2>Experience AN NGUYEN Hospitality</h2>
          <p>
            Discover the perfect blend of Vietnamese heritage and modern luxury
          </p>
          <div className="about-cta-actions">
            <Link to="/search" className="cta-btn cta-btn-primary">
              <i className="bi bi-calendar-check me-2"></i>
              Book Your Stay
            </Link>
            <Link to="/contact" className="cta-btn cta-btn-outline">
              <i className="bi bi-envelope me-2"></i>
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      <HeroSection />
      <StorySection />
      <ValuesSection />
      <MilestonesSection />
      <TeamSection />
      <CtaSection />
    </div>
  );
};

export default AboutPage;
