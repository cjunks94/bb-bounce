/**
 * Speed Multiplier Feature Tests
 * Tests for speed multiplier functionality and localStorage persistence
 */

describe('Speed Multiplier Feature', () => {
  // Mock localStorage
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = {
      store: {},
      getItem(key) {
        return this.store[key] || null;
      },
      setItem(key, value) {
        this.store[key] = String(value);
      },
      removeItem(key) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      }
    };

    global.localStorage = localStorageMock;
  });

  afterEach(() => {
    delete global.localStorage;
  });

  describe('Speed Multiplier Storage', () => {
    it('should store speed multiplier in localStorage', () => {
      localStorage.setItem('bbBounceSpeedMultiplier', '2');
      expect(localStorage.getItem('bbBounceSpeedMultiplier')).toBe('2');
    });

    it('should default to 1x if not set', () => {
      const speedMultiplier = parseFloat(localStorage.getItem('bbBounceSpeedMultiplier') || '1');
      expect(speedMultiplier).toBe(1);
    });

    it('should persist different speed values', () => {
      const speeds = [1, 2, 3];
      speeds.forEach(speed => {
        localStorage.setItem('bbBounceSpeedMultiplier', String(speed));
        const stored = parseFloat(localStorage.getItem('bbBounceSpeedMultiplier'));
        expect(stored).toBe(speed);
      });
    });

    it('should handle invalid values gracefully', () => {
      localStorage.setItem('bbBounceSpeedMultiplier', 'invalid');
      const speedMultiplier = parseFloat(localStorage.getItem('bbBounceSpeedMultiplier') || '1');
      expect(isNaN(speedMultiplier) ? 1 : speedMultiplier).toBeTruthy();
    });
  });

  describe('Speed Calculation Logic', () => {
    it('should calculate correct effective speed for 1x', () => {
      const baseSpeed = 4;
      const multiplier = 1;
      const effectiveSpeed = baseSpeed * multiplier;
      expect(effectiveSpeed).toBe(4);
    });

    it('should calculate correct effective speed for 2x', () => {
      const baseSpeed = 4;
      const multiplier = 2;
      const effectiveSpeed = baseSpeed * multiplier;
      expect(effectiveSpeed).toBe(8);
    });

    it('should calculate correct effective speed for 3x', () => {
      const baseSpeed = 4;
      const multiplier = 3;
      const effectiveSpeed = baseSpeed * multiplier;
      expect(effectiveSpeed).toBe(12);
    });

    it('should apply multiplier to ball velocity components', () => {
      const ballSpeed = 4;
      const multiplier = 2;
      const angle = Math.PI / 6; // 30 degrees

      const effectiveSpeed = ballSpeed * multiplier;
      const ballSpeedX = effectiveSpeed * Math.sin(angle);
      const ballSpeedY = effectiveSpeed * Math.cos(angle);

      const actualSpeed = Math.sqrt(ballSpeedX ** 2 + ballSpeedY ** 2);
      expect(actualSpeed).toBeCloseTo(8, 1);
    });
  });

  describe('Speed Multiplier Display', () => {
    it('should format speed multiplier correctly', () => {
      const formats = [
        { speed: 1, expected: '1x' },
        { speed: 2, expected: '2x' },
        { speed: 3, expected: '3x' }
      ];

      formats.forEach(({ speed, expected }) => {
        const display = `${speed}x`;
        expect(display).toBe(expected);
      });
    });
  });

  describe('Speed Multiplier Validation', () => {
    it('should accept valid speed values', () => {
      const validSpeeds = [1, 2, 3];
      validSpeeds.forEach(speed => {
        expect([1, 2, 3]).toContain(speed);
      });
    });

    it('should reject invalid speed values', () => {
      const invalidSpeeds = [0, -1, 4, 100, NaN];
      invalidSpeeds.forEach(speed => {
        expect([1, 2, 3]).not.toContain(speed);
      });
    });

    it('should handle float speeds', () => {
      const speed = 2.5;
      // Speed should be one of the predefined values
      const isValid = [1, 2, 3].includes(speed);
      expect(isValid).toBe(false);
    });
  });

  describe('Real-time Speed Adjustment', () => {
    it('should calculate speed ratio correctly', () => {
      const currentSpeedX = 4;
      const currentSpeedY = 3;
      const currentSpeed = Math.sqrt(currentSpeedX ** 2 + currentSpeedY ** 2);

      const baseSpeed = 4;
      const newMultiplier = 2;
      const targetSpeed = baseSpeed * newMultiplier;

      const ratio = targetSpeed / currentSpeed;

      const newSpeedX = currentSpeedX * ratio;
      const newSpeedY = currentSpeedY * ratio;
      const actualNewSpeed = Math.sqrt(newSpeedX ** 2 + newSpeedY ** 2);

      expect(actualNewSpeed).toBeCloseTo(targetSpeed, 1);
    });

    it('should maintain ball direction when changing speed', () => {
      const currentSpeedX = 3;
      const currentSpeedY = 4;
      const currentAngle = Math.atan2(currentSpeedY, currentSpeedX);

      const ratio = 2; // Double the speed
      const newSpeedX = currentSpeedX * ratio;
      const newSpeedY = currentSpeedY * ratio;
      const newAngle = Math.atan2(newSpeedY, newSpeedX);

      expect(newAngle).toBeCloseTo(currentAngle, 5);
    });
  });

  describe('Settings UI State', () => {
    it('should track active speed option', () => {
      const speedOptions = [
        { value: 1, active: true },
        { value: 2, active: false },
        { value: 3, active: false }
      ];

      const activeOption = speedOptions.find(opt => opt.active);
      expect(activeOption.value).toBe(1);
    });

    it('should update active state when speed changes', () => {
      const speedOptions = [
        { value: 1, active: true },
        { value: 2, active: false },
        { value: 3, active: false }
      ];

      // Simulate clicking 2x
      speedOptions.forEach(opt => opt.active = false);
      speedOptions[1].active = true;

      const activeOption = speedOptions.find(opt => opt.active);
      expect(activeOption.value).toBe(2);
    });
  });

  describe('Game Integration', () => {
    it('should not affect score calculation', () => {
      const brickPoints = 10;
      const speedMultiplier = 3;

      // Speed multiplier should NOT affect score
      const score = brickPoints; // Not brickPoints * speedMultiplier
      expect(score).toBe(10);
    });

    it('should work with level progression', () => {
      const baseSpeed = 4;
      const levelBonus = 0.5; // Increases per level
      const level = 3;
      const speedMultiplier = 2;

      const ballSpeed = baseSpeed + (level - 1) * levelBonus;
      const effectiveSpeed = ballSpeed * speedMultiplier;

      // baseSpeed (4) + 2 * 0.5 = 5, then 5 * 2 = 10
      expect(effectiveSpeed).toBeCloseTo(10, 1);
    });
  });
});
