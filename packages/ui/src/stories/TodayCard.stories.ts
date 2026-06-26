import type { Meta, StoryObj } from '@storybook/vue3'
import TodayCard from '../components/TodayCard.vue'

const meta: Meta<typeof TodayCard> = {
  title: 'Components/TodayCard',
  component: TodayCard,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    () => ({ template: '<div style="max-width: 200px"><story /></div>' }),
  ],
}

export default meta
type Story = StoryObj<typeof TodayCard>

export const Generated: Story = {
  args: {
    label: 'Generated today',
    valueKwh: 18.4,
  },
}

export const Consumed: Story = {
  args: {
    label: 'Consumed today',
    valueKwh: 12.1,
  },
}

export const Imported: Story = {
  args: {
    label: 'Imported today',
    valueKwh: 0.8,
  },
}

export const Exported: Story = {
  args: {
    label: 'Exported today',
    valueKwh: 6.3,
  },
}

export const Zero: Story = {
  args: {
    label: 'Generated today',
    valueKwh: 0,
  },
}

export const Loading: Story = {
  args: {
    label: 'Generated today',
    valueKwh: 0,
    isLoading: true,
  },
}

export const Unavailable: Story = {
  args: {
    label: 'Generated today',
    valueKwh: null,
  },
}
