import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BookingSummary from '../BookingSummary.vue';

describe('BookingSummary', () => {
  it('disables confirmation when no seats are selected', () => {
    const wrapper = mount(BookingSummary, {props:{ selectedSeats:[], price:18 }});
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('RM 0.00');
  });
  it('shows the correct ticket count and total', () => {
    const wrapper = mount(BookingSummary, {props:{ selectedSeats:['A1','A2'], price:18 }});
    expect(wrapper.text()).toContain('A1, A2');
    expect(wrapper.text()).toContain('RM 36.00');
    expect(wrapper.text()).toContain('2');
  });
  it('emits confirm when a valid booking is clicked', async () => {
    const wrapper = mount(BookingSummary, {props:{ selectedSeats:['A1'], price:18 }});
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });
  it('disables confirmation during submission', () => {
    const wrapper = mount(BookingSummary, {props:{ selectedSeats:['A1'], price:18, submitting:true }});
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Processing');
  });
});
