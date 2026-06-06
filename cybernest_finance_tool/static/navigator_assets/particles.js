tsParticles.load("tsparticles", {
  fullScreen: { enable: false },
  background: {
    color: {
      value: "#05080f"
    }
  },
  particles: {
    number: {
      value: 100,
      density: {
        enable: true,
        area: 800
      }
    },
    color: {
      value: "#00f0ff"
    },
    shape: {
      type: "circle"
    },
    opacity: {
      value: 0.3
    },
    size: {
      value: { min: 1, max: 3 }
    },
    move: {
      enable: true,
      speed: 1.5,
      direction: "none",
      outModes: {
        default: "bounce"
      },
      attract: {
        enable: true,
        rotateX: 600,
        rotateY: 1200
      }
    },
    links: {
      enable: true,
      distance: 120,
      color: "#00f0ff",
      opacity: 0.3,
      width: 1
    }
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "grab"
      },
      onClick: {
        enable: true,
        mode: "repulse"
      }
    },
    modes: {
      grab: {
        distance: 140,
        links: {
          opacity: 0.5
        }
      },
      repulse: {
        distance: 100,
        duration: 0.4
      }
    }
  },
  detectRetina: true
});


