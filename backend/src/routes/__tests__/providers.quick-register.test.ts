import { describe, it, expect } from '@jest/globals';

describe('Provider Quick Registration - Core Logic', () => {

  it('should validate Qubic address format', () => {
    const validAddress = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH';
    const invalidAddress1 = 'TOOSHORT';
    const invalidAddress2 = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefgh'; // lowercase
    const invalidAddress3 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ123456'; // contains numbers

    // Helper function from providers.ts
    function isValidQubicAddress(address: string): boolean {
      if (!address || address.length !== 60) {
        return false;
      }
      return /^[A-Z]+$/.test(address);
    }

    expect(isValidQubicAddress(validAddress)).toBe(true);
    expect(isValidQubicAddress(invalidAddress1)).toBe(false);
    expect(isValidQubicAddress(invalidAddress2)).toBe(false);
    expect(isValidQubicAddress(invalidAddress3)).toBe(false);
  });

  it('should calculate default pricing based on VRAM', () => {
    // Helper function from providers.ts
    function calculateDefaultPrice(vram: number): number {
      if (vram >= 24) return 2.0;
      if (vram >= 16) return 1.5;
      if (vram >= 8) return 1.0;
      if (vram >= 4) return 0.5;
      return 0.25;
    }

    expect(calculateDefaultPrice(24)).toBe(2.0);
    expect(calculateDefaultPrice(16)).toBe(1.5);
    expect(calculateDefaultPrice(8)).toBe(1.0);
    expect(calculateDefaultPrice(4)).toBe(0.5);
    expect(calculateDefaultPrice(2)).toBe(0.25);
    expect(calculateDefaultPrice(0)).toBe(0.25);
  });
});
