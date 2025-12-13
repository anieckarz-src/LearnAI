// Scroll animation observer
// Add fade-in animations to elements when they enter viewport

export function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in-up");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all sections and feature cards
  const animatedElements = document.querySelectorAll("section, .feature-card, .stat-card");

  animatedElements.forEach((el) => {
    el.style.opacity = "0";
    observer.observe(el);
  });
}

// Initialize on DOM load
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}
