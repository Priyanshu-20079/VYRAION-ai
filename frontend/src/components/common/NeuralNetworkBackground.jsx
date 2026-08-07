import React, { useEffect, useRef } from 'react';

export default function NeuralNetworkBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    let mouse = { x: -1000, y: -1000, radius: 140 };

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Palette: Cyan (#33C8FF), Purple (#7C5CFF), Blue (#3B82F6), Emerald (#22C55E), Amber (#F59E0B)
    const colors = ['#33C8FF', '#7C5CFF', '#3B82F6', '#22C55E', '#F59E0B'];

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 32 : 85;
    const maxConnectionDistance = isMobile ? 90 : 130;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle Node Constructor
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
        this.radius = Math.random() * 2 + 1.2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.5 + 0.3;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.angle = Math.random() * Math.PI * 2;
      }

      update() {
        if (prefersReducedMotion) return;

        this.x += this.vx;
        this.y += this.vy;

        // Bounce at boundaries
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Gentle pulse alpha
        this.angle += this.pulseSpeed;
        this.alpha = 0.35 + Math.sin(this.angle) * 0.25;

        // Mouse repulsion effect
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 2.5;
          this.y -= Math.sin(angle) * force * 2.5;
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }
    }

    // Initialize particles
    particles = Array.from({ length: particleCount }, () => new Particle());

    // Mouse Move Listener
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Draw Radial Soft Nebulas behind main command sections
    const drawRadialGlows = () => {
      // Glow 1: Top-Left Cyan Glow
      const grad1 = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.2, 10,
        canvas.width * 0.2, canvas.height * 0.2, 400
      );
      grad1.addColorStop(0, 'rgba(51, 200, 255, 0.04)');
      grad1.addColorStop(1, 'rgba(6, 11, 21, 0)');

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Glow 2: Center-Right Purple Glow
      const grad2 = ctx.createRadialGradient(
        canvas.width * 0.75, canvas.height * 0.45, 10,
        canvas.width * 0.75, canvas.height * 0.45, 500
      );
      grad2.addColorStop(0, 'rgba(124, 92, 255, 0.05)');
      grad2.addColorStop(1, 'rgba(6, 11, 21, 0)');

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Main 60 FPS Render Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Soft background radial glows
      drawRadialGlows();

      // Connect nearby particles with neural telemetry lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxConnectionDistance) {
            const lineAlpha = (1 - dist / maxConnectionDistance) * 0.22;
            ctx.save();
            ctx.globalAlpha = lineAlpha;
            ctx.strokeStyle = particles[i].color;
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Update & draw particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      if (!document.hidden && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    // Pause when tab is inactive to preserve GPU/battery
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        render();
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#060B15]"
    />
  );
}
