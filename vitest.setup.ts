import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('heic2any', () => ({
    default: vi.fn(),
}));
