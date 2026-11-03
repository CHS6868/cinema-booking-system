import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SeatMap from '../SeatMap.vue';

const seats = [
  { id: 'A1', status: 'available' },
  { id: 'A2', status: 'booked' },
  { id: 'B1', status: 'available' },
];
const seatButton = (wrapper, id) => wrapper.findAll('button.seat').find(button => button.text() === id);

describe('SeatMap', () => {
  it('renders seats and disables already booked ones', () => {
    const wrapper = mount(SeatMap, {props:{seats,selectedSeats:[]}});
    expect(wrapper.findAll('button.seat')).toHaveLength(3);
    expect(seatButton(wrapper,'A2').attributes('disabled')).toBeDefined();
    expect(seatButton(wrapper,'A1').attributes('disabled')).toBeUndefined();
  });
  it('emits the chosen seat when an available seat is clicked', async () => {
    const wrapper = mount(SeatMap, {props:{seats,selectedSeats:[]}});
    await seatButton(wrapper,'A1').trigger('click');
    expect(wrapper.emitted('toggle')?.[0]?.[0]).toEqual(seats[0]);
  });
  it('enforces the maximum while allowing deselection', () => {
    const wrapper = mount(SeatMap, {props:{seats,selectedSeats:['A1'],maxSeats:1}});
    expect(seatButton(wrapper,'B1').attributes('disabled')).toBeDefined();
    expect(seatButton(wrapper,'A1').attributes('disabled')).toBeUndefined();
    expect(seatButton(wrapper,'A1').attributes('aria-pressed')).toBe('true');
  });
  it('disables all seats while the page is submitting', () => {
    const wrapper = mount(SeatMap, {props:{seats,selectedSeats:[],disabled:true}});
    expect(wrapper.findAll('button.seat').every(b => b.attributes('disabled') !== undefined)).toBe(true);
  });
});
