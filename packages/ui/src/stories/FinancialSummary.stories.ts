import type { Meta, StoryObj } from '@storybook/vue3'
import FinancialSummary from '../components/FinancialSummary.vue'

const meta: Meta<typeof FinancialSummary> = {
  title: 'Components/FinancialSummary',
  component: FinancialSummary,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    () => ({ template: '<div style="max-width: 400px"><story /></div>' }),
  ],
}

export default meta
type Story = StoryObj<typeof FinancialSummary>

export const GoodSolarDay: Story = {
  args: {
    savedAmount: 2.40,
    earnedAmount: 1.89,
    currency: 'GBP',
  },
}

export const NoExport: Story = {
  name: 'No export earnings',
  args: {
    savedAmount: 1.20,
    earnedAmount: 0,
    currency: 'GBP',
  },
}

export const MinimalSolar: Story = {
  name: 'Minimal solar day',
  args: {
    savedAmount: 0.15,
    earnedAmount: 0,
    currency: 'GBP',
  },
}

export const Loading: Story = {
  args: {
    savedAmount: 0,
    earnedAmount: 0,
    currency: 'GBP',
    isLoading: true,
  },
}

export const Unavailable: Story = {
  name: 'No tariff configured',
  args: {
    savedAmount: null,
    earnedAmount: null,
    currency: 'GBP',
  },
}
