import { useState, useEffect } from 'react';

const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'password123', 'admin', '12345', 'welcome', '111111', 'p@ssword', 'login'
]);

export const usePasswordStrength = (password) => {
  const [strength, setStrength] = useState({
    score: 0,
    entropy: 0,
    label: 'Enter Password',
    color: '#94a3b8',
    width: '0%',
    checks: {
      length: false,
      upper: false,
      lower: false,
      number: false,
      symbol: false,
      common: true,
    }
  });

  useEffect(() => {
    if (!password) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStrength({
        score: 0,
        entropy: 0,
        label: 'Enter Password',
        color: '#94a3b8',
        width: '0%',
        checks: {
          length: false,
          upper: false,
          lower: false,
          number: false,
          symbol: false,
          common: true,
        }
      });
      return;
    }

    const checks = {
      length: password.length >= 12,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
      common: !COMMON_PASSWORDS.has(password.toLowerCase()),
    };

    // Entropy calculation
    let poolSize = 0;
    if (checks.lower) poolSize += 26;
    if (checks.upper) poolSize += 26;
    if (checks.number) poolSize += 10;
    if (checks.symbol) poolSize += 33;

    const entropy = poolSize > 0 ? password.length * Math.log2(poolSize) : 0;

    // Scoring
    let score = 0;
    if (checks.length) score += 2;
    if (checks.upper) score += 1;
    if (checks.lower) score += 1;
    if (checks.number) score += 1;
    if (checks.symbol) score += 1;
    if (!checks.common) score = 0;

    let label = 'Weak';
    let color = '#ff4757';
    let width = '33%';

    if (score >= 5 && entropy >= 60) {
      label = 'Strong';
      color = '#00ff88';
      width = '100%';
    } else if (score >= 3 && entropy >= 40) {
      label = 'Medium';
      color = '#ffa502';
      width = '66%';
    }

    if (!checks.common) {
      label = 'Compromised';
      color = '#ff4757';
      width = '15%';
    }

    setStrength({ score, entropy, label, color, width, checks });
  }, [password]);

  return strength;
};
