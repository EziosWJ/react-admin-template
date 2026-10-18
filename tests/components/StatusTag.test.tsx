import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusTag } from '../../src/components/StatusTag';
import { CUSTOMER_STATUS_OPTIONS } from '../../src/config/options';

describe('StatusTag', () => {
  it('renders the localized status label', () => {
    render(<StatusTag value="active" options={CUSTOMER_STATUS_OPTIONS} />);
    expect(screen.getByText('合作中')).toBeInTheDocument();
  });

  it('falls back to the raw value for unknown statuses', () => {
    render(<StatusTag value="archived" options={CUSTOMER_STATUS_OPTIONS} />);
    expect(screen.getByText('archived')).toBeInTheDocument();
  });
});
