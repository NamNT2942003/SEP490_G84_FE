import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  useScrollAnimation,
  useStaggerAnimation,
} from "../../../hooks/useScrollAnimation";
import "./ContactPage.css";

const BRANCHES_CONTACT = [
  {
    id: 1,
    name: "AN NGUYEN Hanoi Hotel",
    type: "Luxury Hotel",
    address: "123 Hoan Kiem District, Hanoi, Vietnam",
    phone: "+84 24-3826-1234",
    email: "hanoi@annguyen.com",
    hours: "24/7 Reception",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.8609!2d105.8542!3d21.0285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDAyJzAwLjAiTiAxMDXCsDUxJzAwLjAiRQ!5e0!3m2!1sen!2s!4v1234567890",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    name: "AN NGUYEN Sapa Retreat",
    type: "Mountain Homestay",
    address: "456 Muong Hoa Valley, Sapa, Lao Cai, Vietnam",
    phone: "+84 21-4872-5678",
    email: "sapa@annguyen.com",
    hours: "06:00 - 22:00",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.5!2d103.8440!3d22.3363!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDIwJzExLjAiTiAxMDPCsDUwJzM4LjQiRQ!5e0!3m2!1sen!2s",
    image:
      "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    name: "AN NGUYEN Phu Quoc Villa",
    type: "Beachfront Homestay",
    address: "789 Long Beach Road, Phu Quoc Island, Kien Giang, Vietnam",
    phone: "+84 29-7391-9012",
    email: "phuquoc@annguyen.com",
    hours: "24/7 Reception",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.5!2d103.9596!3d10.2899!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDE3JzI0LjAiTiAxMDPCsDU3JzM0LjYiRQ!5e0!3m2!1sen!2s",
    image:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=600&q=80",
  },
];

const FAQS = [
  {
    question: "What is the check-in and check-out time?",
    answer:
      "Standard check-in time is 2:00 PM and check-out time is 12:00 PM. Early check-in and late check-out can be arranged subject to availability. Please contact us in advance to request these services.",
  },
  {
    question: "Do you offer airport pickup services?",
    answer:
      "Yes, we provide complimentary airport transfer services for guests staying at our Hanoi Hotel. For Sapa and Phu Quoc properties, pickup services are available at an additional charge. Please book at least 24 hours in advance.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "Free cancellation is available up to 48 hours before check-in for most room types. Some promotional rates may have different cancellation policies. Please check the specific terms when booking.",
  },
  {
    question: "Are pets allowed at your properties?",
    answer:
      "Our Sapa Retreat and Phu Quoc Villa welcome small pets with prior arrangement. The Hanoi Hotel is not pet-friendly. Please contact us before booking if you plan to bring a pet.",
  },
  {
    question: "Do you have facilities for guests with disabilities?",
    answer:
      "All our properties have accessible rooms and facilities for guests with disabilities. Please inform us of any specific requirements when booking so we can ensure the best possible experience.",
  },
];

const HeroSection = () => {
  return (
    <section className="contact-hero">
      <div className="contact-hero-overlay" />
      <div className="contact-hero-content">
        <span className="hero-badge">★ GET IN TOUCH ★</span>
        <h1 className="contact-hero-title">Contact Us</h1>
        <p className="contact-hero-subtitle">
          We're here to help make your stay unforgettable
        </p>
      </div>
    </section>
  );
};

const ContactFormSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    property: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        property: "",
        message: "",
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 1500);
  };

  return (
    <section className="section-padding contact-form-section">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-5">
            <div className="contact-info">
              <span className="section-subtitle">Reach Out</span>
              <h2 className="section-title">
                Let's Start a <span className="text-accent">Conversation</span>
              </h2>
              <p className="contact-intro">
                Whether you have a question about our services, need assistance
                with a booking, or simply want to share feedback, we'd love to
                hear from you. Our team is dedicated to providing prompt and
                helpful responses.
              </p>

              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">
                    <i className="bi bi-envelope"></i>
                  </div>
                  <div className="method-details">
                    <h6>Email Us</h6>
                    <p>info@annguyen.com</p>
                    <span>Response within 24 hours</span>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">
                    <i className="bi bi-telephone"></i>
                  </div>
                  <div className="method-details">
                    <h6>Call Us</h6>
                    <p>+84 24-3826-1234</p>
                    <span>Available 24/7</span>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">
                    <i className="bi bi-chat-dots"></i>
                  </div>
                  <div className="method-details">
                    <h6>Live Chat</h6>
                    <p>Chat with our team</p>
                    <span>Mon-Fri: 8AM - 10PM</span>
                  </div>
                </div>
              </div>

              <div className="social-links">
                <h6>Follow Us</h6>
                <div className="social-icons">
                  <a href="#" className="social-icon" aria-label="Facebook">
                    <i className="bi bi-facebook"></i>
                  </a>
                  <a href="#" className="social-icon" aria-label="Instagram">
                    <i className="bi bi-instagram"></i>
                  </a>
                  <a href="#" className="social-icon" aria-label="Twitter">
                    <i className="bi bi-twitter-x"></i>
                  </a>
                  <a href="#" className="social-icon" aria-label="LinkedIn">
                    <i className="bi bi-linkedin"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div
              ref={ref}
              className={`contact-form-wrapper ${isVisible ? "animate-slide-left" : "pre-animate-right"}`}
            >
              <h3 className="form-title">Send Us a Message</h3>

              {submitStatus === "success" && (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle me-2"></i>
                  Thank you! Your message has been sent successfully. We'll get
                  back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+84 xxx xxx xxxx"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="property">Property of Interest</label>
                      <select
                        id="property"
                        name="property"
                        value={formData.property}
                        onChange={handleChange}
                      >
                        <option value="">Select a property</option>
                        <option value="hanoi">AN NGUYEN Hanoi Hotel</option>
                        <option value="sapa">AN NGUYEN Sapa Retreat</option>
                        <option value="phuquoc">
                          AN NGUYEN Phu Quoc Villa
                        </option>
                        <option value="general">General Inquiry</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group">
                      <label htmlFor="subject">Subject *</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="How can we help you?"
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group">
                      <label htmlFor="message">Message *</label>
                      <textarea
                        id="message"
                        name="message"
                        rows="5"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="Please share the details of your inquiry..."
                      ></textarea>
                    </div>
                  </div>
                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <i className="bi bi-send ms-2"></i>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LocationsSection = () => {
  const [activeLocation, setActiveLocation] = useState(0);
  const { containerRef, visibleItems } = useStaggerAnimation(
    BRANCHES_CONTACT.length,
    200,
  );

  return (
    <section className="section-padding locations-section">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-subtitle">Our Locations</span>
          <h2 className="section-title">
            Find Us <span className="text-accent">Across Vietnam</span>
          </h2>
          <p className="section-desc">
            Three unique destinations, one exceptional experience
          </p>
        </div>

        <div className="row g-4" ref={containerRef}>
          {BRANCHES_CONTACT.map((branch, i) => (
            <div key={branch.id} className="col-lg-4 col-md-6">
              <div
                className={`location-card ${activeLocation === i ? "active" : ""} ${
                  visibleItems.includes(i) ? "animate-fade-up" : "pre-animate"
                }`}
                onClick={() => setActiveLocation(i)}
              >
                <div className="location-image">
                  <img src={branch.image} alt={branch.name} loading="lazy" />
                  <span className="location-type">{branch.type}</span>
                </div>
                <div className="location-info">
                  <h4 className="location-name">{branch.name}</h4>
                  <ul className="location-details">
                    <li>
                      <i className="bi bi-geo-alt"></i>
                      <span>{branch.address}</span>
                    </li>
                    <li>
                      <i className="bi bi-telephone"></i>
                      <span>{branch.phone}</span>
                    </li>
                    <li>
                      <i className="bi bi-envelope"></i>
                      <span>{branch.email}</span>
                    </li>
                    <li>
                      <i className="bi bi-clock"></i>
                      <span>{branch.hours}</span>
                    </li>
                  </ul>
                  <div className="location-actions">
                    <a
                      href={`mailto:${branch.email}`}
                      className="btn-location-action"
                    >
                      <i className="bi bi-envelope me-2"></i>
                      Email
                    </a>
                    <a
                      href={`tel:${branch.phone.replace(/[^+\d]/g, "")}`}
                      className="btn-location-action primary"
                    >
                      <i className="bi bi-telephone me-2"></i>
                      Call
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="map-container">
          <iframe
            src={BRANCHES_CONTACT[activeLocation].mapEmbed}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map of ${BRANCHES_CONTACT[activeLocation].name}`}
          ></iframe>
        </div>
      </div>
    </section>
  );
};

const FaqSection = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const { ref, isVisible } = useScrollAnimation();

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="section-padding faq-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="text-center mb-5">
              <span className="section-subtitle">FAQ</span>
              <h2 className="section-title">
                Frequently Asked <span className="text-accent">Questions</span>
              </h2>
              <p className="section-desc">
                Find quick answers to common questions about our services
              </p>
            </div>

            <div
              ref={ref}
              className={`faq-list ${isVisible ? "animate-fade-up" : "pre-animate"}`}
            >
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className={`faq-item ${openFaq === i ? "open" : ""}`}
                >
                  <button className="faq-question" onClick={() => toggleFaq(i)}>
                    <span>{faq.question}</span>
                    <i
                      className={`bi ${openFaq === i ? "bi-dash" : "bi-plus"}`}
                    ></i>
                  </button>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="faq-footer">
              <p>
                Can't find what you're looking for?{" "}
                <a href="#contact-form">Send us a message</a> and we'll be happy
                to help.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CtaSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="contact-cta-section">
      <div className="contact-cta-overlay" />
      <div className="container position-relative">
        <div
          ref={ref}
          className={`contact-cta-content ${isVisible ? "animate-zoom-in" : "pre-animate-scale"}`}
        >
          <h2>Ready to Experience AN NGUYEN?</h2>
          <p>
            Book your stay today and discover the art of Vietnamese hospitality
          </p>
          <Link to="/search" className="cta-btn cta-btn-primary">
            <i className="bi bi-calendar-check me-2"></i>
            Book Now
          </Link>
        </div>
      </div>
    </section>
  );
};

const ContactPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="contact-page">
      <HeroSection />
      <ContactFormSection />
      <LocationsSection />
      <FaqSection />
      <CtaSection />
    </div>
  );
};

export default ContactPage;
