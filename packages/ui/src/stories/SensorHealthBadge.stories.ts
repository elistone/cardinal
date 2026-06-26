import type { Meta, StoryObj } from '@storybook/vue3'
import SensorHealthBadge from '../components/SensorHealthBadge.vue'

const meta: Meta<typeof SensorHealthBadge> = {
  title: 'Components/SensorHealthBadge',
  component: SensorHealthBadge,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    status: { control: 'select', options: ['configured', 'missing', 'unavailable', 'invalid'] },
  },
}

export default meta
type Story = StoryObj<typeof SensorHealthBadge>

export const Configured: Story = {
  args: {
    status: 'configured',
    label: 'Solar power',
    entityId: 'sensor.pv_power',
  },
}

export const Missing: Story = {
  args: {
    status: 'missing',
    label: 'Solar power',
  },
}

export const Unavailable: Story = {
  args: {
    status: 'unavailable',
    label: 'Battery charging',
    entityId: 'sensor.battery_charge_power',
  },
}

export const Invalid: Story = {
  args: {
    status: 'invalid',
    label: 'Grid import',
    entityId: 'sensor.power_from_grid',
  },
}

export const AllStates: Story = {
  name: 'All states',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <SensorHealthBadge status="configured" label="Solar power" entity-id="sensor.pv_power" />
        <SensorHealthBadge status="missing" label="Battery level" />
        <SensorHealthBadge status="unavailable" label="Grid import" entity-id="sensor.power_from_grid" />
        <SensorHealthBadge status="invalid" label="Home consumption" entity-id="sensor.load_power" />
      </div>
    `,
    components: { SensorHealthBadge },
  }),
}
