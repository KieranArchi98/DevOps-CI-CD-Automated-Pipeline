import { render, screen } from '@testing-library/react';
import Page from '../app/page';

describe('Main Page', () => {
  it('renders correctly', () => {
    // We render the page and check for some identifying text
    // Since page.tsx is complex, we check for a key UI element or text
    render(<Page />);

    // Most apps have some heading or generic text
    // Adjusting based on common elements
    const element = screen.getByRole('main');
    expect(element).toBeInTheDocument();
  });

  it('validates input exists', () => {
    render(<Page />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });
});
