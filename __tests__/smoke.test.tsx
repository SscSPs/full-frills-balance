
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

describe('Smoke Test', () => {
    it('renders correctly', () => {
        const { getByText } = render(<Text>Hello World</Text>);
        expect(getByText('Hello World')).toBeTruthy();
    });

    it('runs basic math', () => {
        expect(1 + 1).toBe(2);
    });
});
