/**
 * Jarvis Holographic Visualization
 * MCU-inspired rotating particle sphere with orbital rings
 * Canvas 2D with 3D projection math
 */

class JarvisVisualization {
  constructor(canvasId) {
    // Canvas setup
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    // Animation state
    this.rotation = { x: 0, y: 0, z: 0 };
    this.rotationSpeed = { x: 0.002, y: 0.005, z: 0.003 };
    this.activityLevel = 0; // 0-1, affects pulse/speed

    // Particle system (1000 particles in spherical distribution)
    this.particles = [];
    this.particleCount = 1000;
    this.initParticles();

    // Orbital rings (3 rings at different angles/speeds)
    this.rings = [
      { radius: 120, tilt: 0, speed: 0.01, thickness: 2 },
      { radius: 140, tilt: Math.PI / 3, speed: -0.008, thickness: 1.5 },
      { radius: 160, tilt: Math.PI / 2, speed: 0.012, thickness: 1 }
    ];

    // MCU colors
    this.colors = {
      core: '#ff6b35',      // Orange core
      particles: '#00d9ff', // Cyan particles
      rings: '#00ffff',     // Bright cyan rings
      glow: 'rgba(255, 107, 53, 0.8)'
    };

    // Initialize size
    this.resize();

    // Start animation
    this.start();
  }

  /**
   * Initialize particles in spherical distribution
   * Uses spherical coordinates (theta, phi, radius)
   */
  initParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      // Spherical coordinates for even distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const radius = 80 + (Math.random() * 20); // 80-100 radius

      this.particles.push({
        theta,
        phi,
        radius,
        x: 0,
        y: 0,
        z: 0,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * Project 3D coordinates to 2D screen space
   * Uses perspective projection
   */
  project3D(x, y, z) {
    const perspective = 400;
    const scale = perspective / (perspective + z);
    return {
      x: x * scale + this.width / 2,
      y: y * scale + this.height / 2,
      scale: scale
    };
  }

  /**
   * Apply 3D rotation to a point
   * Rotation order: X -> Y -> Z
   */
  rotate3D(x, y, z, rx, ry, rz) {
    // X-axis rotation
    let y1 = y * Math.cos(rx) - z * Math.sin(rx);
    let z1 = y * Math.sin(rx) + z * Math.cos(rx);

    // Y-axis rotation
    let x1 = x * Math.cos(ry) + z1 * Math.sin(ry);
    let z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);

    // Z-axis rotation
    let x2 = x1 * Math.cos(rz) - y1 * Math.sin(rz);
    let y2 = x1 * Math.sin(rz) + y1 * Math.cos(rz);

    return { x: x2, y: y2, z: z2 };
  }

  /**
   * Update particle positions and rotation
   */
  updateParticles() {
    const time = Date.now() * 0.001;

    this.particles.forEach(p => {
      // Convert spherical to cartesian coordinates
      const x = p.radius * Math.sin(p.phi) * Math.cos(p.theta);
      const y = p.radius * Math.sin(p.phi) * Math.sin(p.theta);
      const z = p.radius * Math.cos(p.phi);

      // Apply rotation
      const rotated = this.rotate3D(x, y, z,
        this.rotation.x, this.rotation.y, this.rotation.z);

      p.x = rotated.x;
      p.y = rotated.y;
      p.z = rotated.z;

      // Pulse effect (breathing animation)
      p.opacity = 0.3 + Math.sin(time + p.pulseOffset) * 0.2 +
                  (this.activityLevel * 0.5);
    });

    // Update rotation (speeds up with activity)
    this.rotation.x += this.rotationSpeed.x * (1 + this.activityLevel);
    this.rotation.y += this.rotationSpeed.y * (1 + this.activityLevel);
    this.rotation.z += this.rotationSpeed.z * (1 + this.activityLevel);
  }

  /**
   * Draw all particles with depth sorting
   */
  drawParticles() {
    // Sort by z-depth for proper layering (painter's algorithm)
    const sorted = [...this.particles].sort((a, b) => a.z - b.z);

    sorted.forEach(p => {
      const projected = this.project3D(p.x, p.y, p.z);

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(projected.x, projected.y,
        p.size * projected.scale, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 217, 255, ${p.opacity * projected.scale})`;
      this.ctx.shadowBlur = 0;
      this.ctx.fill();

      // Glow effect for closer particles
      if (p.z > -50 && projected.scale > 0.8) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.colors.particles;
        this.ctx.beginPath();
        this.ctx.arc(projected.x, projected.y,
          p.size * projected.scale * 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(0, 217, 255, ${p.opacity * projected.scale * 0.3})`;
        this.ctx.fill();
      }
    });

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  /**
   * Draw orbital rings
   */
  drawRings() {
    this.rings.forEach(ring => {
      this.ctx.strokeStyle = `rgba(0, 255, 255, 0.6)`;
      this.ctx.lineWidth = ring.thickness;
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = this.colors.rings;

      this.ctx.beginPath();
      let firstPoint = null;

      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const x = ring.radius * Math.cos(angle);
        const y = ring.radius * Math.sin(angle) * Math.cos(ring.tilt);
        const z = ring.radius * Math.sin(angle) * Math.sin(ring.tilt);

        const rotated = this.rotate3D(x, y, z,
          this.rotation.x, this.rotation.y, this.rotation.z);
        const proj = this.project3D(rotated.x, rotated.y, rotated.z);

        if (angle === 0) {
          firstPoint = proj;
          this.ctx.moveTo(proj.x, proj.y);
        } else {
          this.ctx.lineTo(proj.x, proj.y);
        }
      }

      // Close the ring
      if (firstPoint) {
        this.ctx.lineTo(firstPoint.x, firstPoint.y);
      }

      this.ctx.stroke();

      // Rotate ring for animation
      ring.tilt += ring.speed;
    });

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  /**
   * Draw central glowing core
   */
  drawCore() {
    const coreSize = 40 + (this.activityLevel * 20);

    // Outer glow
    const outerGradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, coreSize * 2
    );
    outerGradient.addColorStop(0, 'rgba(255, 107, 53, 0.8)');
    outerGradient.addColorStop(0.3, 'rgba(255, 107, 53, 0.4)');
    outerGradient.addColorStop(1, 'rgba(255, 107, 53, 0)');

    this.ctx.fillStyle = outerGradient;
    this.ctx.beginPath();
    this.ctx.arc(this.width / 2, this.height / 2,
      coreSize * 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner core
    const coreGradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, coreSize
    );
    coreGradient.addColorStop(0, 'rgba(255, 107, 53, 1)');
    coreGradient.addColorStop(0.5, 'rgba(255, 107, 53, 0.6)');
    coreGradient.addColorStop(1, 'rgba(255, 107, 53, 0)');

    this.ctx.fillStyle = coreGradient;
    this.ctx.beginPath();
    this.ctx.arc(this.width / 2, this.height / 2,
      coreSize, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * Main render loop
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update particle positions and rotation
    this.updateParticles();

    // Draw in order (back to front for depth)
    this.drawCore();
    this.drawParticles();
    this.drawRings();

    // Request next frame
    requestAnimationFrame(() => this.render());
  }

  /**
   * Start the animation loop
   */
  start() {
    this.render();
  }

  /**
   * Set activity level (0-1)
   * Higher values = faster rotation, brighter glow
   */
  setActivityLevel(level) {
    this.activityLevel = Math.max(0, Math.min(1, level));
  }

  /**
   * Trigger when voice is active
   */
  onVoiceActive() {
    this.setActivityLevel(1);
    setTimeout(() => this.setActivityLevel(0), 2000);
  }

  /**
   * Trigger when processing/thinking
   */
  onProcessing() {
    this.setActivityLevel(0.7);
  }

  /**
   * Trigger when idle
   */
  onIdle() {
    this.setActivityLevel(0);
  }

  /**
   * Resize canvas to match container
   */
  resize() {
    const container = this.canvas.parentElement;
    if (!container) return;

    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
}

// Make available globally
window.JarvisVisualization = JarvisVisualization;
