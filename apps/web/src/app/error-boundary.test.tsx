import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithI18n } from '../test/render';
import { ErrorBoundary, ErrorPage } from './error-boundary';

const fault = { active: true };

function Bomb() {
  if (fault.active) {
    throw new Error('boom');
  }
  return <p>All good</p>;
}

const renderBoundary = (onError = vi.fn()) =>
  renderWithI18n(
    <ErrorBoundary onError={onError} fallback={(retry) => <ErrorPage onRetry={retry} />}>
      <Bomb />
    </ErrorBoundary>,
  );

beforeEach(() => {
  fault.active = true;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('APP-10 shows the fallback when a child throws', () => {
    renderBoundary();
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByText('All good')).not.toBeInTheDocument();
  });

  it('APP-11 renders the child again after the fault is fixed and Try again is pressed', async () => {
    renderBoundary();
    fault.active = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('All good')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('APP-11 keeps the fallback when the fault is still there', async () => {
    renderBoundary();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('APP-12 reports the error with its component stack', () => {
    const onError = vi.fn();
    renderBoundary(onError);
    expect(onError).toHaveBeenCalledTimes(1);
    const [error, info] = onError.mock.calls[0] as [Error, { componentStack: string }];
    expect(error.message).toBe('boom');
    expect(info.componentStack).toContain('Bomb');
  });

  it('APP-12 works without a reporter', () => {
    renderWithI18n(
      <ErrorBoundary fallback={() => <p>Fallback</p>}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });

  it('APP-10 renders children untouched when nothing throws', () => {
    fault.active = false;
    renderBoundary();
    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});

describe('ErrorPage', () => {
  it('APP-10 is announced and localized', () => {
    renderWithI18n(<ErrorPage onRetry={() => undefined} />, 'ar');
    expect(screen.getByRole('alert')).toHaveTextContent('حدث خطأ ما');
  });
});
