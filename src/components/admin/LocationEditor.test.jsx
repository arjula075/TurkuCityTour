import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LocationEditor from './LocationEditor.jsx';

const locations = [
    {
        id: 'loc-1',
        name: 'Turku Cathedral',
        description: 'Historic church',
        latitude: 60.452324,
        longitude: 22.27824,
    },
    {
        id: 'loc-2',
        name: 'Market Square',
        description: '',
        latitude: 60.451,
        longitude: 22.266,
    },
];

describe('LocationEditor', () => {
    it('renders location names in the accordion list', () => {
        render(
            <LocationEditor
                locations={locations}
                setLocations={vi.fn()}
                onDelete={vi.fn()}
                onReorder={vi.fn()}
                updateLocationField={vi.fn()}
                onSetCoordinates={vi.fn()}
            />
        );

        expect(screen.getByText('Turku Cathedral')).toBeInTheDocument();
        expect(screen.getByText('Market Square')).toBeInTheDocument();
    });

    it('expands a location and edits the name field', () => {
        const updateLocationField = vi.fn();

        render(
            <LocationEditor
                locations={locations}
                setLocations={vi.fn()}
                onDelete={vi.fn()}
                onReorder={vi.fn()}
                updateLocationField={updateLocationField}
                onSetCoordinates={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('Turku Cathedral'));
        const nameInput = screen.getByLabelText('Location Name:');
        fireEvent.change(nameInput, { target: { value: 'Cathedral updated' } });

        expect(updateLocationField).toHaveBeenCalledWith(
            'loc-1',
            'name',
            'Cathedral updated'
        );
    });

    it('calls onDelete when delete is clicked', () => {
        const onDelete = vi.fn();

        render(
            <LocationEditor
                locations={[locations[0]]}
                setLocations={vi.fn()}
                onDelete={onDelete}
                onReorder={vi.fn()}
                updateLocationField={vi.fn()}
                onSetCoordinates={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('Turku Cathedral'));
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onDelete).toHaveBeenCalledWith('loc-1');
    });

    it('calls onAddLocation from the add button', () => {
        const onAddLocation = vi.fn();

        render(
            <LocationEditor
                locations={locations}
                setLocations={vi.fn()}
                onDelete={vi.fn()}
                onReorder={vi.fn()}
                updateLocationField={vi.fn()}
                onSetCoordinates={vi.fn()}
                onAddLocation={onAddLocation}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Add Location' }));
        expect(onAddLocation).toHaveBeenCalled();
    });
});
