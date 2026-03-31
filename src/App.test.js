import { render, screen } from '@testing-library/react';

jest.mock('react-router-dom', () => {
  const React = require('react');

  return {
    BrowserRouter: ({ children }) => <>{children}</>,
    Navigate: () => null,
    Route: ({ element }) => element,
    Routes: ({ children }) => {
      const items = React.Children.toArray(children);
      return <>{items[0] || null}</>;
    },
    Link: ({ children, to, ...rest }) => <a href={to} {...rest}>{children}</a>,
    useLocation: () => ({ pathname: '/', search: '', hash: '' }),
    useNavigate: () => () => {},
    useParams: () => ({ termId: 'dongzhi' })
  };
}, { virtual: true });

import App from './App';

test('renders the landing page title link', () => {
  render(<App />);
  expect(screen.getByLabelText(/Introduction to the 24 solar terms/i)).toBeInTheDocument();
});
